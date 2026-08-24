"use server";

import { revalidatePath } from "next/cache";
import { canAccessAdmin, canApproveTeachers, getSignedInUser } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import {
  currentSchoolYear,
  isValidBirthYear,
  isValidGrade,
  isValidStudentNo,
} from "@/lib/grade";

type Result = { ok: true } | { ok: false; message: string };

/**
 * 부적절한 아이디 등을 사용하는 계정을 탈퇴 처리한다.
 * auth.users 를 지우면 profiles·학습 기록이 CASCADE 로 함께 사라지며,
 * removed_accounts 에 아이디를 남겨 두어 로그인·재가입 시 사유를 안내한다.
 *
 * 권한: 슈퍼관리자(HMAC) 또는 admin 역할만.
 */
export async function removeStudentAccount(
  userId: string,
  reason: string
): Promise<Result> {
  if (!(await canApproveTeachers())) {
    return { ok: false, message: "권한이 없습니다." };
  }
  if (!userId) return { ok: false, message: "사용자 ID 누락" };

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }

  const { data: prof, error: pErr } = await admin
    .from("profiles")
    .select("login_id, display_name, school_code, role")
    .eq("id", userId)
    .maybeSingle();
  if (pErr) return { ok: false, message: pErr.message };
  if (!prof) return { ok: false, message: "해당 사용자를 찾을 수 없습니다." };
  if (prof.role === "admin") {
    return { ok: false, message: "관리자 계정은 이 화면에서 탈퇴시킬 수 없습니다." };
  }

  // 처리자 표시 (슈퍼관리자는 로그인 사용자가 없을 수 있음)
  const me = await getSignedInUser();
  const removedBy = me?.profile?.display_name ?? "superadmin";

  // 사유 기록 — 아이디가 있어야 나중에 안내할 수 있다
  if (prof.login_id) {
    const { error: rErr } = await admin.from("removed_accounts").upsert(
      {
        login_id: prof.login_id,
        display_name: prof.display_name,
        school_code: prof.school_code,
        reason: reason.trim() || "부적절한 아이디 사용",
        removed_at: new Date().toISOString(),
        removed_by: removedBy,
      },
      { onConflict: "login_id" }
    );
    if (rErr) return { ok: false, message: rErr.message };
  }

  // 계정 삭제 (profiles·학습 기록은 CASCADE 로 함께 삭제)
  const { error: dErr } = await admin.auth.admin.deleteUser(userId);
  if (dErr) return { ok: false, message: dErr.message };

  revalidatePath("/admin/students");
  return { ok: true };
}

/**
 * 학생의 학적 정보(이름·학교·학년·반·번호·출생연도)를 고친다.
 *
 * 권한: 슈퍼관리자(HMAC) 또는 admin 역할만.
 * 교원(teacher)은 제외한다 — 학교를 바꿀 수 있으면 남의 학교 학생을
 * 제 학교로 끌어올 수 있기 때문이다.
 *
 * 학년·반을 고치면 grade_year 도 올해로 맞춰 준다. 그래야 학생이
 * 다음 로그인 때 다시 입력하라는 창을 보지 않는다.
 */
