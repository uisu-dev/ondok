import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedWorksheet } from "@/data/worksheets";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import type { WorksheetType } from "@/lib/worksheet-types";
import { WorksheetSolver } from "@/components/worksheet/WorksheetSolver";
import { canAccessAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

  // 로그인 사용자면 기존에 저장한 답안을 불러와 채워줌.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialAnswers: Record<number, string> = {};
  if (user) {
    const { data: resp } = await supabase
      .from("worksheet_responses")
      .select("answers")
      .eq("user_id", user.id)
      .eq("worksheet_id", numId)
      .maybeSingle();
    if (resp?.answers) {
      initialAnswers = resp.answers as Record<number, string>;
    }
  }

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
          canSaveAnswers={!!user}
          initialAnswers={initialAnswers}
        />
      </div>
    </main>
  );
}
