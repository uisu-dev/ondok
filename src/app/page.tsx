import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";

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

const LITERACY_PATHS: PathCard[] = [
  {
    href: "/sago",
    emoji: "📚",
    title: "사고도구어 사전",
    subtitle: "1,387개 단어를 등급별로 살펴보기",
    hint: "1급 43 · 2급 293 · 3급 585 · 4급 466",
  },
  {
    href: "#",
    emoji: "✏️",
    title: "사고도구어 활동지",
    subtitle: "단어가 자연스럽게 등장하는 짧은 글로 학습",
    hint: "곧 공개",
    comingSoon: true,
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

export default function HomePage() {
  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-10 space-y-8">
        {/* Hero */}
        <Card as="section" className="px-6 py-9 text-center space-y-3">
          <p className="text-sm font-semibold tracking-wide text-accent-600">
            충남교육청 자료 기반 문해력 성장 공간
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-fg-strong leading-tight">
            <span className="text-accent-600">온독 플러스</span>
          </h1>
          <p className="text-base text-fg-muted leading-relaxed max-w-[460px] mx-auto pt-1">
            온독지수 추천도서{" "}
            <strong className="text-fg-strong">214권</strong>과 사고도구어{" "}
            <strong className="text-fg-strong">1,387개</strong>로
            <br />
            나에게 맞는 책을 찾고 문해력을 다져요.
          </p>
        </Card>

        {/* Pillar 1: 온독도서 추천 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="📚"
            title="온독도서 추천"
            subtitle="나에게 어울리는 책 찾기 · 세 가지 방법 중 골라보세요"
          />
          <div className="space-y-3">
            {BOOK_PATHS.map((c) => (
              <PathItem key={c.href} card={c} />
            ))}
          </div>
        </section>

        {/* Pillar 2: 사고도구어 문해력 */}
        <section className="space-y-3">
          <PillarHeader
            emoji="📖"
            title="사고도구어 문해력"
            subtitle="읽고 이해하는 힘의 기초가 되는 단어들로 학습해요"
          />
          <div className="space-y-3">
            {LITERACY_PATHS.map((c, i) => (
              <PathItem key={card_key(c, i)} card={c} />
            ))}
          </div>
        </section>

        <OnthinkingBanner />

        <p className="text-xs text-fg-subtle text-center pb-4 leading-relaxed">
          도서 데이터: 충남교육청 온독지수 추천도서 목록(2026)
          <br />
          사고도구어 데이터: 충청남도교육청 · 뜻 풀이: 국립국어원 표준국어대사전
        </p>
      </div>
    </main>
  );
}

function card_key(c: PathCard, i: number) {
  return c.href !== "#" ? c.href : `coming-${i}`;
}
