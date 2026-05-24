import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { getWorksheetAdmin } from "@/data/worksheets";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  WorksheetEditor,
  type WorksheetEditorInitial,
} from "@/components/admin/WorksheetEditor";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditWorksheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();

  const ws = await getWorksheetAdmin(num);
  if (!ws) notFound();

  const books =
    ws.type === "books"
      ? (booksSeed as Book[]).map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author,
          publisher: b.publisher,
          category: b.category,
          year: b.year,
          ondokIndex: b.ondokIndex,
        }))
      : null;

  const initial: WorksheetEditorInitial = {
    id: ws.id,
    title: ws.title,
    intro: ws.intro,
    bookId: ws.bookId,
    source: ws.source,
    externalUrl: ws.externalUrl,
    passage: ws.passage,
    passageImageUrl: ws.passageImageUrl,
    youtubeUrl: ws.youtubeUrl,
    sampleAnswer: ws.sampleAnswer,
    questions: ws.questions,
  };

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[820px] px-6 py-8 space-y-5">
          <Link
            href="/admin"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 관리자 대시보드
          </Link>
          <WorksheetEditor type={ws.type} books={books} initial={initial} />
        </div>
      </main>
    </div>
  );
}
