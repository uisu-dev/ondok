"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";
import { isValidLoginId, loginIdToEmail } from "@/lib/login-id";
import { isValidBirthYear } from "@/lib/grade";

type SignupResult = { ok: true } | { ok: false; message: string };

export async function signUp(input: {
  loginId: string;
  password: string;
  displayName: string;
  birthYear: number;
  schoolCode: string;
}): Promise<SignupResult> {
  const loginId = input.loginId.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const schoolCode = input.schoolCode.trim();
  const password = input.password;
  const birthYear = input.birthYear;

  if (!isValidLoginId(loginId)) {
    return {
      ok: false,
      message: "아이디는 영문 소문자로 시작하는 4~20자입니다.",
    };
  }
  if (password.length < 8) {
    return { ok: false, message: "비밀번호는 8자 이상 입력해 주세요." };
  }
  if (displayName.length < 2) {
    return { ok: false, message: "이름은 2자 이상 입력해 주세요." };
  }
  if (!isValidBirthYear(birthYear)) {
    return { ok: false, message: "출생연도를 올바르게 입력해 주세요." };
  }
  if (!schoolCode) {
    return { ok: false, message: "학교를 선택해 주세요." };
  }

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }

  // 1) 아이디 중복 검사 (대소문자 무시)
  const { data: dup } = await admin
    .from("profiles")
    .select("id")
    .ilike("login_id", loginId)
    .maybeSingle();
  if (dup) {
    return { ok: false, message: "이미 사용 중인 아이디입니다." };
  }

  // 1-1) 부적절 사용으로 탈퇴 처리된 아이디는 재가입 불가
  const { data: removed } = await admin
    .from("removed_accounts")
    .select("reason")
    .eq("login_id", loginId)
    .maybeSingle();
  if (removed) {
    return {
      ok: false,
      message: `이 아이디는 ${removed.reason ?? "부적절한 사용"}으로 탈퇴 처리되어 사용할 수 없습니다. 다른 아이디로 가입해 주세요.`,
    };
  }

  // 2) 학교 코드 유효성
  const { data: school } = await admin
    .from("schools")
    .select("code")
    .eq("code", schoolCode)
    .maybeSingle();
  if (!school) {
    return { ok: false, message: "선택한 학교를 찾을 수 없습니다." };
  }

  // 3) Supabase Auth 가입 + 로그인 세션 동시 생성
  //    (Supabase Dashboard 의 'Confirm email' 옵션이 OFF 여야 즉시 사용 가능)
  const supabase = await createClient();
  const email = loginIdToEmail(loginId);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
  });
  if (signUpErr) {
    // 'Email confirmation' 켜져 있는 경우 등을 사용자에게 친절히 안내
    if (signUpErr.message.toLowerCase().includes("already")) {
      return { ok: false, message: "이미 사용 중인 아이디입니다." };
    }
    return { ok: false, message: signUpErr.message };
  }
  const userId = signUpData.user?.id;
  if (!userId) {
    return {
      ok: false,
      message:
        "가입은 되었지만 자동 로그인에 실패했어요. Supabase Auth 설정에서 'Confirm email' 을 꺼주세요.",
    };
  }

  // 4) profile 채워 넣기 (트리거가 빈 행을 만들어두었을 것)
  const { error: upErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        login_id: loginId,
        display_name: displayName,
        school_code: schoolCode,
        birth_year: birthYear,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (upErr) {
    // 보상 트랜잭션: profile 채우기 실패 시 방금 만든 auth.users 도 롤백.
    // 그래야 '아이디는 점유됐는데 프로필은 비어있는' 끊긴 상태가 안 남음.
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return { ok: false, message: upErr.message };
  }

  return { ok: true };
}
