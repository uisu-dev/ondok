import type { Book } from "@/lib/types";
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
    // fall through to seed on error
    console.warn("Supabase fetch failed, falling back to seed:", error?.message);
  }
  const seed = (await import("./books-seed.json")).default as Book[];
  cache = seed;
  return cache;
}

export async function logQuiz(input: {
  mbti: string;
  interests: string[];
  mood: string;
  pace: string;
  recommendedBookIds: number[];
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("quiz_logs").insert({
    mbti: input.mbti,
    interests: input.interests,
    mood: input.mood,
    pace: input.pace,
    recommended_book_ids: input.recommendedBookIds,
  });
}
