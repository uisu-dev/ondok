import { Card } from "./ui/Card";

export function OnthinkingBanner() {
  return (
    <Card as="section" className="px-6 py-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center text-xl font-bold shrink-0">
        온
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-fg-muted">충남교육청</p>
        <p className="text-base font-semibold text-fg-strong truncate">
          온생각 — 충남 학생 사고력 학습 플랫폼
        </p>
      </div>
      <a
        href="https://onthinking.or.kr/"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 text-sm font-semibold text-accent-600 hover:text-accent-700"
      >
        방문하기 →
      </a>
    </Card>
  );
}
