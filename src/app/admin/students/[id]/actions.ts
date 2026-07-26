"use server";

import { revalidatePath } from "next/cache";
import { canApproveTeachers, getSignedInUser } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";

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
