import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canApproveTeachers } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { UserRow } from "./UserRow";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  student: "학생",
  teacher: "교원",
  admin: "관리자",
};

interface PageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  if (!(await canApproveTeachers())) {
    redirect("/admin/login");
  }
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();

  let envError: string | null = null;
  let users: Array<{
    id: string;
    login_id: string | null;
    display_name: string | null;
    role: string;
    schoolName: string | null;
  }> = [];

  try {
    const admin = getAdminSupabase();
    let query = admin
      .from("profiles")
      .select("id, login_id, display_name, school_code, role")
      .order("created_at", { ascending: false });
    if (q) {
      query = query.or(`login_id.ilike.%${q}%,display_name.ilike.%${q}%`);
    }
    query = query.limit(50);
    const { data: profiles, error } = await query;
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

    users = (profiles ?? []).map((p) => ({
      id: p.id,
      login_id: p.login_id,
      display_name: p.display_name,
      role: p.role,
      schoolName: p.school_code ? schoolMap.get(p.school_code) ?? null : null,
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
          <Card as="section" className="px-6 py-6 space-y-3">
            <h1 className="text-2xl font-bold text-fg-strong">사용자 관리</h1>
            <p className="text-sm text-fg-muted">
              비밀번호를 잊은 사용자에게 임시 비밀번호를 발급할 수 있어요. 발급된 임시 비밀번호를
              사용자에게 알려주고, 로그인 후 마이페이지에서 새 비밀번호로 바꾸도록 안내해 주세요.
            </p>
            <form method="get" className="flex gap-2 pt-1">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="아이디 또는 이름 검색"
                className="flex-1 h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
              />
              <button
                type="submit"
                className="h-11 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold"
              >
                검색
              </button>
            </form>
          </Card>

          {envError && (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
            </Card>
          )}

          {!envError && users.length === 0 && (
            <Card as="section" className="px-6 py-8 text-center">
              <p className="text-sm text-fg-muted">
                {q ? "검색 결과가 없어요." : "등록된 사용자가 없어요."}
              </p>
            </Card>
          )}

          {users.length > 0 && (
            <div className="space-y-2">
              {!q && (
                <p className="text-xs text-fg-subtle px-1">
                  최근 가입 50명까지 표시돼요. 더 찾으려면 검색을 이용하세요.
                </p>
              )}
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  id={u.id}
                  loginId={u.login_id}
                  displayName={u.display_name ?? "(이름 미입력)"}
                  schoolName={u.schoolName ?? "(학교 미선택)"}
                  roleLabel={ROLE_LABEL[u.role] ?? u.role}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
