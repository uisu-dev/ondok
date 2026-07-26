import type { Work, WorkRecord, WorkSummary } from "@/lib/work-types";
import { getSupabase } from "./supabase";

interface WorkRow {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  category: string;
  era: string | null;
  summary: string | null;
  body: string;
  commentary: string | null;
  cover_emoji: string;
  questions: Work["questions"];
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
    summary: row.summary,
    body: row.body,
    commentary: row.commentary,
    coverEmoji: row.cover_emoji,
    questions: Array.isArray(row.questions) ? row.questions : [],
    published: row.published,
    createdAt: row.created_at,
  };
}

/** 공개된 작품 목록 (본문 제외). */
export async function listPublishedWorks(): Promise<WorkSummary[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("works")
    .select(
      "id, slug, title, author, category, era, summary, cover_emoji, questions, published, created_at, body"
    )
    .eq("published", true)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as WorkRow[]).map((r) => {
    const w = fromRow(r);
    return {
      id: w.id,
      slug: w.slug,
      title: w.title,
      author: w.author,
      category: w.category,
      era: w.era,
      summary: w.summary,
      coverEmoji: w.coverEmoji,
      published: w.published,
      createdAt: w.createdAt,
      questionCount: w.questions.length,
      charCount: r.body.replace(/\s+/g, "").length,
    };
  });
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
    .select("last_section, completed_at, answers, answered_count")
    .eq("user_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();
  if (!data) return null;
  return {
    lastSection: (data.last_section as number) ?? 0,
    completedAt: (data.completed_at as string) ?? null,
    answers: (data.answers as Record<string, string>) ?? {},
    answeredCount: (data.answered_count as number) ?? 0,
  };
}
