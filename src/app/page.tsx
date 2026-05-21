import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";

interface PathOption {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  hint: string;
}

const PATHS: PathOption[] = [
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

export default function HomePage() {
  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-10 space-y-6">
        {/* Hero */}
        <Card as="section" className="px-6 py-9 text-center space-y-3">
          <p className="text-sm font-semibold tracking-wide text-accent-600">
            충남교육청 온독지수 추천도서
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-fg-strong leading-tight">
            <span className="text-accent-600">온독 플러스</span>가
            <br />
            나에게 어울리는 책을 골라줘요.
          </h1>
          <p className="text-base text-fg-muted leading-relaxed max-w-[480px] mx-auto pt-1">
            세 가지 방법 중에서 골라보세요.
            <br />
            온독지수 추천도서 214권에서 찾아드려요.
          </p>
        </Card>

        {/* 3 paths */}
        <div className="space-y-3">
          {PATHS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="block group"
            >
              <Card
                interactive
                className="px-5 py-5 flex items-center gap-4 transition-colors group-hover:border-accent-300 border border-transparent"
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-accent-50 flex items-center justify-center text-3xl">
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-fg-strong">
                    {p.title}
                  </p>
                  <p className="text-sm text-fg-muted">{p.subtitle}</p>
                  <p className="text-xs text-fg-subtle mt-1 truncate">
                    {p.hint}
                  </p>
                </div>
                <div className="shrink-0 text-accent-600 text-xl group-hover:translate-x-0.5 transition-transform">
                  →
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* 사고도구어 사전 — 보조 링크 */}
        <Link href="/sago" className="block group">
          <Card
            interactive
            className="px-5 py-4 flex items-center gap-4 border border-transparent group-hover:border-accent-300"
          >
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center text-2xl">
              📖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-fg-strong">
                사고도구어 1,387개 살펴보기
              </p>
              <p className="text-xs text-fg-muted">
                문해력의 기반이 되는 단어들을 등급별로 정리했어요.
              </p>
            </div>
            <div className="shrink-0 text-accent-600 text-lg group-hover:translate-x-0.5 transition-transform">
              →
            </div>
          </Card>
        </Link>

        <OnthinkingBanner />

        <p className="text-xs text-fg-subtle text-center pb-4">
          도서 데이터 출처: 충남교육청 온독지수 추천도서 목록 (2026) · 사고도구어
          출처: 충청남도교육청
        </p>
      </div>
    </main>
  );
}
