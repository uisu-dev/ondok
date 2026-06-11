import Link from "next/link";
import { notFound } from "next/navigation";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import { BookCard } from "@/components/BookCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const book = (booksSeed as Book[]).find((b) => b.id === numId);
  if (!book) notFound();

  // 즐겨찾기 상태
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let favorited = false;
  if (user) {
    const { data } = await supabase
      .from("favorites")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("kind", "book")
      .eq("target_id", String(book.id))
      .maybeSingle();
    favorited = !!data;
  }

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-5">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>
        <BookCard book={book} favorited={favorited} signedIn={!!user} />
      </div>
    </main>
  );
}
