import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";
import { getPopularBooks, getPopularWorksheets } from "@/data/popular";
import { getGameLeaderboard } from "@/data/leaderboard";
import { TYPE_EMOJI, TYPE_LABEL } from "@/lib/worksheet-types";
import { maskName } from "@/lib/mask";

export const dynamic = "force-dynamic";

interface PathCard {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  hint: string;
  comingSoon?: boolean;
}

const BOOK_PATHS: PathCard[] = [
  {
    href: "/quiz/mbti",
    emoji: "🧠",
    title: "MBTI로 찾기",
    subtitle: "성격 유형으로 어울리는 책 추천",
    hint: "8문항 빠른 진단 · 약 2분",
  },
  {
    href: "/quiz/interest",
    emoji: "🌱",
    title: "관심사로 찾기",
    subtitle: "좋아하는 주제로 책 추천",
    hint: "우주 · AI · 환경 · 마음 · 모험 …",
  },
  {
    href: "/quiz/career",
    emoji: "🎓",
    title: "진로·전공으로 찾기",
    subtitle: "꿈꾸는 미래에 어울리는 책 추천",
    hint: "과학 · 의료 · 공학 · 예술 · 교육 …",
  },
];

// 온독도서 활동지 (기존 '온독 추천도서 활동지'가 온독도서 섹션으로 이동)
const BOOK_WORKSHEET: PathCard[] = [
  {
    href: "/worksheet/books",
    emoji: "📚",
    title: "온독도서 활동지",
    subtitle: "추천도서로 만든 독후 활동 풀기",
    hint: "교사가 만든 독후 활동지",
  },
];

const LITERACY_PATHS: PathCard[] = [
  {
    href: "/sago",
    emoji: "📚",
    title: "사고도구어 사전",
    subtitle: "사고도구어를 등급별로 살펴보기",
    hint: "1급 43 · 2급 291 · 3급 584 · 4급 466",
  },
  {
    href: "/sago/learn",
    emoji: "🎯",
    title: "사고도구어 학습",
    subtitle: "뜻을 보고 단어를 맞히는 랜덤 객관식",
    hint: "정답 맞히면 아는 단어로 기록 · 진행도 추적",
  },
  {
    href: "/worksheet",
    emoji: "✏️",
    title: "사고도구어 활동지",
    subtitle: "모의고사·자체 지문으로 사고도구어 익히기",
    hint: "수능·모의고사 · 자체 지문 활동지",
  },
];

