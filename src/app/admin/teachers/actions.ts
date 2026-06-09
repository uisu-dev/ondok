"use server";

import { revalidatePath } from "next/cache";
import { canApproveTeachers } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function approveTeacher(userId: string): Promise<ActionResult> {
  if (!(await canApproveTeachers())) {
    return { ok: false, message: "권한이 없습니다." };
  }
  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }
  const { error } = await admin
    .from("profiles")
    .update({
      role: "teacher",
      teacher_application_status: "approved",
      teacher_approved_at: new Date().toISOString(),
      teacher_rejection_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/teachers");
  return { ok: true };
}

export async function rejectTeacher(
  userId: string,
  note: string | null
): Promise<ActionResult> {
  if (!(await canApproveTeachers())) {
    return { ok: false, message: "권한이 없습니다." };
  }
  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }
  const { error } = await admin
    .from("profiles")
    .update({
      teacher_application_status: "rejected",
      teacher_rejection_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/admin/teachers");
  return { ok: true };
}