export async function updateStudentProfile(input: {
  userId: string;
  displayName: string;
  schoolCode: string;
  birthYear: number | null;
  grade: number | null;
  classNo: number | null;
  studentNo: number | null;
}): Promise<Result> {
  if (!(await canApproveTeachers())) {
    return { ok: false, message: "권한이 없습니다." };
  }
  if (!input.userId) return { ok: false, message: "사용자 ID 누락" };

  const displayName = input.displayName.trim();
  if (displayName.length < 2) {
    return { ok: false, message: "이름은 2자 이상 입력해 주세요." };
  }
  if (!input.schoolCode) {
    return { ok: false, message: "학교를 선택해 주세요." };
  }
  if (input.birthYear != null && !isValidBirthYear(input.birthYear)) {
    return { ok: false, message: "출생연도를 올바르게 입력해 주세요." };
  }
  if (input.studentNo != null && !isValidStudentNo(input.studentNo)) {
    return { ok: false, message: "번호는 1~60 사이로 입력해 주세요." };
  }
  // 학년·반은 둘 다 있거나 둘 다 없어야 한다 (한쪽만 있으면 통계가 새어 나간다)
  if ((input.grade == null) !== (input.classNo == null)) {
    return { ok: false, message: "학년과 반은 함께 지정해 주세요." };
  }

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }

  const { data: prof, error: pErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", input.userId)
    .maybeSingle();
  if (pErr) return { ok: false, message: pErr.message };
  if (!prof) return { ok: false, message: "해당 사용자를 찾을 수 없습니다." };
  if (prof.role !== "student") {
    return { ok: false, message: "학생 계정만 이 화면에서 수정할 수 있습니다." };
  }

  const { data: school, error: sErr } = await admin
    .from("schools")
    .select("code, type")
    .eq("code", input.schoolCode)
    .maybeSingle();
  if (sErr) return { ok: false, message: sErr.message };
  if (!school) return { ok: false, message: "선택한 학교를 찾을 수 없습니다." };

  if (input.grade != null && !isValidGrade(input.grade, school.type)) {
    return { ok: false, message: "이 학교에 없는 학년입니다." };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      display_name: displayName,
      school_code: input.schoolCode,
      birth_year: input.birthYear,
      grade: input.grade,
      class_no: input.classNo,
      student_no: input.studentNo,
      // 학년·반을 지웠으면 학년도도 지운다 → 학생에게 다시 묻게 된다
      grade_year: input.grade == null ? null : currentSchoolYear(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${input.userId}`);
  return { ok: true };
}

// ── 임시 비밀번호 발급 ────────────────────────────────────────────
// 혼동되기 쉬운 문자(0/O, 1/l/I)를 뺀 8자.
function generateTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

type PasswordResult =
  | { ok: true; password: string }
  | { ok: false; message: string };

/**
 * 학생에게 임시 비밀번호를 발급한다.
 *
 * /admin/users 의 issueTempPassword 와 달리 교원도 쓸 수 있다.
 * 다만 교원은 '제 학교 학생' 만이다:
 *   - 대상이 학생(role='student')이어야 한다 → 교원끼리 서로 못 건드린다
 *   - 대상의 school_code 가 자기 학교와 같아야 한다
 * 슈퍼관리자(HMAC)·admin 은 학교 제한 없이 학생 누구나 가능.
 *
 * 비밀번호를 잊은 아이가 담임을 찾아오는 일이 잦은데, 그때마다
 * 슈퍼관리자를 거치면 수업이 멈춘다.
 */
export async function issueStudentTempPassword(
  userId: string
): Promise<PasswordResult> {
  const access = await canAccessAdmin();
  if (!access.ok) return { ok: false, message: "권한이 없습니다." };
  if (!userId) return { ok: false, message: "사용자 ID 누락" };

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }

  const { data: prof, error: pErr } = await admin
    .from("profiles")
    .select("role, school_code, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (pErr) return { ok: false, message: pErr.message };
  if (!prof) return { ok: false, message: "해당 사용자를 찾을 수 없습니다." };
  if (prof.role !== "student") {
    return {
      ok: false,
      message: "학생 계정만 이 화면에서 재발급할 수 있습니다.",
    };
  }

  const isSuper = access.reason === "hmac" || access.reason === "admin";
  if (!isSuper) {
    const mySchool = access.user?.profile?.school_code ?? null;
    if (!mySchool || prof.school_code !== mySchool) {
      return {
        ok: false,
        message: "소속 학교 학생만 재발급할 수 있습니다.",
      };
    }
  }

  const temp = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: temp,
  });
  if (error) return { ok: false, message: error.message };

  return { ok: true, password: temp };
}
