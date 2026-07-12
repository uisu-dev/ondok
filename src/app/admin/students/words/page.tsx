import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import sagoData from "@/data/sago-words.json";
import { WordsStats, type WordStat } from "./WordsStats";

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

export default async function WordsStatsPage() {
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");

  const isSuper = access.reason === "hmac" || access.reason === "admin";
  const teacherSchool = access.user?.profile?.school_code ?? null;
  const teacherSchoolName = access.user?.school?.name ?? null;

  if (!isSuper && !teacherSchool) {
    redirect("/admin/students");
  }
  const targetSchool = isSuper ? null : teacherSchool;

  let rows: WordStat[] = [];
  let studentCount = 0;
  let envError: string | null = null;
  try {
    const admin = getAdminSupabase();
    let sq = admin.from("profiles").select("id").eq("role", "student");
    if (targetSchool) sq = sq.eq("school_code", targetSchool);
    const { data: studs, error } = await sq;
    if (error) throw error;
    const ids = (studs ?? []).map((s) => s.id);
    studentCount = ids.length;

    const cnt: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: prog } = await admin
        .from("sago_progress")
        .select("word_key")
        .in("user_id", ids);
      for (const r of prog ?? []) {
        const k = r.word_key as string;
        cnt[k] = (cnt[k] ?? 0) + 1;
      }
    }

    rows = ALL_WORDS.filter((w) => w.grade >= 1 && w.grade <= 4).map((w) => ({
      grade: w.grade,
      label: displayWord(w),
      learners: cnt[`${w.grade}.${w.raw}`] ?? 0,
    }));
  } catch (e) {
    envError = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
  }

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
          <Card as="section" className="px-6 py-6 space-y-1">
            <p className="text-xs font-semibold text-accent-600">단어별 학습 현황</p>
            <h1 className="text-2xl font-bold text-fg-strong">
              {isSuper ? "전체 학생" : teacherSchoolName ?? "우리 학교"} · 사고도구어
            </h1>
            <p className="text-sm text-fg-muted">
              어떤 사고도구어를 많은 학생이 알고, 어떤 단어를 어려워하는지 볼 수 있어요.
              ‘부족한 순’으로 정렬해 수업에서 먼저 다룰 단어를 찾아보세요.
            </p>
          </Card>

          {envError ? (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
            </Card>
          ) : (
            <WordsStats rows={rows} studentCount={studentCount} />
          )}
        </div>
      </main>
    </div>
  );
}
