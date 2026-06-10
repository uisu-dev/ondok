"use server";

import { canApproveTeachers } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";

type IssueResult =
  | { ok: true; password: string }
  | { ok: false; message: string };

// 혼동되기 쉬운 문자(0/O, 1/l/I) 제외한 임시 비밀번호 8자 생성.
function generateTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** 관리자/슈퍼관리자가 특정 사용자에게 임시 비밀번호를 발급. */
export async function issueTempPassword(userId: string): Promise<IssueResult> {
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

  const temp = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: temp,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true, password: temp };
}
