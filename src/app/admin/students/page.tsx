import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { estimateGradeLabel, estimateGradeNumber } from "@/lib/grade";
import { type StudentRow } from "./StudentsTable";
import { StudentsView } from "./StudentsView";

export const dynamic = "force-dynamic";

interface DashRow {
  id: string;
  login_id: string | null;
  display_name: string | null;
  school_code: string | null;
  school_name: string | null;
  birth_year: number | null;
  grade: number | null;
  class_no: number | null;
  grade_year: number | null;
  mbti: string | null;
  sago: number;
  sago_g1: number;
  sago_g2: number;
  sago_g3: number;
  sago_g4: number;
  books: number;
  sheets: number;
  works_read: number;
  works_done: number;
  battle_wins: number;
  game_plays: number;
  last_active: string | null;
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
      loginId: r.login_id ?? null,
      schoolName: r.school_name,
      gradeLabel: estimateGradeLabel(r.birth_year),
      gradeNum: estimateGradeNumber(r.birth_year),
      grade: r.grade ?? null,
      classNo: r.class_no ?? null,
      mbti: r.mbti,
      sago: Number(r.sago),
      sagoG1: Number(r.sago_g1 ?? 0),
      sagoG2: Number(r.sago_g2 ?? 0),
      sagoG3: Number(r.sago_g3 ?? 0),
      sagoG4: Number(r.sago_g4 ?? 0),
      books: Number(r.books),
      sheets: Number(r.sheets),
      worksRead: Number(r.works_read ?? 0),
      worksDone: Number(r.works_done ?? 0),
      battleWins: Number(r.battle_wins ?? 0),
      gamePlays: Number(r.game_plays ?? 0),
      lastActive: r.last_active ?? null,
    }));
  } catch (e) {
    envError = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
  }

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
                  ? "모든 가입 학생의 학습 현황이에요. 학년·반으로 필터링할 수 있어요."
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
              아래 필터는 요약·분석·표에 모두 적용됩니다.
            </p>
          </Card>

          {envError && (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
              <p className="text-xs text-fg-muted mt-2">
                scripts/migrations/2026-08-20-grade-class.sql 가 적용되어 있는지 확인해 주세요.
              </p>
            </Card>
          )}

          {!envError && (
            <StudentsView students={students} showSchool={isSuper} />
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
