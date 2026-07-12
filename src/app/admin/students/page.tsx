import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { estimateGradeLabel, estimateGradeNumber } from "@/lib/grade";
import { StudentsTable, type StudentRow } from "./StudentsTable";

export const dynamic = "force-dynamic";

interface DashRow {
  id: string;
  display_name: string | null;
  school_code: string | null;
  school_name: string | null;
  birth_year: number | null;
  mbti: string | null;
  sago: number;
  books: number;
  sheets: number;
}

export default async function StudentsPage() {
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");

  // 슈퍼관리자(HMAC)·admin: 전체 학생 / 교원(teacher): 소속 학교만
  const isSuper = access.reason === "hmac" || access.reason === "admin";
  const teacherSchool = access.user?.profile?.school_code ?? null;
  const teacherSchoolName = access.user?.school?.name ?? null;

  // 교원인데 소속 학교가 없으면 안내
  if (!isSuper && !teacherSchool) {
    return (
      <div>
        <AdminHeader />
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-[820px] px-6 py-8 space-y-4">
            <Link href="/admin" className="text-xs font-semibold text-fg-muted hover:text-fg-strong">
              ← 관리자 대시보드
            </Link>
            <Card as="section" className="px-6 py-8 text-center space-y-2">
              <p className="text-3xl">🏫</p>
              <p className="text-sm text-fg-muted">
                소속 학교가 지정된 교원 계정으로 로그인하면 학생 현황을 볼 수 있어요.
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const targetSchool = isSuper ? null : teacherSchool; // null = 전체

  let students: StudentRow[] = [];
  let envError: string | null = null;
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin.rpc("student_dashboard", {
      p_school_code: targetSchool,
    });
    if (error) throw error;
    students = ((data ?? []) as DashRow[]).map((r) => ({
      id: r.id,
      name: r.display_name ?? "(이름 미입력)",
      schoolName: r.school_name,
      gradeLabel: estimateGradeLabel(r.birth_year),
      gradeNum: estimateGradeNumber(r.birth_year),
      mbti: r.mbti,
      sago: Number(r.sago),
      books: Number(r.books),
      sheets: Number(r.sheets),
    }));
  } catch (e) {
    envError = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
  }

  const n = students.length;
  const sum = (k: "sago" | "books" | "sheets") =>
    students.reduce((a, s) => a + s[k], 0);
  const avg = (total: number) => (n > 0 ? Math.round((total / n) * 10) / 10 : 0);

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[920px] px-6 py-8 space-y-5">
          <Link href="/admin" className="text-xs font-semibold text-fg-muted hover:text-fg-strong">
            ← 관리자 대시보드
          </Link>
          <Card as="section" className="px-6 py-6 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-accent-600">학생 현황</p>
              <h1 className="text-2xl font-bold text-fg-strong">
                {isSuper ? "전체 학생" : teacherSchoolName ?? "우리 학교"}
              </h1>
              <p className="text-sm text-fg-muted">
                {isSuper
                  ? "모든 가입 학생의 학습 현황이에요. 이름·학교·학년으로 필터링할 수 있어요."
                  : "소속 학생들의 학습 현황이에요. 수업 참고 자료로 활용하세요."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/students/words"
                className="h-9 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold flex items-center"
              >
                📊 단어별 학습 현황
              </Link>
            </div>
            <p className="text-xs text-fg-subtle">
              학생 이름을 누르면 그 학생이 급수별로 아는·부족한 단어를 볼 수 있어요.
            </p>
          </Card>

          {envError && (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
              <p className="text-xs text-fg-muted mt-2">
                scripts/migrations/2026-06-20-student-dashboard.sql 가 적용되어 있는지 확인해 주세요.
              </p>
            </Card>
          )}

          {!envError && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="학생 수" value={n} unit="명" />
              <StatCard label="평균 아는 단어" value={avg(sum("sago"))} unit="개" hint={`총 ${sum("sago")}개`} />
              <StatCard label="도서 선택" value={sum("books")} unit="권" hint={`평균 ${avg(sum("books"))}권`} />
              <StatCard label="활동지 풀이" value={sum("sheets")} unit="건" hint={`평균 ${avg(sum("sheets"))}건`} />
            </div>
          )}

          {!envError && (
            <StudentsTable students={students} showSchool={isSuper} />
          )}

          <p className="text-xs text-fg-subtle leading-relaxed">
            · 사고도구어: 학습 모드에서 ‘아는 단어’로 저장한 개수 · 도서: 추천도서에서 하트로 담은 권수
            · 활동지: 답안을 작성·저장한 활동지 수
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
}) {
  return (
    <Card as="section" className="px-4 py-4">
      <p className="text-xs font-semibold text-fg-muted">{label}</p>
      <p className="mt-1">
        <span className="font-bold text-accent-600" style={{ fontSize: 28, lineHeight: 1 }}>
          {value}
        </span>
        <span className="text-fg-muted text-sm ml-0.5">{unit}</span>
      </p>
      {hint && <p className="text-[10px] text-fg-subtle mt-0.5">{hint}</p>}
    </Card>
  );
}
