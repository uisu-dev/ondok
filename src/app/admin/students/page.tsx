import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { type StudentRow } from "./StudentsTable";
import { StudentsView } from "./StudentsView";
import { loadStudentDashboard } from "./dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
  let fetchedAt = new Date().toISOString();
  try {
    students = await loadStudentDashboard(targetSchool);
    fetchedAt = new Date().toISOString();
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
                scripts/migrations/2026-08-21-student-no.sql 가 적용되어 있는지 확인해 주세요.
              </p>
            </Card>
          )}

          {!envError && (
            <StudentsView
              students={students}
              showSchool={isSuper}
              fetchedAt={fetchedAt}
            />
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
