// 사용자 인증 + 프로필 조회 helper (서버 컴포넌트·서버 액션용).
//
// admin-auth.ts (HMAC uisu9060) 은 사이트 슈퍼관리자용으로 그대로 유지.
// 이 모듈은 일반 회원(소셜 로그인)을 다룬다.

import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "teacher" | "admin";
export type TeacherApplicationStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected";

export interface ProfileRow {
  id: string;
  login_id: string | null;
  display_name: string | null;
  school_code: string | null;
  birth_year: number | null;
  /** 학생이 직접 고른 학년·반. grade_year 는 그 값이 어느 학년도의 것인지. */
  grade: number | null;
  class_no: number | null;
  student_no: number | null;
  grade_year: number | null;
  mbti: string | null;
  role: Role;
  teacher_application_status: TeacherApplicationStatus;
  teacher_application_at: string | null;
  teacher_approved_at: string | null;
  teacher_rejection_note: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignedInUser {
  id: string;
  profile: ProfileRow | null;
  school: { code: string; name: string; type: string } | null;
}

/** 로그인된 사용자 + 프로필. 비로그인이면 null. */
export async function getSignedInUser(): Promise<SignedInUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let school = null;
  if (profile?.school_code) {
    const { data: s } = await supabase
      .from("schools")
      .select("code, name, type")
      .eq("code", profile.school_code)
      .maybeSingle();
    school = s ?? null;
  }
  return {
    id: user.id,
    profile: (profile as ProfileRow) ?? null,
    school,
  };
}

export function isTeacherOrAdmin(profile: ProfileRow | null): boolean {
  if (!profile) return false;
  return profile.role === "teacher" || profile.role === "admin";
}

import { isAdmin as isHmacAdmin } from "@/lib/admin-auth";

/**
 * 활동지 관리(/admin) 접근 권한.
 * 1) HMAC 사이트 슈퍼관리자 (uisu9060 비번)
 * 2) 또는 Supabase 로그인 + profile.role ∈ {teacher, admin}
 */
export async function canAccessAdmin(): Promise<{
  ok: boolean;
  reason: "hmac" | "teacher" | "admin" | "none";
  user: SignedInUser | null;
}> {
  if (await isHmacAdmin()) {
    return { ok: true, reason: "hmac", user: null };
  }
  const user = await getSignedInUser();
  if (user?.profile?.role === "admin") {
    return { ok: true, reason: "admin", user };
  }
  if (user?.profile?.role === "teacher") {
    return { ok: true, reason: "teacher", user };
  }
  return { ok: false, reason: "none", user };
}

/**
 * 모든 활동지(타인 작성 포함)를 관리할 수 있는지.
 * - HMAC 슈퍼관리자 + admin role: 전체 관리 가능
 * - teacher: 본인이 만든 것만 (false)
 */
export function hasFullWorksheetAccess(
  reason: "hmac" | "teacher" | "admin" | "none"
): boolean {
  return reason === "hmac" || reason === "admin";
}

/** 교원 승인(role 변경) 권한 — 슈퍼관리자 또는 admin role 만. */
export async function canApproveTeachers(): Promise<boolean> {
  if (await isHmacAdmin()) return true;
  const user = await getSignedInUser();
  return user?.profile?.role === "admin";
}
