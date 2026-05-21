"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CAREER_TRACKS } from "@/lib/careers";
import type { CareerAnswer } from "@/lib/types";

export default function CareerQuizPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  function finish() {
    if (!selected) return;
    const answer: CareerAnswer = { mode: "career", career: selected };
    sessionStorage.setItem("ondok:answers", JSON.stringify(answer));
    router.push("/result");
  }

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[640px] px-6 py-8 space-y-6">
        <div className="flex justify-between text-xs font-semibold text-fg-muted">
          <span>진로·전공으로 찾기</span>
          <button
            onClick={() => router.push("/")}
            className="text-fg-subtle hover:text-fg-muted"
          >
            나가기
          </button>
        </div>

        <Card as="section" className="px-6 py-7 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-fg-strong leading-snug">
              어떤 진로·전공에 관심 있어?
            </h2>
            <p className="text-sm text-fg-muted">
              꿈꾸는 미래에 가까운 하나를 골라 주세요.
            </p>
          </div>

          <div className="space-y-2.5">
            {CAREER_TRACKS.map((c) => {
              const active = selected === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setSelected(c.key)}
                  className={`w-full min-h-[72px] px-4 py-3 text-left rounded-button border-2 transition-colors flex items-start gap-3 ${
                    active
                      ? "border-accent-500 bg-accent-50"
                      : "border-border bg-surface hover:border-accent-300"
                  }`}
                >
                  <div className="shrink-0 text-2xl leading-none pt-0.5">
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold ${active ? "text-accent-700" : "text-fg-strong"}`}>
                      {c.label}
                    </p>
                    <p className="text-sm text-fg-muted leading-snug mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium text-fg-muted hover:text-fg-strong"
            >
              ← 처음으로
            </button>
            <Button onClick={finish} disabled={!selected}>
              결과 보기
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
