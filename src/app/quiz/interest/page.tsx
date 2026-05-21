"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { INTEREST_TOPICS } from "@/lib/interests";
import type { InterestAnswer } from "@/lib/types";

const MAX_TOPICS = 3;

export default function InterestQuizPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(key: string) {
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_TOPICS) return prev; // cap at 3
      return [...prev, key];
    });
  }

  function finish() {
    if (selected.length === 0) return;
    const answer: InterestAnswer = { mode: "interest", topics: selected };
    sessionStorage.setItem("ondok:answers", JSON.stringify(answer));
    router.push("/result");
  }

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[640px] px-6 py-8 space-y-6">
        <div className="flex justify-between text-xs font-semibold text-fg-muted">
          <span>관심사로 찾기</span>
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
              어떤 주제에 관심 있어?
            </h2>
            <p className="text-sm text-fg-muted">
              최대 {MAX_TOPICS}개까지 고를 수 있어요. ({selected.length}/{MAX_TOPICS})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {INTEREST_TOPICS.map((t) => {
              const active = selected.includes(t.key);
              const disabled =
                !active && selected.length >= MAX_TOPICS;
              return (
                <button
                  key={t.key}
                  onClick={() => toggle(t.key)}
                  disabled={disabled}
                  className={`min-h-[80px] px-3 py-3 rounded-button border-2 text-left transition-colors ${
                    active
                      ? "border-accent-500 bg-accent-50"
                      : "border-border bg-surface hover:border-accent-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border"
                  }`}
                >
                  <div className="text-2xl leading-none mb-1.5">{t.emoji}</div>
                  <p className={`text-sm font-semibold leading-tight ${active ? "text-accent-700" : "text-fg-strong"}`}>
                    {t.label}
                  </p>
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
            <Button onClick={finish} disabled={selected.length === 0}>
              결과 보기
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
