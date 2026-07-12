"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

export interface GradeBreakdown {
  grade: number;
  known: string[]; // 아는 단어(표기)
  unknown: string[]; // 모르는 단어(표기)
}

const GRADE_LABEL: Record<number, string> = {
  1: "1급 · 초등 저학년",
  2: "2급 · 초등 고학년",
  3: "3급 · 중학교",
  4: "4급 · 고등학교",
};

function GradeCard({ b }: { b: GradeBreakdown }) {
  const [showKnown, setShowKnown] = useState(false);
  const [showUnknown, setShowUnknown] = useState(false);
  const total = b.known.length + b.unknown.length;
  const pct = total > 0 ? Math.round((b.known.length / total) * 100) : 0;

  return (
    <Card as="section" className="px-5 py-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-fg-strong">
          {GRADE_LABEL[b.grade] ?? `${b.grade}급`}
        </p>
        <p className="text-sm font-bold text-accent-600">
          {b.known.length}
          <span className="text-fg-muted font-normal"> / {total} ({pct}%)</span>
        </p>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
        <div
          className="h-full bg-accent-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 아는 단어 */}
      <div>
        <button
          type="button"
          onClick={() => setShowKnown((v) => !v)}
          className="text-xs font-semibold text-cat-sci"
        >
          ✓ 아는 단어 {b.known.length}개 {showKnown ? "접기" : "펼치기"}
        </button>
        {showKnown && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {b.known.length === 0 ? (
              <span className="text-xs text-fg-subtle">아직 없어요.</span>
            ) : (
              b.known.map((w, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-cat-sci"
                >
                  {w}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* 모르는(아직 안 익힌) 단어 — 개별 지도용 */}
      <div>
        <button
          type="button"
          onClick={() => setShowUnknown((v) => !v)}
          className="text-xs font-semibold text-cat-hum"
        >
          ● 더 익혀야 할 단어 {b.unknown.length}개 {showUnknown ? "접기" : "펼치기"}
        </button>
        {showUnknown && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {b.unknown.length === 0 ? (
              <span className="text-xs text-fg-subtle">모두 익혔어요! 🎉</span>
            ) : (
              b.unknown.map((w, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-chip bg-surface-muted text-fg-muted"
                >
                  {w}
                </span>
              ))
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function StudentDetail({ breakdown }: { breakdown: GradeBreakdown[] }) {
  return (
    <div className="space-y-3">
      {breakdown.map((b) => (
        <GradeCard key={b.grade} b={b} />
      ))}
    </div>
  );
}
