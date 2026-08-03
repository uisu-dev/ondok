import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { listPublishedWorks } from "@/data/works";
import { readingMinutes, groupByEra } from "@/lib/work-types";
import { BadgeMedal } from "./[slug]/Badge";
import { getAdminSupabase } from "@/data/supabase-admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorksPage() {
  const works = await listPublishedWorks();

  // 내 읽기 기록 (완독 표시용)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const done = new Set<number>();
  const reading = new Set<number>();
  const badged = new Set<number>();
  if (user) {
    try {
      const admin = getAdminSupabase();
      const { data } = await admin
        .from("work_records")
        .select("work_id, completed_at, last_section, badge_at")
        .eq("user_id", user.id);
      for (const r of data ?? []) {
        if (r.badge_at) badged.add(Number(r.work_id));
        if (r.completed_at) done.add(Number(r.work_id));
        else if ((r.last_section as number) > 0) reading.add(Number(r.work_id));
      }
    } catch {
      /* 무시 */
    }
  }

  const bands = groupByEra(works);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-6">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>

        <Card as="section" className="px-6 py-7 space-y-3">
          <p className="text-sm font-semibold text-accent-600">📜 읽기 쉬운 필수 고전소설</p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            꼭 읽어야 할 고전, 요즘 말로 읽어요
          </h1>
          <p className="text-sm text-fg leading-relaxed">
            흥부전, 춘향전 같은 고전을 읽기 쉽게 다듬었어요. 어려운 옛말 대신
            지금 쓰는 말로 이야기를 따라가고, 다 읽은 뒤에는 작품 해설과
            점검 문제로 마무리해 보세요.
          </p>
          <div className="rounded-button bg-surface-muted px-4 py-3 space-y-1">
            <p className="text-xs font-bold text-fg-strong">
              🏅 작품마다 마스터 배지가 있어요
            </p>
            <p className="text-[11px] text-fg-muted leading-relaxed">
              끝까지 읽고, 본문 형광펜 문제를 모두 맞히고, 점검 문제까지 답하면
              그 작품의 배지를 받아요. 모은 배지는 마이페이지에서 볼 수 있어요.
            </p>
          </div>
          {badged.size > 0 && (
            <p className="text-xs font-bold text-cat-soc">
              지금까지 {badged.size}개 모았어요
            </p>
          )}
          <p className="text-xs text-fg-subtle">
            아래 작품은 <b>쓰인 시대 순서</b>로 놓았어요. 위에서 아래로 읽으면
            우리 소설이 어떻게 변해 왔는지 함께 보여요.
          </p>
        </Card>

        {works.length === 0 ? (
          <Card as="section" className="px-6 py-10 text-center space-y-2">
            <p className="text-3xl">📚</p>
            <p className="text-sm text-fg-muted">
              아직 등록된 작품이 없어요.
            </p>
            <p className="text-xs text-fg-subtle">
              scripts/migrations/2026-07-01-works.sql 과 scripts/works-seed.sql 을
              Supabase 에서 실행하면 작품이 나타납니다.
            </p>
          </Card>
        ) : (
          <div className="space-y-7">
            {bands.map(({ band, works: list }) => (
              <section key={band.key} className="space-y-3">
                {/* 시대 구간 머리 */}
                <div className="flex items-center gap-3 px-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base font-bold text-fg-strong">
                      {band.label}
                    </h2>
                    <span className="text-[11px] font-semibold text-fg-subtle">
                      {band.note}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] font-bold text-fg-subtle shrink-0">
                    {list.length}편
                  </span>
                </div>

                {list.map((w) => (
                  <Link key={w.id} href={`/works/${w.slug}`} className="block group">
                    <Card
                      interactive
                      className="px-5 py-5 flex items-start gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
                    >
                      {badged.has(w.id) ? (
                        <BadgeMedal emoji={w.coverEmoji} size={56} />
                      ) : (
                        <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                          {w.coverEmoji}
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-base font-bold text-fg-strong">
                            {w.title}
                          </p>
                          {badged.has(w.id) ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-soc)_18%,white)] text-[#b45309]">
                              🏅 마스터
                            </span>
                          ) : done.has(w.id) ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-sci)_16%,white)] text-cat-sci">
                              완독
                            </span>
                          ) : reading.has(w.id) ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-accent-100 text-accent-700">
                              읽는 중
                            </span>
                          ) : null}
                        </div>
                        {w.summary && (
                          <p className="text-sm text-fg-muted line-clamp-2 leading-relaxed">
                            {w.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <Chip tone="accent">{w.category}</Chip>
                          {w.author && w.author !== "작자 미상" && (
                            <Chip tone="neutral">{w.author}</Chip>
                          )}
                          <span className="text-[11px] text-fg-subtle">
                            약 {readingMinutes(w.charCount)}분 · 형광펜 문제{" "}
                            {w.quizCount}개
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                        →
                      </div>
                    </Card>
                  </Link>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
