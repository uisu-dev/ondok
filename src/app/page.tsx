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
  comingSoon?: boolean;
}

const BOOK_PATHS: PathCard[] = [
  {
    href: "/quiz/mbti",
    emoji: "🧠",
    title: "MBTI로 찾기",
    subtitle: "성격 유형으로 어울리는 책 추천",
  },
  {
    href: "/quiz/interest",
    emoji: "🌱",
    title: "관심사로 찾기",
    subtitle: "좋아하는 주제로 책 추천",
  },
  {
    href: "/quiz/career",
    emoji: "🎓",
    title: "진로·전공으로 찾기",
    subtitle: "꿈꾸는 미래에 어울리는 책 추천",
  },
];

// 온독도서 활동지 (기존 '온독 추천도서 활동지'가 온독도서 섹션으로 이동)
const BOOK_WORKSHEET: PathCard[] = [
  {
    href: "/worksheet/books",
    emoji: "📚",
    title: "온독도서 활동지",
    subtitle: "추천도서로 만든 독후 활동 풀기",
  },
];

const LITERACY_PATHS: PathCard[] = [
  {
    href: "/sago",
    emoji: "📚",
    title: "사고도구어 사전",
    subtitle: "사고도구어를 등급별로 살펴보기",
  },
  {
    href: "/sago/learn",
    emoji: "🎯",
    title: "사고도구어 학습",
    subtitle: "뜻을 보고 단어를 맞히는 랜덤 객관식",
  },
  {
    href: "/worksheet",
    emoji: "✏️",
    title: "사고도구어 활동지",
    subtitle: "모의고사·자체 지문으로 사고도구어 익히기",
  },
];

const GAME_PATHS: PathCard[] = [
  {
    href: "/game",
    emoji: "🃏",
    title: "짝 맞추기",
    subtitle: "카드를 뒤집어 단어와 뜻을 짝지어 보기",
  },
  {
    href: "/game/chosung",
    emoji: "🔤",
    title: "초성 퀴즈",
    subtitle: "초성과 뜻을 보고 사고도구어 맞히기",
  },
  {
    href: "/game/battle",
    emoji: "⚔️",
    title: "사고도구어 배틀",
    subtitle: "퀴즈를 맞혀 사고몬을 공격 · 이기면 승수 기록",
  },
];

/**
 * 메뉴 격자 — 좁은 화면 2칸, 넓은 화면은 항목 수만큼 한 줄에 놓아
 * 빈 칸이 남지 않게 한다. 세로 길이를 줄이는 것이 목적.
 */
function PathGrid({
  children,
  cols,
}: {
  children: React.ReactNode;
  cols: 3 | 4;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 items-stretch ${
        cols === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"
      }`}
    >
      {children}
    </div>
  );
}

/**
 * 정사각형에 가까운 타일. 격자 한 칸을 채운다.
 * span2 를 주면 좁은 화면에서만 두 칸을 차지하며 가로 배치로 바뀐다.
 * (3개짜리 묶음에서 마지막 한 칸이 비어 보이지 않게)
 */
function PathTile({ card, span2 = false }: { card: PathCard; span2?: boolean }) {
  const body = (
    <Card
      interactive={!card.comingSoon}
      className={`h-full px-4 py-4 flex gap-2.5 border transition-colors ${
        span2
          ? "flex-row items-center sm:flex-col sm:items-stretch sm:gap-2.5"
          : "flex-col"
      } ${
        card.comingSoon
          ? "border-border opacity-70"
          : "border-transparent group-hover:border-accent-300"
      }`}
    >
      <div
        className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-2xl ${
          card.comingSoon ? "bg-surface-muted" : "bg-accent-50"
        }`}
      >
        {card.emoji}
      </div>
      <div className={`min-w-0 ${span2 ? "flex-1 sm:flex-none" : ""}`}>
        <p className="text-sm font-bold text-fg-strong leading-snug">
          {card.title}
          {card.comingSoon && (
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-accent-50 text-accent-700 align-middle">
              곧 공개
            </span>
          )}
        </p>
        <p
          className={`text-[11px] text-fg-muted leading-relaxed mt-1 ${
            span2 ? "truncate sm:whitespace-normal sm:line-clamp-2" : "line-clamp-2"
          }`}
        >
          {card.subtitle}
        </p>
      </div>
    </Card>
  );
  const span = span2 ? "col-span-2 sm:col-span-1" : "";
  if (card.comingSoon) return <div className={span}>{body}</div>;
  return (
    <Link href={card.href} className={`block group h-full ${span}`}>
      {body}
    </Link>
  );
}

/** 격자에서 한 줄을 통째로 쓰는 넓은 타일. 홀수로 남는 항목이나 대표 메뉴에 쓴다. */
function PathWide({
  href,
  emoji,
  title,
  subtitle,
  className = "col-span-2 sm:col-span-3",
}: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`block group ${className}`}>
      <Card
        interactive
        className="px-4 py-3.5 flex items-center gap-3 border border-transparent group-hover:border-accent-300 transition-colors"
      >
        <div className="shrink-0 w-11 h-11 rounded-2xl bg-accent-50 flex items-center justify-center text-2xl">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-fg-strong">{title}</p>
          <p className="text-[11px] text-fg-muted truncate">{subtitle}</p>
        </div>
        <span className="shrink-0 text-accent-600 text-lg group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </Card>
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
          <PathGrid cols={4}>
            {BOOK_PATHS.map((c) => (
              <PathTile key={c.href} card={c} />
            ))}
            {BOOK_WORKSHEET.map((c) => (
              <PathTile key={c.href} card={c} />
            ))}
          </PathGrid>
        </section>

        {/* Pillar 2: 고전 읽기 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="📜"
            title="읽기 쉬운 필수 고전소설"
            subtitle="꼭 읽어야 할 고전을 요즘 말로 다듬었어요"
          />
          <PathWide
            href="/works"
            emoji="📜"
            title="작품 읽으러 가기 · 15편"
            subtitle="시대순 배열 · 형광펜 문제 · 작품별 마스터 배지"
            className=""
          />
        </section>

        {/* Pillar 3: 사고도구어 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="📖"
            title="사고도구어"
            subtitle="읽고 이해하는 힘의 기초가 되는 단어들로 학습해요"
          />
          <PathGrid cols={3}>
            {LITERACY_PATHS.map((c, i) => (
              <PathTile
                key={card_key(c, i)}
                card={c}
                span2={i === LITERACY_PATHS.length - 1}
              />
            ))}
          </PathGrid>
        </section>

        {/* 게임: 사고도구어 게임 2종 + 랭킹 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="🎮"
            title="사고도구어 게임"
            subtitle="놀이로 단어를 익히고 랭킹에 도전하세요"
          />
          <PathGrid cols={3}>
            {GAME_PATHS.map((c, i) => (
              <PathTile
                key={c.href}
                card={c}
                span2={i === GAME_PATHS.length - 1}
              />
            ))}
          </PathGrid>

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
