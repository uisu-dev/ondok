import type { Book, QuizAnswer } from "@/lib/types";
import { getSupabase } from "./supabase";

let cache: Book[] | null = null;

interface SupabaseBookRow {
  id: number;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: Book["category"];
  ondok_index: number;
  cover_url: string;
  description: string;
  naver_link: string;
  isbn: string;
}

function fromRow(row: SupabaseBookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    publisher: row.publisher,
    year: row.year,
    category: row.category,
    ondokIndex: row.ondok_index,
    coverUrl: row.cover_url,
    description: row.description,
    naverLink: row.naver_link,
    isbn: row.isbn,
  };
}

export async function getAllBooks(): Promise<Book[]> {
  if (cache) return cache;
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("books")
      .select(
        "id, title, author, publisher, year, category, ondok_index, cover_url, description, naver_link, isbn"
      );
    if (!error && data) {
      cache = (data as SupabaseBookRow[]).map(fromRow);
      return cache;
    }
    console.warn("Supabase fetch failed, falling back to seed:", error?.message);
  }
  const seed = (await import("./books-seed.json")).default as Book[];
  cache = seed;
  return cache;
}

/**
 * Insert an anonymous quiz log into Supabase.
 * Schema accepts the mode-specific fields and leaves others null.
 * Silent no-op if Supabase is not configured.
 */
export async function logQuiz(
  answer: QuizAnswer,
  recommendedBookIds: number[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const row: Record<string, unknown> = {
    mode: answer.mode,
    recommended_book_ids: recommendedBookIds,
  };
  if (answer.mode === "mbti") {
    row.mbti = answer.mbti;
    row.interests = answer.interests;
    row.mood = answer.mood;
    row.pace = answer.pace;
  } else if (answer.mode === "interest") {
    row.topics = answer.topics;
  } else {
    row.career = answer.career;
  }

  await supabase.from("quiz_logs").insert(row);
}