function PathItem({ card }: { card: PathCard }) {
  const body = (
    <Card
      interactive={!card.comingSoon}
      className={`px-5 py-5 flex items-center gap-4 border transition-colors ${
        card.comingSoon
          ? "border-border opacity-70"
          : "border-transparent group-hover:border-accent-300"
      }`}
    >
      <div
        className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
          card.comingSoon ? "bg-surface-muted" : "bg-accent-50"
        }`}
      >
        {card.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-fg-strong">{card.title}</p>
          {card.comingSoon && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-accent-50 text-accent-700">
              곧 공개
            </span>
          )}
        </div>
        <p className="text-sm text-fg-muted">{card.subtitle}</p>
        {!card.comingSoon && (
          <p className="text-xs text-fg-subtle mt-1 truncate">{card.hint}</p>
        )}
      </div>
      {!card.comingSoon && (
        <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
          →
        </div>
      )}
    </Card>
  );
  if (card.comingSoon) return body;
  return (
    <Link href={card.href} className="block group">
      {body}
    </Link>
  );
}

function PillarHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="px-1 space-y-1">
      <h2 className="text-xl font-bold text-fg-strong leading-tight">
        <span className="mr-2">{emoji}</span>
        {title}
      </h2>
      <p className="text-sm text-fg-muted">{subtitle}</p>
    </header>
  );
}

export default async function HomePage() {
  const [popularBooks, popularWorksheets, gameLeaders] = await Promise.all([
    getPopularBooks(5),
    getPopularWorksheets(5),
    getGameLeaderboard("battle", 5),
  ]);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-10 space-y-8">
        {/* Hero */}
        <Card as="section" className="px-6 py-8 text-center space-y-3">
          <p className="text-sm font-semibold tracking-wide text-accent-600">
            충남교육청 자료 기반 문해력 성장 공간
          </p>
          {/* h1 은 시각적으로는 로고 이미지로 보여주고, SEO / 스크린리더는 alt 텍스트가 처리 */}
          <h1 className="sr-only">온독 플러스</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ondok-plus-logo.png"
            alt="온독 플러스"
            className="block mx-auto w-full max-w-[360px] h-auto"
          />
          <p className="text-base text-fg-muted leading-relaxed max-w-[460px] mx-auto pt-1">
            온독지수 추천도서{" "}
            <strong className="text-fg-strong">214권</strong>과 사고도구어{" "}
            <strong className="text-fg-strong">1,387개</strong>로
            <br />
            나에게 맞는 책을 찾고 문해력을 다져요.
          </p>
        </Card>

        {/* 인기: 추천 많이 받은 도서 */}
        {popularBooks.length > 0 && (
          <section className="space-y-3">
            <PillarHeader
              emoji="🔥"
              title="지금 인기 있는 온독도서"
              subtitle="친구들이 하트를 많이 누른 책 순서예요"
            />
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {popularBooks.map(({ book, count }, i) => (
                <Link
                  key={book.id}
                  href={`/book/${book.id}`}
                  className="block group shrink-0 w-[112px]"
                >
                  <div className="relative w-full aspect-[3/4] rounded-button overflow-hidden bg-surface-muted">
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={`${book.title} 표지`}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        unoptimized
                      />
                    ) : null}
                    <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-accent-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-fg-strong mt-1.5 line-clamp-2 leading-snug">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-cat-hum font-semibold mt-0.5">
                    ❤ {count}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 인기: 추천 많이 받은 활동지 */}
        {popularWorksheets.length > 0 && (
          <section className="space-y-3">
            <PillarHeader
              emoji="⭐"
              title="인기 활동지"
              subtitle="많은 학생이 담아둔 활동지예요"
            />
            <div className="space-y-2">
              {popularWorksheets.map((w, i) => (
                <Link key={w.id} href={`/worksheet/${w.type}/${w.id}`} className="block group">
                  <Card
                    interactive
                    className="px-4 py-3 flex items-center gap-3 border border-transparent group-hover:border-accent-300"
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span aria-hidden className="text-lg shrink-0">
                      {TYPE_EMOJI[w.type]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-fg-strong truncate">
                        {w.title}
                      </span>
                      <span className="block text-[10px] text-fg-subtle">
                        {TYPE_LABEL[w.type]}
                      </span>
                    </span>
                    <span className="text-xs text-cat-hum font-semibold whitespace-nowrap">
                      ❤ {w.count}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pillar 1: 온독도서 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="📚"
            title="온독도서"
            subtitle="나에게 맞는 책을 찾고 독후 활동으로 이어가요"
          />
          <div className="space-y-3">
            <p className="text-xs font-bold text-fg-muted px-1 pt-1">
              온독도서 추천
            </p>
            {BOOK_PATHS.map((c) => (
              <PathItem key={c.href} card={c} />
            ))}
            <p className="text-xs font-bold text-fg-muted px-1 pt-2">
              온독도서 활동지
            </p>
            {BOOK_WORKSHEET.map((c) => (
              <PathItem key={c.href} card={c} />
            ))}
          </div>
        </section>

        {/* Pillar 2: 사고도구어 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="📖"
            title="사고도구어"
            subtitle="읽고 이해하는 힘의 기초가 되는 단어들로 학습해요"
          />
          <div className="space-y-3">
            {LITERACY_PATHS.map((c, i) => (
              <PathItem key={card_key(c, i)} card={c} />
            ))}
          </div>
        </section>

        {/* 게임: 사고도구어 게임 2종 + 랭킹 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="🎮"
            title="사고도구어 게임"
            subtitle="놀이로 단어를 익히고 랭킹에 도전하세요"
          />
          <Link href="/game" className="block group">
            <Card
              interactive
              className="px-5 py-5 flex items-center gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
            >
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                🃏
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-fg-strong">짝 맞추기</p>
                <p className="text-sm text-fg-muted">
                  카드를 뒤집어 단어와 뜻을 짝지어 보기
                </p>
              </div>
              <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                →
              </div>
            </Card>
          </Link>
          <Link href="/game/chosung" className="block group">
            <Card
              interactive
              className="px-5 py-5 flex items-center gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
            >
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                🔤
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-fg-strong">초성 퀴즈</p>
                <p className="text-sm text-fg-muted">
                  초성과 뜻을 보고 사고도구어 맞히기
                </p>
              </div>
              <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                →
              </div>
            </Card>
          </Link>
          <Link href="/game/battle" className="block group">
            <Card
              interactive
              className="px-5 py-5 flex items-center gap-4 border border-transparent group-hover:border-accent-300 transition-colors"
            >
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                ⚔️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-fg-strong">사고도구어 배틀</p>
                <p className="text-sm text-fg-muted">
                  퀴즈를 맞혀 사고몬을 공격 · 이기면 승수 기록
                </p>
              </div>
              <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                →
              </div>
            </Card>
          </Link>

          {gameLeaders.length > 0 && (
            <Card as="section" className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-fg-muted">
                  🏆 배틀 랭킹 Top 5 (누적 승수)
                </p>
                <Link
                  href="/game/battle"
                  className="text-[11px] font-semibold text-accent-600 hover:text-accent-700"
                >
                  전체 보기 →
                </Link>
              </div>
              <ol className="space-y-1">
                {gameLeaders.map((e, i) => (
                  <li
                    key={e.userId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`w-5 text-center font-bold ${
                        i === 0
                          ? "text-cat-soc"
                          : i === 1
                            ? "text-fg-muted"
                            : i === 2
                              ? "text-cat-hum"
                              : "text-fg-subtle"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-fg-strong font-semibold">
                        {maskName(e.displayName)}
                      </span>
                      {e.schoolName && (
                        <span className="block text-[10px] text-fg-subtle truncate">
                          {e.schoolName}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-accent-600">{e.bestScore}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </section>

        <OnthinkingBanner />

        <div className="space-y-3 pb-4">
          <p className="text-xs text-fg-subtle text-center leading-relaxed">
            도서 데이터: 충남교육청 온독지수 추천도서 목록(2026)
            <br />
            사고도구어 데이터: 충청남도교육청 · 뜻 풀이: 국립국어원 한국어 기초사전
          </p>
        </div>
      </div>
    </main>
  );
}

function card_key(c: PathCard, i: number) {
  return c.href !== "#" ? c.href : `coming-${i}`;
}
