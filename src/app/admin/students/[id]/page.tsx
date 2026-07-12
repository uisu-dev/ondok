import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { estimateGradeLabel } from "@/lib/grade";
import sagoData from "@/data/sago-words.json";
import { StudentDetail, type GradeBreakdown } from "./StudentDetail";

export const dynamic = "force-dynamic";

interface WordEntry {
  grade: number;
  word: string;
  suffix: number | null;
  raw: string;
}
const ALL_WORDS = sagoData.words as WordEntry[];

function displayWord(w: WordEntry): string {
  return w.suffix !== null ? `${w.word}(${w.suffix})` : w.word;
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");
  const { id } = await params;

  const isSuper = access.reason === "hmac" || access.reason === "admin";

  let student: {
    display_name: string | null;
    school_code: string | null;
    birth_year: number | null;
    mbti: string | null;
  } | null = null;
  let schoolName: string | null = null;
  let breakdown: GradeBreakdown[] = [];
  let envError: string | null = null;

  try {
    const admin = getAdminSupabase();
    const { data: prof } = await admin
      .from("profiles")
      .select("display_name, school_code, birth_year, mbti, role")
      .eq("id", id)
      .maybeSingle();
    if (!prof || prof.role !== "student") notFound();

    // 교원은 자기 학교 학생만
    if (!isSuper && prof.school_code !== access.user?.profile?.school_code) {
      redirect("/admin/students");
    }
    student = prof;

    if (prof.school_code) {
      const { data: s } = await admin
        .from("schools")
        .select("name")
        .eq("code", prof.school_code)
        .maybeSingle();
      schoolName = s?.name ?? null;
    }

    // 학생이 아는 단어
    const { data: prog } = await admin
      .from("sago_progress")
      .select("word_key")
      .eq("user_id", id);
    const known = new Set((prog ?? []).map((r) => r.word_key as string));

    // 급수별 아는/모르는 분류
    const byGrade: Record<number, GradeBreakdown> = {
      1: { grade: 1, known: [], unknown: [] },
      2: { grade: 2, known: [], unknown: [] },
      3: { grade: 3, known: [], unknown: [] },
      4: { grade: 4, known: [], unknown: [] },
    };
    for (const w of ALL_WORDS) {
      if (w.grade < 1 || w.grade > 4) continue;
      const k = `${w.grade}.${w.raw}`;
      const label = displayWord(w);
      if (known.has(k)) byGrade[w.grade].known.push(label);
      else byGrade[w.grade].unknown.push(label);
    }
    breakdown = [byGrade[1], byGrade[2], byGrade[3], byGrade[4]];
  } catch (e) {
    envError = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
  }

  const totalKnown = breakdown.reduce((a, b) => a + b.known.length, 0);
  const totalAll = breakdown.reduce((a, b) => a + b.known.length + b.unknown.length, 0);

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[720px] px-6 py-8 space-y-5">
          <Link
            href="/admin/students"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 학생 현황
          </Link>

          {envError ? (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
            </Card>
          ) : (
            <>
              <Card as="section" className="px-6 py-6 space-y-2">
                <p className="text-xs font-semibold text-accent-600">학생 상세</p>
                <h1 className="text-2xl font-bold text-fg-strong">
                  {student?.display_name ?? "(이름 미입력)"}
                </h1>
                <p className="text-sm text-fg-muted">
                  {schoolName ?? "학교 미지정"}
                  {student?.birth_year &&
                    estimateGradeLabel(student.birth_year) && (
                      <span className="text-accent-600 font-semibold">
                        {" "}· {estimateGradeLabel(student.birth_year)}
                      </span>
                    )}
                  {student?.mbti && (
                    <span className="text-cat-lit font-semibold"> · {student.mbti}</span>
                  )}
                </p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span
                    className="font-bold text-accent-600"
                    style={{ fontSize: 32, lineHeight: 1 }}
                  >
                    {totalKnown}
                  </span>
                  <span className="text-sm text-fg-muted">
                    / {totalAll}개 사고도구어 익힘
                  </span>
                </div>
              </Card>

              <p className="text-xs text-fg-subtle px-1">
                급수별로 아는 단어와 더 익혀야 할 단어를 볼 수 있어요. 개별 지도에 활용하세요.
              </p>

              <StudentDetail breakdown={breakdown} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
