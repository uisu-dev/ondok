import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedWorksheet } from "@/data/worksheets";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import type { WorksheetType } from "@/lib/worksheet-types";
import { WorksheetSolver } from "@/components/worksheet/WorksheetSolver";
import { canAccessAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID: ReadonlySet<WorksheetType> = new Set(["books", "exam", "written"]);

export default async function WorksheetSolvePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!VALID.has(type as WorksheetType)) notFound();
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const ws = await getPublishedWorksheet(numId);
  if (!ws || ws.type !== type) notFound();

  const book =
    ws.bookId != null
      ? (booksSeed as Book[]).find((b) => b.id === ws.bookId) ?? null
      : null;

  // 교사용 인쇄(정답 포함)는 교원/관리자/슈퍼관리자만.
  const canPrintTeacher = (await canAccessAdmin()).ok;

  return (
    <main className="flex-1 w-full print:bg-white">
      <div className="mx-auto max-w-[760px] px-6 py-8 space-y-5 print:px-0 print:py-0 print:max-w-none">
        <div className="text-xs font-semibold text-fg-muted print:hidden">
          <Link
            href={`/worksheet/${type}`}
            className="hover:text-fg-strong"
          >
            ← 활동지 목록
          </Link>
        </div>
        <WorksheetSolver
          worksheet={ws}
          book={book}
          canPrintTeacher={canPrintTeacher}
        />
      </div>
    </main>
  );
}
