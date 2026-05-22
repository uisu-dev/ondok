import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { WorksheetEditor } from "@/components/admin/WorksheetEditor";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import type { WorksheetType } from "@/lib/worksheet-types";

export const dynamic = "force-dynamic";

const VALID: ReadonlySet<WorksheetType> = new Set(["books", "exam", "written"]);

export default async function NewWorksheetPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { type } = await params;
  if (!VALID.has(type as WorksheetType)) notFound();
  const t = type as WorksheetType;

  const books =
    t === "books"
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

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[820px] px-6 py-8 space-y-5">
          <Link
            href="/admin/new"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 종류 다시 선택
          </Link>
          <WorksheetEditor type={t} books={books} />
        </div>
      </main>
    </div>
  );
}
