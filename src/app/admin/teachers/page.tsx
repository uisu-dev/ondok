import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canApproveTeachers } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { TeacherApprovalRow } from "./TeacherApprovalRow";

export const dynamic = "force-dynamic";

interface PendingProfile {
  id: string;
  login_id: string | null;
  display_name: string | null;
  school_code: string | null;
  schoolName: string | null;
  teacher_application_at: string | null;
  created_at: string;
}

export default async function TeacherApprovalPage() {
  if (!(await canApproveTeachers())) {
    redirect("/admin/login");
  }

  let envError: string | null = null;
  let pending: PendingProfile[] = [];
  try {
    const admin = getAdminSupabase();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select(
        "id, login_id, display_name, school_code, teacher_application_at, created_at"
      )
      .eq("teacher_application_status", "pending")
      .order("teacher_application_at", { ascending: true });
    if (error) throw error;

    const codes = Array.from(
      new Set(
        (profiles ?? [])
          .map((p) => p.school_code)
          .filter((c): c is string => !!c)
      )
    );
    const schoolMap = new Map<string, string>();
    if (codes.length > 0) {
      const { data: schools } = await admin
        .from("schools")
        .select("code, name")
        .in("code", codes);
      for (const s of schools ?? []) schoolMap.set(s.code, s.name);
    }

    pending = (profiles ?? []).map((p) => ({
      id: p.id,
      login_id: p.login_id,
      display_name: p.display_name,
      school_code: p.school_code,
      schoolName: p.school_code ? schoolMap.get(p.school_code) ?? null : null,
      teacher_application_at: p.teacher_application_at,
      created_at: p.created_at,
    }));
  } catch (e) {
    envError = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
  }

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[820px] px-6 py-8 space-y-5">
          <Link
            href="/admin"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 관리자 대시보드
          </Link>
          <Card as="section" className="px-6 py-6 space-y-2">
            <h1 className="text-2xl font-bold text-fg-strong">교원 승인 큐</h1>
            <p className="text-sm text-fg-muted">
              학생 권한으로 가입한 사용자 중 ‘교원 승인 신청’을 한 분들이 표시됩니다.
              이름과 학교를 확인한 뒤 승인 또는 반려해 주세요.
            </p>
          </Card>

          {envError && (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
              <p className="text-xs text-fg-muted mt-2">
                schemas/migrations/2026-06-05-auth-profiles.sql 가 적용되어 있는지 확인해 주세요.
              </p>
            </Card>
          )}

          {!envError && pending.length === 0 && (
            <Card as="section" className="px-6 py-8 text-center">
              <p className="text-3xl">🎉</p>
              <p className="text-sm text-fg-muted mt-2">
                심사 대기 중인 신청이 없어요.
              </p>
            </Card>
          )}

          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map((p) => (
                <TeacherApprovalRow
                  key={p.id}
                  id={p.id}
                  displayName={p.display_name ?? "(이름 미입력)"}
                  schoolName={p.schoolName ?? "(학교 미선택)"}
                  loginId={p.login_id}
                  appliedAt={p.teacher_application_at}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
