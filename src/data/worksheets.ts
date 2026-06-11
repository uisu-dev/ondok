import type {
  Question,
  Worksheet,
  WorksheetDraft,
  WorksheetType,
  WorksheetWithQuestions,
} from "@/lib/worksheet-types";
import { getSupabase } from "./supabase";

interface WorksheetRow {
  id: number;
  type: WorksheetType;
  title: string;
  intro: string | null;
  book_id: number | null;
  source: string | null;
  external_url: string | null;
  passage: string | null;
  passage_image_url: string | null;
  youtube_url: string | null;
  sample_answer: string | null;
  difficulty_override: string | null;
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface QuestionRow {
  id: number;
  worksheet_id: number;
  position: number;
  type: Question["type"];
  prompt: string;
  options: Question["options"] | null;
  sample_answer: string | null;
  rubric: string | null;
  image_url: string | null;
  passage: string | null;
}

function fromWorksheetRow(row: WorksheetRow): Worksheet {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    intro: row.intro,
    bookId: row.book_id,
    source: row.source,
    externalUrl: row.external_url,
    passage: row.passage,
    passageImageUrl: row.passage_image_url,
    youtubeUrl: row.youtube_url,
    sampleAnswer: row.sample_answer,
    difficultyOverride: row.difficulty_override,
    published: row.published,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fromQuestionRow(row: QuestionRow): Question {
  return {
    id: row.id,
    position: row.position,
    type: row.type,
    prompt: row.prompt,
    options: row.options ?? undefined,
    sampleAnswer: row.sample_answer ?? undefined,
    rubric: row.rubric ?? undefined,
    imageUrl: row.image_url ?? undefined,
    passage: row.passage,
  };
}

/** Public list — only published worksheets. RLS + 명시적 필터 이중 안전. */
export async function listPublishedWorksheets(type: WorksheetType): Promise<Worksheet[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .eq("type", type)
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as WorksheetRow[]).map(fromWorksheetRow);
}

/** Public solve — only published. Returns null if missing/unpublished. */
export async function getPublishedWorksheet(id: number): Promise<WorksheetWithQuestions | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: wsRow } = await supabase.from("worksheets").select("*").eq("id", id).maybeSingle();
  if (!wsRow) return null;
  const ws = fromWorksheetRow(wsRow as WorksheetRow);
  if (!ws.published) return null;
  const { data: qRows } = await supabase
    .from("worksheet_questions")
    .select("*")
    .eq("worksheet_id", id)
    .order("position");
  const questions = ((qRows as QuestionRow[]) ?? []).map(fromQuestionRow);
  return { ...ws, questions };
}

/** Admin list — all worksheets regardless of published status (super-admin 전용). */
export async function listAllWorksheetsAdmin(): Promise<Worksheet[]> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as WorksheetRow[]).map(fromWorksheetRow);
}

/** 자신이 만든 활동지만 (교원·관리자 모드용). */
export async function listMyWorksheetsAdmin(userId: string): Promise<Worksheet[]> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as WorksheetRow[]).map(fromWorksheetRow);
}

/** 활동지 소유자 확인용 (created_by 만 조회). null = 존재하지 않음. */
export async function getWorksheetOwner(id: number): Promise<string | null | undefined> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("worksheets")
    .select("created_by")
    .eq("id", id)
    .maybeSingle();
  if (!data) return undefined;
  return (data as { created_by: string | null }).created_by;
}

/** Admin fetch full worksheet (ignores published). */
export async function getWorksheetAdmin(
  id: number
): Promise<WorksheetWithQuestions | null> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { data: wsRow } = await supabase
    .from("worksheets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!wsRow) return null;
  const ws = fromWorksheetRow(wsRow as WorksheetRow);
  const { data: qRows } = await supabase
    .from("worksheet_questions")
    .select("*")
    .eq("worksheet_id", id)
    .order("position");
  const questions = ((qRows as QuestionRow[]) ?? []).map(fromQuestionRow);
  return { ...ws, questions };
}

/** Admin update — replaces the worksheet's metadata + ALL questions
 *  (delete-then-insert keeps semantics simple and reliable). */
export async function updateWorksheetAdmin(
  id: number,
  draft: WorksheetDraft
): Promise<void> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();

  const { error: wsErr } = await supabase
    .from("worksheets")
    .update({
      title: draft.title,
      intro: draft.intro ?? null,
      book_id: draft.bookId ?? null,
      source: draft.source ?? null,
      external_url: draft.externalUrl ?? null,
      passage: draft.passage ?? null,
      passage_image_url: draft.passageImageUrl ?? null,
      youtube_url: draft.youtubeUrl ?? null,
      sample_answer: draft.sampleAnswer ?? null,
      difficulty_override: draft.difficultyOverride ?? null,
      // draft.published 가 명시되면 반영 (수정 화면의 공개 토글)
      ...(typeof draft.published === "boolean"
        ? { published: draft.published }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (wsErr) throw new Error(wsErr.message);

  const { error: delErr } = await supabase
    .from("worksheet_questions")
    .delete()
    .eq("worksheet_id", id);
  if (delErr) throw new Error(delErr.message);

  if (draft.questions.length > 0) {
    const rows = draft.questions.map((q, idx) => ({
      worksheet_id: id,
      position: idx,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? null,
      sample_answer: q.sampleAnswer ?? null,
      rubric: q.rubric ?? null,
      image_url: q.imageUrl ?? null,
      passage: q.passage ?? null,
    }));
    const { error: insErr } = await supabase
      .from("worksheet_questions")
      .insert(rows);
    if (insErr) throw new Error(insErr.message);
  }
}

/** Admin create. createdBy=null 이면 슈퍼관리자(HMAC) 가 만든 것. */
export async function createWorksheetAdmin(
  draft: WorksheetDraft,
  createdBy: string | null
): Promise<number> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { data: ws, error } = await supabase
    .from("worksheets")
    .insert({
      type: draft.type,
      title: draft.title,
      intro: draft.intro ?? null,
      book_id: draft.bookId ?? null,
      source: draft.source ?? null,
      external_url: draft.externalUrl ?? null,
      passage: draft.passage ?? null,
      passage_image_url: draft.passageImageUrl ?? null,
      youtube_url: draft.youtubeUrl ?? null,
      sample_answer: draft.sampleAnswer ?? null,
      difficulty_override: draft.difficultyOverride ?? null,
      // 신규 활동지는 교원이 명시적으로 공개하지 않는 한 비공개로 생성
      published: draft.published ?? false,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error || !ws) throw new Error(error?.message ?? "활동지 생성 실패");

  if (draft.questions.length > 0) {
    const rows = draft.questions.map((q, idx) => ({
      worksheet_id: ws.id,
      position: idx,
      type: q.type,
      prompt: q.prompt,
      options: q.options ?? null,
      sample_answer: q.sampleAnswer ?? null,
      rubric: q.rubric ?? null,
      image_url: q.imageUrl ?? null,
      passage: q.passage ?? null,
    }));
    const { error: qErr } = await supabase.from("worksheet_questions").insert(rows);
    if (qErr) throw new Error(qErr.message);
  }
  return ws.id as number;
}

/** Admin delete. */
export async function deleteWorksheetAdmin(id: number): Promise<void> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("worksheets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Admin: toggle published flag. */
export async function setWorksheetPublished(id: number, published: boolean): Promise<void> {
  const { getAdminSupabase } = await import("./supabase-admin");
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("worksheets")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
