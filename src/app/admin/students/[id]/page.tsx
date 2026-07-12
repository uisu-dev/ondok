import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { estimateGradeLabel } from "@/lib/grade";
import sagoData from "@/data/sago-words.json";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import { TYPE_EMOJI, TYPE_LABEL } from "@/lib/worksheet-types";
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

/** 급수별 진도로 개별 지도 방향을 자동 분석. */
function buildAdvice(breakdown: GradeBreakdown[]): string[] {
  const stats = breakdown.map((b) => {
    const total = b.known.length + b.unknown.length;
    return {
      grade: b.grade,
      known: b.known.length,
      total,
      rate: total > 0 ? b.known.length / total : 0,
      unknown: b.unknown,
    };
  });
  const totalKnown = stats.reduce((a, s) => a + s.known, 0);
  const lines: string[] = [];

  if (totalKnown === 0) {
    lines.push(
      "아직 사고도구어 학습 기록이 없어요. 가장 쉬운 1급부터 학습 모드나 게임으로 시작하도록 안내해 주세요."
    );
    return lines;
  }

  const done = stats.filter((s) => s.total > 0 && s.rate >= 0.9);
  if (done.length > 0) {
    lines.push(
      `${done.map((s) => `${s.grade}급`).join("·")}은 대부분 익혔어요(90%↑). 잘하고 있어요!`
    );
  }

  // 집중 급수: 진도가 시작됐지만 미완(0<rate<0.9)인 가장 낮은 급수, 없으면 아직 시작 안 한 가장 낮은 급수
  let focus = stats.find((s) => s.rate > 0 && s.rate < 0.9);
  if (!focus) focus = stats.find((s) => s.known === 0 && s.total > 0);

  if (focus) {
    lines.push(
      `지금은 ${focus.grade}급에 집중할 때예요 (현재 ${focus.known}/${focus.total}, ${Math.round(
        focus.rate * 100
      )}%).`
    );
    const ex = focus.unknown.slice(0, 6);
    if (ex.length > 0) {
      lines.push(`먼저 익히면 좋은 ${focus.grade}급 단어: ${ex.join(", ")} 등`);
    }
  } else {
    lines.push(
      "모든 급수를 훌륭히 익혔어요! 활동지나 배틀 게임으로 심화·복습을 이어가면 좋아요."
    );
  }
  return lines;
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
  let favBooks: Book[] = [];
  let solvedSheets: Array<{
    id: number;
    type: string;
    title: string;
    answeredCount: number;
    updatedAt: string;
  }> = [];
  const gameStats = { matchBest: 0, chosungBest: 0, battleWins: 0 };
  let advice: string[] = [];
  let envError: string | null = null;

  try {
    const admin = getAdminSupabase();
    const { data: prof } = await admin
      .from("profiles")
      .select("display_name, school_code, birth_year, mbti, role")
      .eq("id", id)
      .maybeSingle();
    if (!prof || prof.role !== "student") notFound();
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

    // 사고도구어 진도
    const { data: prog } = await admin
      .from("sago_progress")
      .select("word_key")
      .eq("user_id", id);
    const known = new Set((prog ?? []).map((r) => r.word_key as string));
    const byGrade: Record<number, GradeBreakdown> = {
      1: { grade: 1, known: [], unknown: [] },
      2: { grade: 2, known: [], unknown: [] },
      3: { grade: 3, known: [], unknown: [] },
      4: { grade: 4, known: [], unknown: [] },
    };
    for (const w of ALL_WORDS) {
      if (w.grade < 1 || w.grade > 4) continue;
      const label = displayWord(w);
      if (known.has(`${w.grade}.${w.raw}`)) byGrade[w.grade].known.push(label);
      else byGrade[w.grade].unknown.push(label);
    }
    breakdown = [byGrade[1], byGrade[2], byGrade[3], byGrade[4]];
    advice = buildAdvice(breakdown);

    // 하트 책
    const { data: favs } = await admin
      .from("favorites")
      .select("target_id")
      .eq("user_id", id)
      .eq("kind", "book");
    const allBooks = booksSeed as Book[];
    favBooks = (favs ?? [])
      .map((f) => allBooks.find((b) => String(b.id) === String(f.target_id)))
      .filter((b): b is Book => !!b);

    // 활동지 답안
    const { data: resp } = await admin
      .from("worksheet_responses")
      .select("worksheet_id, answered_count, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false });
    const wsIds = (resp ?? []).map((r) => Number(r.worksheet_id));
    if (wsIds.length > 0) {
      const { data: wss } = await admin
        .from("worksheets")
        .select("id, type, title")
        .in("id", wsIds);
      const wmap = new Map<number, { type: string; title: string }>();
      for (const w of wss ?? []) wmap.set(w.id, { type: w.type, title: w.title });
      solvedSheets = (resp ?? [])
        .map((r) => {
          const w = wmap.get(Number(r.worksheet_id));
          if (!w) return null;
          return {
            id: Number(r.worksheet_id),
            type: w.type,
            title: w.title,
            answeredCount: r.answered_count as number,
            updatedAt: r.updated_at as string,
          };
        })
        .filter(Boolean) as typeof solvedSheets;
    }

    // 게임 활동
    const { data: games } = await admin
      .from("game_scores")
      .select("game_type, score")
      .eq("user_id", id);
    for (const g of games ?? []) {
      const sc = g.score as number;
      if (g.game_type === "match") gameStats.matchBest = Math.max(gameStats.matchBest, sc);
      else if (g.game_type === "chosung") gameStats.chosungBest = Math.max(gameStats.chosungBest, sc);
      else if (g.game_type === "battle") gameStats.battleWins += sc;
    }
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
              {/* 프로필 */}
              <Card as="section" className="px-6 py-6 space-y-2">
                <p className="text-xs font-semibold text-accent-600">학생 상세</p>
                <h1 className="text-2xl font-bold text-fg-strong">
                  {student?.display_name ?? "(이름 미입력)"}
                </h1>
                <p className="text-sm text-fg-muted">
                  {schoolName ?? "학교 미지정"}
                  {student?.birth_year && estimateGradeLabel(student.birth_year) && (
                    <span className="text-accent-600 font-semibold">
                      {" "}· {estimateGradeLabel(student.birth_year)}
                    </span>
                  )}
                  {student?.mbti && (
                    <span className="text-cat-lit font-semibold"> · {student.mbti}</span>
                  )}
                </p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-bold text-accent-600" style={{ fontSize: 32, lineHeight: 1 }}>
                    {totalKnown}
                  </span>
                  <span className="text-sm text-fg-muted">/ {totalAll}개 사고도구어 익힘</span>
                </div>
              </Card>

              {/* 지도 방향 분석 */}
              <Card as="section" className="px-6 py-5 space-y-2 bg-[color-mix(in_oklab,var(--color-accent-500)_6%,white)] border border-accent-200">
                <p className="text-sm font-bold text-accent-700">🧭 사고도구어 지도 방향</p>
                <ul className="space-y-1.5">
                  {advice.map((line, i) => (
                    <li key={i} className="text-sm text-fg-strong leading-relaxed flex gap-1.5">
                      <span className="text-accent-500">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* 게임 활동 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">🎮 게임 활동</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-muted rounded-button px-2 py-3">
                    <p className="text-[10px] font-bold text-fg-muted">🃏 짝 맞추기</p>
                    <p className="text-lg font-bold text-fg-strong">{gameStats.matchBest}</p>
                    <p className="text-[10px] text-fg-subtle">최고 점수</p>
                  </div>
                  <div className="bg-surface-muted rounded-button px-2 py-3">
                    <p className="text-[10px] font-bold text-fg-muted">🔤 초성</p>
                    <p className="text-lg font-bold text-fg-strong">{gameStats.chosungBest}</p>
                    <p className="text-[10px] text-fg-subtle">최고 정답</p>
                  </div>
                  <div className="bg-surface-muted rounded-button px-2 py-3">
                    <p className="text-[10px] font-bold text-fg-muted">⚔️ 배틀</p>
                    <p className="text-lg font-bold text-cat-soc">{gameStats.battleWins}</p>
                    <p className="text-[10px] text-fg-subtle">누적 승수</p>
                  </div>
                </div>
              </Card>

              {/* 하트 책 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">
                  ❤ 담아둔 온독도서 {favBooks.length > 0 ? `· ${favBooks.length}권` : ""}
                </p>
                {favBooks.length === 0 ? (
                  <p className="text-xs text-fg-subtle">아직 하트로 담은 책이 없어요.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {favBooks.map((b) => (
                      <Link key={b.id} href={`/book/${b.id}`} className="block group">
                        <div className="relative w-full aspect-[3/4] rounded-button overflow-hidden bg-surface-muted">
                          {b.coverUrl ? (
                            <Image
                              src={b.coverUrl}
                              alt={`${b.title} 표지`}
                              fill
                              sizes="120px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        <p className="text-[11px] font-bold text-fg-strong mt-1 line-clamp-2 leading-snug">
                          {b.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* 작성한 활동지 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">
                  ✍️ 작성한 활동지 {solvedSheets.length > 0 ? `· ${solvedSheets.length}건` : ""}
                </p>
                {solvedSheets.length === 0 ? (
                  <p className="text-xs text-fg-subtle">아직 작성·저장한 활동지가 없어요.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {solvedSheets.map((w) => (
                      <li key={w.id}>
                        <Link
                          href={`/worksheet/${w.type}/${w.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-button hover:bg-surface-muted transition-colors"
                        >
                          <span aria-hidden className="text-base">
                            {TYPE_EMOJI[w.type as keyof typeof TYPE_EMOJI] ?? "📄"}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-fg-strong truncate">
                              {w.title}
                            </span>
                            <span className="block text-[10px] text-fg-subtle">
                              {TYPE_LABEL[w.type as keyof typeof TYPE_LABEL] ?? w.type} · 답안{" "}
                              {w.answeredCount}개 ·{" "}
                              {new Date(w.updatedAt).toLocaleDateString("ko-KR", {
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* 급수별 아는/모르는 단어 */}
              <p className="text-xs text-fg-subtle px-1 pt-1">
                급수별로 아는 단어와 더 익혀야 할 단어를 볼 수 있어요.
              </p>
              <StudentDetail breakdown={breakdown} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
