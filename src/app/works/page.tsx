import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { listPublishedWorks } from "@/data/works";
import { readingMinutes } from "@/lib/work-types";
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
  if (user) {
    try {
      const admin = getAdminSupabase();
      const { data } = await admin
        .from("work_records")
        .select("work_id, completed_at, last_section")
        .eq("user_id", user.id);
      for (const r of data ?? []) {
        if (r.completed_at) done.add(Number(r.work_id));
        else if ((r.last_section as number) > 0) reading.add(Number(r.work_id));
      }
    } catch {
      /* 무시 */
    }
  }

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
          <div className="space-y-3">
            {works.map((w) => (
              <Link key={w.id} href={`/works/${w.slug}`} className="block group">
                <Card
                  interactive
                  className="px-5 py-5 flex items-start gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
                >
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                    {w.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-base font-bold text-fg-strong">
                        {w.title}
                      </p>
                      {done.has(w.id) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-sci)_16%,white)] text-cat-sci">
                          완독
                        </span>
                      )}
                      {!done.has(w.id) && reading.has(w.id) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-accent-100 text-accent-700">
                          읽는 중
                        </span>
                      )}
                    </div>
                    {w.summary && (
                      <p className="text-sm text-fg-muted line-clamp-2 leading-relaxed">
                        {w.summary}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Chip tone="accent">{w.category}</Chip>
                      {w.era && <Chip tone="neutral">{w.era}</Chip>}
                      <span className="text-[11px] text-fg-subtle">
                        약 {readingMinutes(w.charCount)}분 · 점검 문제 {w.questionCount}개
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                    →
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
