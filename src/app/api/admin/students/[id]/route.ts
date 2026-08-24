import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/auth";
import { loadStudentDetail } from "@/app/admin/students/[id]/load";

export const dynamic = "force-dynamic";

/**
 * GET — 학생 1명의 현황 (학생 목록 모달용).
 *
 * 목록에서 이름을 누르면 페이지를 옮기지 않고 이 데이터를 받아 모달로 띄운다.
 * 여러 학생을 견주어 볼 때 앞뒤로 오가지 않아도 된다.
 *
 * 권한: 상세 페이지와 같다. 교원은 소속 학교 학생만.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await canAccessAdmin();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });
  }
  const { id } = await params;

  const data = await loadStudentDetail(id);
  if (data.error) {
    return NextResponse.json({ ok: false, error: data.error }, { status: 500 });
  }
  if (data.notFound || !data.student) {
    return NextResponse.json(
      { ok: false, error: "학생을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 교원은 제 학교 학생만 볼 수 있다
  const isSuper = access.reason === "hmac" || access.reason === "admin";
  if (!isSuper && data.student.school_code !== access.user?.profile?.school_code) {
    return NextResponse.json({ ok: false, error: "권한이 없습니다." }, { status: 403 });
  }

  // 급수별 단어 목록 전체는 무겁다. 모달에는 개수와 예시만 보낸다.
  // 반대로 학생이 적은 답안(qa)은 교사가 보려는 것이므로 그대로 보낸다.
  return NextResponse.json({
    ok: true,
    student: {
      loginId: data.student.login_id,
      name: data.student.display_name,
      schoolName: data.schoolName,
      grade: data.student.grade,
      classNo: data.student.class_no,
      studentNo: data.student.student_no,
      birthYear: data.student.birth_year,
      mbti: data.student.mbti,
    },
    sago: {
      totalKnown: data.totalKnown,
      totalAll: data.totalAll,
      byGrade: data.breakdown.map((b) => ({
        grade: b.grade,
        known: b.known.length,
        total: b.known.length + b.unknown.length,
        examples: b.unknown.slice(0, 8),
      })),
    },
    advice: data.advice,
    books: data.favBooks.map((b) => ({ id: b.id, title: b.title })),
    sheets: data.solvedSheets,   // 학생이 적은 답안(qa) 포함
    works: data.readWorks.map((w) => ({
      slug: w.slug,
      title: w.title,
      coverEmoji: w.coverEmoji,
      completed: w.completed,
      lastSection: w.lastSection,
      sectionCount: w.sectionCount,
      answered: w.qa.length,
      updatedAt: w.updatedAt,
      qa: w.qa,
    })),
    games: data.gameStats,
  });
}
