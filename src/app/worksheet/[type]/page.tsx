import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import {
  TYPE_EMOJI,
  TYPE_LABEL,
  type WorksheetType,
} from "@/lib/worksheet-types";
import { listPublishedWorksheets } from "@/data/worksheets";
import {
  analyzeSago,
  difficultyClass,
  difficultyLabel,
  difficultyOf,
  formatSagoStatsLine,
  parseDifficulty,
} from "@/lib/sago-analyze";
import { HeartButton } from "@/components/HeartButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID: ReadonlySet<WorksheetType> = new Set(["books", "exam", "written"]);

const SUBTITLE: Record<WorksheetType, string> = {
  books: "추천도서 한 권을 깊이 읽고 푸는 독후 활동",
  exam: "평가원 기출 비문학 지문을 사고도구어 관점에서 풀어보기",
  written: "사고도구어가 자연스럽게 등장하는 짧은 글로 매일 학습",
};

const PREVIEW: Record<WorksheetType, string[]> = {
  books: [
    "읽기 전 · 책 제목·표지·소개를 보고 어떤 이야기일지 예상하기",
    "읽은 후 · 책에서 만난 사고도구어 3~5개 찾고 뜻 정리하기",
    "비교·연결 · 비슷한 주제의 다른 책이나 일상 경험과 잇기",
    "나의 글 · 핵심 메시지를 사고도구어를 넣어 한 문단으로 쓰기",
  ],
  exam: [
    "출처 안내 · 평가원 PDF 외부 링크 + 회차·문번호",
    "지문 속 사고도구어 찾기 · 3~4급 사고도구어 표시",
    "의미 추론 · 단어가 문맥에서 어떻게 쓰였는지 풀이",
    "요약·재구성 · 지문의 논지를 한 문단으로 정리",
  ],
  written: [
    "읽기 · 사고도구어 5~10개가 들어간 100~400자 글",
    "단어 찾기 · 글에 등장한 사고도구어 표시·뜻 확인",
    "문맥 활용 · 단어가 문장 안에서 어떤 역할을 했는지 짚기",
    "나의 표현 · 같은 단어로 한 문장 만들기",
  ],
};

export default async function WorksheetListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID.has(type as WorksheetType)) notFound();
  const t = type as WorksheetType;

  const items = await listPublishedWorksheets(t);

  // 즐겨찾기 상태 (로그인 시)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favIds = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("target_id")
      .eq("user_id", user.id)
      .eq("kind", "worksheet");
    for (const r of favs ?? []) favIds.add(r.target_id as string);
  }

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-6">
        <div className="text-xs font-semibold text-fg-muted space-x-2">
          <Link href="/" className="hover:text-fg-strong">
            홈
          </Link>
          <span>·</span>
          <Link href="/worksheet" className="hover:text-fg-strong">
            ← 활동지 목록
          </Link>
        </div>

        <Card as="section" className="px-6 py-7 space-y-3">
          <p className="text-sm font-semibold text-accent-600">
            {TYPE_EMOJI[t]} {TYPE_LABEL[t]}
          </p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            {SUBTITLE[t]}
          </h1>
        </Card>

        {items.length === 0 ? (
          <>
            <Card as="section" className="px-6 py-7 space-y-4 bg-surface-muted">
              <div className="space-y-1">
                <p className="text-xs font-bold text-accent-600">
                  활동지 미리보기
                </p>
                <h2 className="text-base font-bold text-fg-strong">
                  어떤 활동이 들어오나요?
                </h2>
              </div>
              <ul className="text-sm text-fg leading-relaxed space-y-2 pl-1">
                {PREVIEW[t].map((p, i) => (
                  <li key={i}>· {p}</li>
                ))}
              </ul>
            </Card>

            <Card as="section" className="px-6 py-7 text-center space-y-3">
              <p className="text-3xl">{TYPE_EMOJI[t]}</p>
              <p className="text-base font-bold text-fg-strong">
                아직 만들어진 활동지가 없어요
              </p>
              <p className="text-sm text-fg-muted">
                교사가 첫 활동지를 작성하면 여기에 표시됩니다.
              </p>
            </Card>
          </>
        ) : (
          <div className="space-y-2">
            {items.map((w) => {
              const stats =
                (t === "written" || t === "exam") && w.passage
                  ? analyzeSago(w.passage)
                  : null;
              const diff =
                parseDifficulty(w.difficultyOverride) ??
                (stats ? difficultyOf(stats, w.passage) : null);
              return (
                <Card
                  key={w.id}
                  interactive
                  className="px-5 py-4 flex items-start gap-3 border border-transparent hover:border-accent-300 transition-colors"
                >
                  <Link
                    href={`/worksheet/${t}/${w.id}`}
                    className="flex-1 min-w-0 space-y-1"
                  >
                    <p className="text-base font-bold text-fg-strong">{w.title}</p>
                    {w.intro && (
                      <p className="text-sm text-fg-muted line-clamp-2">
                        {w.intro}
                      </p>
                    )}
                    {(stats || diff) && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {stats && (
                          <span className="text-xs font-semibold text-accent-700 bg-accent-50 inline-block px-2 py-0.5 rounded-chip">
                            📊 {formatSagoStatsLine(stats)}
                          </span>
                        )}
                        {diff && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-chip ${difficultyClass(diff)}`}
                          >
                            난이도 {difficultyLabel(diff)}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-fg-subtle pt-1">
                      {new Date(w.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </Link>
                  <HeartButton
                    kind="worksheet"
                    targetId={w.id}
                    initialFavorited={favIds.has(String(w.id))}
                    enabled={!!user}
                    size="sm"
                  />
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
