// 학생 1명의 현황을 모아 온다.
//
// 상세 페이지(page.tsx)와 모달용 API(/api/admin/students/[id]) 가 같은 것을
// 보여 줘야 하므로 조회 로직을 여기 한 곳에 둔다.

import { getAdminSupabase } from "@/data/supabase-admin";
import sagoData from "@/data/sago-words.json";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import type { GradeBreakdown } from "./StudentDetail";

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

export interface StudentProfileLite {
  login_id: string | null;
  display_name: string | null;
  school_code: string | null;
  birth_year: number | null;
  grade: number | null;
  class_no: number | null;
  student_no: number | null;
  mbti: string | null;
  role: string;
}

export interface ReadWork {
  slug: string;
  title: string;
  coverEmoji: string;
  completed: boolean;
  lastSection: number;
  sectionCount: number;
  updatedAt: string;
  qa: Array<{ prompt: string; answer: string }>;
}

export interface SolvedSheet {
  id: number;
  type: string;
  title: string;
  answeredCount: number;
  updatedAt: string;
  /** 학생이 실제로 적은 답안 (문항 물음 + 답) */
  qa: Array<{ prompt: string; answer: string }>;
}

export interface StudentDetailData {
  student: StudentProfileLite | null;
  schoolName: string | null;
  breakdown: GradeBreakdown[];
  advice: string[];
  favBooks: Book[];
  solvedSheets: SolvedSheet[];
  readWorks: ReadWork[];
  gameStats: { matchBest: number; chosungBest: number; battleWins: number };
  totalKnown: number;
  totalAll: number;
  /** 학생이 아니거나 없는 사용자 */
  notFound: boolean;
  error: string | null;
}

