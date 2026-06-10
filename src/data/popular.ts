import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import type { WorksheetType } from "@/lib/worksheet-types";

export interface PopularBook {
  book: Book;
  count: number;
}
export interface PopularWorksheet {
  id: number;
  type: WorksheetType;
  title: string;
  intro: string | null;
  count: number;
}

interface RpcRow {
  target_id: string;
  cnt: number;
}

/** 즐겨찾기 많이 받은 도서 상위 N (없으면 빈 배열). */
export async function getPopularBooks(limit = 5): Promise<PopularBook[]> {
  try {
    const { getAdminSupabase } = await import("./supabase-admin");
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.rpc("popular_favorites", {
      p_kind: "book",
      p_limit: limit,
    });
    if (error || !data) return [];
    const allBooks = booksSeed as Book[];
    const out: PopularBook[] = [];
    for (const row of data as RpcRow[]) {
      const b = allBooks.find((x) => String(x.id) === String(row.target_id));
      if (b) out.push({ book: b, count: Number(row.cnt) });
    }
    return out;
  } catch {
    return [];
  }
}

/** 즐겨찾기 많이 받은 활동지 상위 N (공개된 것만). */
export async function getPopularWorksheets(limit = 5): Promise<PopularWorksheet[]> {
  try {
    const { getAdminSupabase } = await import("./supabase-admin");
    const supabase = getAdminSupabase();
    // 여유 있게 더 가져와 비공개 제외 후 limit 만큼 남김
    const { data, error } = await supabase.rpc("popular_favorites", {
      p_kind: "worksheet",
      p_limit: limit * 3,
    });
    if (error || !data || (data as RpcRow[]).length === 0) return [];
    const rows = data as RpcRow[];
    const ids = rows.map((r) => Number(r.target_id)).filter((n) => Number.isFinite(n));
    if (ids.length === 0) return [];
    const { data: wss } = await supabase
      .from("worksheets")
      .select("id, type, title, intro, published")
      .in("id", ids)
      .eq("published", true);
    const wmap = new Map<number, { type: WorksheetType; title: string; intro: string | null }>();
    for (const w of wss ?? []) {
      wmap.set(w.id, { type: w.type, title: w.title, intro: w.intro });
    }
    const out: PopularWorksheet[] = [];
    for (const r of rows) {
      const id = Number(r.target_id);
      const w = wmap.get(id);
      if (w) {
        out.push({ id, type: w.type, title: w.title, intro: w.intro, count: Number(r.cnt) });
      }
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}
