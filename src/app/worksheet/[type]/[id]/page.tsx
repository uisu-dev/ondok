import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedWorksheet, getWorksheetAdmin } from "@/data/worksheets";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import type { WorksheetType } from "@/lib/worksheet-types";
import { WorksheetSolver } from "@/components/worksheet/WorksheetSolver";
import { canAccessAdmin, hasFullWorksheetAccess } from "@/lib/auth";
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

  const access = await canAccessAdmin();

  let ws = await getPublishedWorksheet(numId);
  // 비공개 활동지는 작성 교원·관리자만 미리볼 수 있음 (학생·타인은 notFound).
  if (!ws && access.ok) {
    const adminWs = await getWorksheetAdmin(numId);
    if (
      adminWs &&
      (hasFullWorksheetAccess(access.reason) ||
        adminWs.createdBy === access.user?.id)
    ) {
      ws = adminWs;
    }
  }
  if (!ws || ws.type !== type) notFound();

  const isPrivatePreview = !ws.published;

  const book =
    ws.bookId != null
      ? (booksSeed as Book[]).find((b) => b.id === ws.bookId) ?? null
      : null;

  // 교사용 인쇄(정답 포함)는 교원/관리자/슈퍼관리자만.
  const canPrintTeacher = access.ok;

  // 학생에게는 정답·예시 답안을 아예 내려보내지 않는다.
  // 화면에서 버튼만 없애면 페이지 소스에 그대로 남아 베껴 쓸 수 있다.
  // 교원·관리자는 그대로 받으므로 '교사용 인쇄' 에는 전부 나온다.
  const safeWs = canPrintTeacher
    ? ws
    : {
        ...ws,
        sampleAnswer: null, // 활동지 전체 모범 답안
        questions: ws.questions.map((q) => {
          const { sampleAnswer: _s, rubric: _r, ...rest } = q;
          return {
            ...rest,
            // 보기의 정답 표시도 뺀다 (학생 화면에서는 쓰이지 않는다)
            options: rest.options?.map((o) => ({
              label: o.label,
              text: o.text,
              correct: false,
            })),
          };
        }),
      };

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
        {isPrivatePreview && (
          <div className="rounded-button bg-cat-hum/10 border border-cat-hum/30 px-4 py-3 print:hidden">
            <p className="text-sm font-bold text-cat-hum">🔒 비공개 활동지 (미리보기)</p>
            <p className="text-xs text-fg-muted mt-0.5">
              아직 학생·다른 사용자에게는 보이지 않아요. 대시보드에서 ‘공개로’ 전환하면 활동지 목록에 노출됩니다.
            </p>
          </div>
        )}
        <WorksheetSolver
          worksheet={safeWs}
          book={book}
          canPrintTeacher={canPrintTeacher}
          canSeeAnswers={canPrintTeacher}
          canSaveAnswers={!!user}
          initialAnswers={initialAnswers}
        />
      </div>
    </main>
  );
}