/** 급수별 진도로 개별 지도 방향을 자동 분석. */
export function buildAdvice(breakdown: GradeBreakdown[]): string[] {
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

  // 집중 급수: 진도가 시작됐지만 미완(0<rate<0.9)인 가장 낮은 급수,
  // 없으면 아직 시작 안 한 가장 낮은 급수
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

function emptyBreakdown(): Record<number, GradeBreakdown> {
  return {
    1: { grade: 1, known: [], unknown: [] },
    2: { grade: 2, known: [], unknown: [] },
    3: { grade: 3, known: [], unknown: [] },
    4: { grade: 4, known: [], unknown: [] },
  };
}

export async function loadStudentDetail(id: string): Promise<StudentDetailData> {
  const out: StudentDetailData = {
    student: null,
    schoolName: null,
    breakdown: [],
    advice: [],
    favBooks: [],
    solvedSheets: [],
    readWorks: [],
    gameStats: { matchBest: 0, chosungBest: 0, battleWins: 0 },
    totalKnown: 0,
    totalAll: 0,
    notFound: false,
    error: null,
  };

  try {
    const admin = getAdminSupabase();
    const { data: prof } = await admin
      .from("profiles")
      .select(
        "login_id, display_name, school_code, birth_year, grade, class_no, student_no, mbti, role"
      )
      .eq("id", id)
      .maybeSingle();
    if (!prof || prof.role !== "student") {
      out.notFound = true;
      return out;
    }
    out.student = prof as StudentProfileLite;

    if (prof.school_code) {
      const { data: s } = await admin
        .from("schools")
        .select("name")
        .eq("code", prof.school_code)
        .maybeSingle();
      out.schoolName = s?.name ?? null;
    }

    // 사고도구어 진도
    const { data: prog } = await admin
      .from("sago_progress")
      .select("word_key")
      .eq("user_id", id);
    const known = new Set((prog ?? []).map((r) => r.word_key as string));
    const byGrade = emptyBreakdown();
    for (const w of ALL_WORDS) {
      if (w.grade < 1 || w.grade > 4) continue;
      const label = displayWord(w);
      if (known.has(`${w.grade}.${w.raw}`)) byGrade[w.grade].known.push(label);
      else byGrade[w.grade].unknown.push(label);
    }
    out.breakdown = [byGrade[1], byGrade[2], byGrade[3], byGrade[4]];
    out.advice = buildAdvice(out.breakdown);

    // 하트 책
    const { data: favs } = await admin
      .from("favorites")
      .select("target_id")
      .eq("user_id", id)
      .eq("kind", "book");
    const allBooks = booksSeed as Book[];
    out.favBooks = (favs ?? [])
      .map((f) => allBooks.find((b) => String(b.id) === String(f.target_id)))
      .filter((b): b is Book => !!b);

    // 활동지 답안 — 개수만이 아니라 학생이 적은 내용까지 가져온다
    const { data: resp } = await admin
      .from("worksheet_responses")
      .select("worksheet_id, answers, answered_count, updated_at")
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

      // 문항은 worksheet_questions 에 따로 있다 (works 는 JSONB 였던 것과 다름)
      const { data: qs } = await admin
        .from("worksheet_questions")
        .select("worksheet_id, position, prompt")
        .in("worksheet_id", wsIds)
        .order("position", { ascending: true });
      const qmap = new Map<number, Array<{ position: number; prompt: string }>>();
      for (const q of qs ?? []) {
        const wid = Number(q.worksheet_id);
        const arr = qmap.get(wid) ?? [];
        arr.push({ position: q.position as number, prompt: q.prompt as string });
        qmap.set(wid, arr);
      }

      out.solvedSheets = (resp ?? [])
        .map((r) => {
          const wid = Number(r.worksheet_id);
          const w = wmap.get(wid);
          if (!w) return null;
          const answers = (r.answers as Record<string, string>) ?? {};
          const qa = (qmap.get(wid) ?? [])
            .map((q) => ({
              prompt: q.prompt,
              answer: answers[String(q.position)] ?? "",
            }))
            .filter((x) => x.answer.trim().length > 0);
          return {
            id: wid,
            type: w.type,
            title: w.title,
            answeredCount: r.answered_count as number,
            updatedAt: r.updated_at as string,
            qa,
          };
        })
        .filter(Boolean) as SolvedSheet[];
    }

    // 고전 읽기 + 점검 문제 답안
    const { data: recs } = await admin
      .from("work_records")
      .select("work_id, last_section, completed_at, answers, updated_at")
      .eq("user_id", id)
      .order("updated_at", { ascending: false });
    if (recs && recs.length > 0) {
      const ids = recs.map((r) => Number(r.work_id));
      const { data: ws } = await admin
        .from("works")
        .select("id, slug, title, cover_emoji, body, questions")
        .in("id", ids);
      interface WorkLite {
        id: number;
        slug: string;
        title: string;
        cover_emoji: string | null;
        body: string;
        questions: unknown;
      }
      const wmap = new Map<number, WorkLite>();
      for (const w of (ws ?? []) as WorkLite[]) wmap.set(w.id, w);
      out.readWorks = recs
        .map((r) => {
          const w = wmap.get(Number(r.work_id));
          if (!w) return null;
          const questions = (Array.isArray(w.questions) ? w.questions : []) as Array<{
            position?: number;
            prompt: string;
          }>;
          const answers = (r.answers as Record<string, string>) ?? {};
          const qa = questions
            .map((q, i) => ({
              prompt: q.prompt,
              answer: answers[String(q.position ?? i)] ?? "",
            }))
            .filter((x) => x.answer.trim().length > 0);
          return {
            slug: w.slug,
            title: w.title,
            coverEmoji: w.cover_emoji ?? "📖",
            completed: !!r.completed_at,
            lastSection: (r.last_section as number) ?? 0,
            sectionCount: (String(w.body).match(/^## /gm) || []).length,
            updatedAt: r.updated_at as string,
            qa,
          };
        })
        .filter(Boolean) as ReadWork[];
    }

    // 게임 활동
    const { data: games } = await admin
      .from("game_scores")
      .select("game_type, score")
      .eq("user_id", id);
    for (const g of games ?? []) {
      const sc = g.score as number;
      if (g.game_type === "match")
        out.gameStats.matchBest = Math.max(out.gameStats.matchBest, sc);
      else if (g.game_type === "chosung")
        out.gameStats.chosungBest = Math.max(out.gameStats.chosungBest, sc);
      else if (g.game_type === "battle") out.gameStats.battleWins += sc;
    }
  } catch (e) {
    out.error = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
    return out;
  }

  out.totalKnown = out.breakdown.reduce((a, b) => a + b.known.length, 0);
  out.totalAll = out.breakdown.reduce(
    (a, b) => a + b.known.length + b.unknown.length,
    0
  );
  return out;
}
