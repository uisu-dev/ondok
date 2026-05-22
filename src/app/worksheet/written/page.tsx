import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function WorksheetWrittenPage() {
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
            사고도구어 활용 지문 활동지
          </p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            짧은 글로 매일 사고도구어 익히기
          </h1>
          <p className="text-sm text-fg leading-relaxed">
            사고도구어가 자연스럽게 등장하는 짧은 글을 등급별로 직접
            만들었어요. 5분이면 한 편을 읽고 활동까지 끝낼 수 있어요.
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
              <strong>읽기</strong> · 사고도구어 5~10개가 자연스럽게 들어간
              100~400자 글 (등급별 길이 조정)
            </li>
            <li>
              <strong>단어 찾기</strong> · 글에 등장한 사고도구어 표시하고 뜻
              확인하기
            </li>
            <li>
              <strong>문맥 활용</strong> · 단어가 문장 안에서 어떤 역할을 했는지
              짚어보기
            </li>
            <li>
              <strong>나의 표현</strong> · 같은 단어를 사용해 한 문장 만들기
            </li>
          </ul>
          <p className="text-xs text-fg-subtle pt-1">
            ※ 글과 활동 모두 온독 플러스가 직접 만들어 게재합니다.
          </p>
        </Card>

        <Card as="section" className="px-6 py-7 text-center space-y-3">
          <p className="text-3xl">✍️</p>
          <h2 className="text-base font-bold text-fg-strong">
            첫 활동지 준비 중이에요
          </h2>
          <p className="text-sm text-fg-muted">
            1급 사고도구어로 만든 짧은 글이 곧 공개됩니다.
          </p>
          <div className="pt-2">
            <Link
              href="/sago"
              className="text-sm font-semibold text-accent-600 hover:text-accent-700"
            >
              먼저 사고도구어 사전 보기 →
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
