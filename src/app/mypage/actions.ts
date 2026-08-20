"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";
import {
  currentSchoolYear,
  isValidClassNo,
  isValidGrade,
} from "@/lib/grade";

type ActionResult = { ok: true } | { ok: false; message: string };

async function getUserOrFail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export async function applyForTeacher(): Promise<ActionResult> {
  const user = await getUserOrFail();
  if (!user) return { ok: false, message: "로그인이 필요합니다." };

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }
  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("display_name, school_code, role")
    .eq("id", user.id)
    .maybeSingle();
  if (pErr) return { ok: false, message: pErr.message };
  if (!profile) return { ok: false, message: "프로필이 없습니다. 다시 로그인해 주세요." };
  if (profile.role !== "student") {
    return { ok: false, message: "이미 교원/관리자 권한이 있습니다." };
  }
  if (!profile.display_name || !profile.school_code) {
    return { ok: false, message: "이름과 학교를 먼저 입력해 주세요." };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      teacher_application_status: "pending",
      teacher_application_at: new Date().toISOString(),
      teacher_rejection_note: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/mypage");
  return { ok: true };
}

export async function cancelTeacherApplication(): Promise<ActionResult> {
  const user = await getUserOrFail();
  if (!user) return { ok: false, message: "로그인이 필요합니다." };

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }
  const { error } = await admin
    .from("profiles")
    .update({
      teacher_application_status: "none",
      teacher_application_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .eq("teacher_application_status", "pending");
  if (error) return { ok: false, message: error.message };

  revalidatePath("/mypage");
  return { ok: true };
}

/**
 * 학년·반 저장. 로그인 직후 뜨는 안내창과 마이페이지에서 함께 쓴다.
 * 값과 함께 '어느 학년도의 값인지'(grade_year)를 박아 두어야
 * 다음 학년도에 다시 물을 수 있다.
 */
export async function saveClassInfo(input: {
  grade: number;
  classNo: number;
}): Promise<ActionResult> {
  const user = await getUserOrFail();
  if (!user) return { ok: false, message: "로그인이 필요합니다." };

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "서버 오류" };
  }

  // 학년 상한은 학교 종류에 따라 다르므로 프로필의 학교를 보고 판정한다
  const { data: profile } = await admin
    .from("profiles")
    .select("school_code")
    .eq("id", user.id)
    .maybeSingle();
  let schoolType: string | null = null;
  if (profile?.school_code) {
    const { data: school } = await admin
      .from("schools")
      .select("type")
      .eq("code", profile.school_code)
      .maybeSingle();
    schoolType = school?.type ?? null;
  }

  if (!isValidGrade(input.grade, schoolType)) {
    return { ok: false, message: "학년을 다시 골라 주세요." };
  }
  if (!isValidClassNo(input.classNo)) {
    return { ok: false, message: "반을 다시 골라 주세요." };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      grade: input.grade,
      class_no: input.classNo,
      grade_year: currentSchoolYear(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
