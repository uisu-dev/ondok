import type { Work, WorkRecord, WorkSummary, NoteAnswer } from "@/lib/work-types";
import { quizKeysOf } from "@/lib/work-types";
import { getSupabase } from "./supabase";

interface WorkRow {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  category: string;
  era: string | null;
  era_order: number | null;
  summary: string | null;
  body: string;
  commentary: string | null;
  cover_emoji: string;
  questions: Work["questions"];
  annotations: Work["annotations"] | null;
  published: boolean;
  created_at: string;
}

function fromRow(row: WorkRow): Work {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    category: row.category,
    era: row.era,
    eraOrder: typeof row.era_order === "number" ? row.era_order : 9999,
    summary: row.summary,
    body: row.body,
    commentary: row.commentary,
    coverEmoji: row.cover_emoji,
    questions: Array.isArray(row.questions) ? row.questions : [],
    annotations:
      row.annotations && typeof row.annotations === "object"
        ? row.annotations
        : {},
    published: row.published,
    createdAt: row.created_at,
  };
}

const LIST_COLS =
  "id, slug, title, author, category, era, summary, cover_emoji, questions, published, created_at, body";

/** 공개된 작품 목록 (본문 제외). 시대순(창작 추정 연도) 정렬. */
export async function listPublishedWorks(): Promise<WorkSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const full = await supabase
    .from("works")
    .select(`${LIST_COLS}, era_order, annotations`)
    .eq("published", true)
    .order("era_order", { ascending: true })
    .order("created_at", { ascending: true });

  // era_order / annotations 마이그레이션 전이면 컬럼이 없어 실패한다 → 옛 스키마로 한 번 더
  const res = full.error
    ? await supabase
        .from("works")
        .select(LIST_COLS)
        .eq("published", true)
        .order("created_at", { ascending: true })
    : full;

  const data = res.data as WorkRow[] | null;
  if (res.error || !data) return [];

  return data.map((r) => {
    const w = fromRow(r);
    return {
      id: w.id,
      slug: w.slug,
      title: w.title,
      author: w.author,
      category: w.category,
      era: w.era,
      eraOrder: w.eraOrder,
      summary: w.summary,
      coverEmoji: w.coverEmoji,
      published: w.published,
      createdAt: w.createdAt,
      questionCount: w.questions.length,
      quizCount: quizKeysOf(w.annotations).length,
      // 본문 글자수는 [[표시할 말|키]] 의 키 부분을 빼고 센다
      charCount: r.body
        .replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, "$1")
        .replace(/\s+/g, "").length,
    };
  });
}

/** 공개된 작품 수. 메뉴에 '· N편'을 붙이는 용도라 본문은 가져오지 않는다. */
export async function countPublishedWorks(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("works")
    .select("id", { count: "exact", head: true })
    .eq("published", true);
  if (error) return 0;
  return count ?? 0;
}

/** 공개된 작품 1편 (본문 포함). */
export async function getPublishedWork(slug: string): Promise<Work | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("works")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (!data) return null;
  return fromRow(data as WorkRow);
}

/** 로그인 학생의 읽기 기록. 없으면 null. */
export async function getWorkRecord(
  workId: number
): Promise<WorkRecord | null> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("work_records")
    .select(
      "last_section, completed_at, answers, answered_count, note_answers, badge_at"
    )
    .eq("user_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();
  if (!data) return null;
  return {
    lastSection: (data.last_section as number) ?? 0,
    completedAt: (data.completed_at as string) ?? null,
    answers: (data.answers as Record<string, string>) ?? {},
    answeredCount: (data.answered_count as number) ?? 0,
    noteAnswers: (data.note_answers as Record<string, NoteAnswer>) ?? {},
    badgeAt: (data.badge_at as string) ?? null,
  };
}
