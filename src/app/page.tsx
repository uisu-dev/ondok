import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";

export default function HomePage() {
  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-10 space-y-6">
        <Card as="section" className="px-6 py-10 text-center space-y-4">
          <p className="text-sm font-semibold tracking-wide text-accent-600">
            충남교육청 온독지수 추천도서
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-fg-strong leading-tight">
            나에게 어울리는 책,
            <br />
            <span className="text-accent-600">온독 플러스</span>가 골라줄게요.
          </h1>
          <p className="text-base text-fg-muted leading-relaxed max-w-[480px] mx-auto">
            MBTI 8문항과 짧은 취향 질문에 답하면,
            <br />
            온독지수 추천도서 214권 중 너에게 꼭 맞는 책을 찾아드려요.
          </p>
          <div className="pt-2">
            <Link href="/quiz" className={buttonClass("primary")}>
              시작하기
            </Link>
          </div>
        </Card>

        <Card as="section" className="px-6 py-6 space-y-4">
          <h2 className="text-lg font-semibold text-fg-strong">
            어떻게 추천해 주나요?
          </h2>
          <ol className="space-y-3">
            {[
              ["MBTI 8문항", "성격 유형을 빠르게 진단해요."],
              ["취향·관심·분위기", "어떤 책을 좋아하는지 확인해요."],
              ["맞춤 추천", "답변에 어울리는 책 3~5권을 보여드려요."],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-fg-strong">{title}</p>
                  <p className="text-sm text-fg-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <OnthinkingBanner />

        <p className="text-xs text-fg-subtle text-center pb-4">
          도서 데이터 출처: 충남교육청 온독지수 추천도서 목록 (2026)
        </p>
      </div>
    </main>
  );
}
