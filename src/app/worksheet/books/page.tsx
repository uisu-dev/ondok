import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function WorksheetBooksPage() {
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
            온독 추천도서 활동지
          </p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            추천도서로 푸는 독후 활동
          </h1>
          <p className="text-sm text-fg leading-relaxed">
            온독 플러스가 추천한 책 가운데 하나를 골라 읽고, 사고도구어를
            발견하고, 자기 생각을 표현하는 활동을 풀어볼 수 있어요.
          </p>
        </Card>

        <Card as="section" className="px-6 py-7 space-y-4 bg-surface-muted">
          <div className="space-y-1">
            <p className="text-xs font-bold text-accent-600">활동지 미리보기</p>
            <h2 className="text-base font-bold text-fg-strong">
              어떤 활동이 들어오나요?
            </h2>
          </div>
          <ul className="text-sm text-fg leading-relaxed space-y-2 pl-1">
            <li>
              <strong>읽기 전</strong> · 책 제목·표지·소개를 보고 어떤 이야기일지
              예상해보기
            </li>
            <li>
              <strong>읽은 후</strong> · 책에서 만난 사고도구어 3~5개를 찾고
              뜻을 자기 말로 정리하기
            </li>
            <li>
              <strong>비교·연결</strong> · 비슷한 주제의 다른 책이나 일상
              경험과 연결지어 보기
            </li>
            <li>
              <strong>나의 글</strong> · 한 문단으로 책의 핵심 메시지를
              사고도구어를 넣어 다시 쓰기
            </li>
          </ul>
          <p className="text-xs text-fg-subtle pt-1">
            ※ 책 본문은 옮겨오지 않습니다. 책은 학교 도서관·공공도서관에서
            빌리거나 구매해서 읽으세요.
          </p>
        </Card>

        <Card as="section" className="px-6 py-7 text-center space-y-3">
          <p className="text-3xl">📚</p>
          <h2 className="text-base font-bold text-fg-strong">
            첫 활동지 준비 중이에요
          </h2>
          <p className="text-sm text-fg-muted">
            추천도서 가운데 한 권으로 만든 활동지가 곧 공개됩니다.
          </p>
          <div className="pt-2 flex gap-2 justify-center">
            <Link
              href="/quiz/mbti"
              className="text-sm font-semibold text-accent-600 hover:text-accent-700"
            >
              먼저 책 추천 받아보기 →
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
