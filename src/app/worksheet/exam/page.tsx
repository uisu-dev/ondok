import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function WorksheetExamPage() {
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
            수능·모의고사 비문학 활동지
          </p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            평가원 기출 지문으로 푸는 사고도구어 학습
          </h1>
          <p className="text-sm text-fg leading-relaxed">
            한국교육과정평가원이 공개한 수능·모의고사 비문학 지문을 사고도구어
            관점에서 다시 읽어보는 활동지예요. 입시 대비와 어휘 학습을 함께
            할 수 있어요.
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
              <strong>출처 안내</strong> · 평가원 PDF 외부 링크 + 출제 회차·문번호
            </li>
            <li>
              <strong>지문 속 사고도구어 찾기</strong> · 지문에 등장하는 3~4급
              사고도구어를 표시하기
            </li>
            <li>
              <strong>의미 추론</strong> · 단어가 문맥에서 어떻게 쓰였는지
              자기 말로 풀이하기
            </li>
            <li>
              <strong>요약·재구성</strong> · 지문의 논지를 한 문단으로 정리하기
            </li>
          </ul>
          <p className="text-xs text-fg-subtle pt-1">
            ※ 지문 본문은 옮겨오지 않습니다. 평가원 공식 자료에서 직접 보고
            오세요.
          </p>
        </Card>

        <Card as="section" className="px-6 py-7 text-center space-y-3">
          <p className="text-3xl">🎯</p>
          <h2 className="text-base font-bold text-fg-strong">
            첫 활동지 준비 중이에요
          </h2>
          <p className="text-sm text-fg-muted">
            최근 모의고사 지문을 골라 만든 활동지가 곧 공개됩니다.
          </p>
        </Card>
      </div>
    </main>
  );
}
