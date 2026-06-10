import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canAccessAdmin, hasFullWorksheetAccess } from "@/lib/auth";
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
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) notFound();

  const ws = await getWorksheetAdmin(num);
  if (!ws) notFound();

  // 교원은 본인이 만든 활동지만 수정 가능. HMAC 슈퍼관리자·admin 은 전체 가능.
  if (!hasFullWorksheetAccess(access.reason) && ws.createdBy !== access.user?.id) {
    redirect("/admin?msg=not-owner");
  }

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
    difficultyOverride: ws.difficultyOverride,
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
