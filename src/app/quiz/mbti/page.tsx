"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MBTI_QUESTIONS,
  ALL_CATEGORIES,
  MOOD_OPTIONS,
  PACE_OPTIONS,
} from "@/lib/questions";
import { computeMBTI, type AxisAnswers } from "@/lib/mbti";
import type {
  BookCategory,
  MBTIAnswer,
  MBTILetter,
  Mood,
  Pace,
} from "@/lib/types";

const TOTAL_STEPS = MBTI_QUESTIONS.length + 3; // 8 MBTI + interests + mood + pace

export default function MBTIQuizPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mbtiChoices, setMbtiChoices] = useState<MBTILetter[]>([]);
  const [interests, setInterests] = useState<BookCategory[]>([]);
  const [mood, setMood] = useState<Mood | null>(null);
  const [pace, setPace] = useState<Pace | null>(null);

  const progress = useMemo(() => ((step + 1) / TOTAL_STEPS) * 100, [step]);

  function handleMbti(letter: MBTILetter) {
    const next = [...mbtiChoices];
    next[step] = letter;
    setMbtiChoices(next);
    setStep(step + 1);
  }

  function toggleInterest(c: BookCategory) {
    setInterests((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function finish() {
    if (!mood || !pace || interests.length === 0) return;
    const axes: AxisAnswers = { EI: [], SN: [], TF: [], JP: [] };
    MBTI_QUESTIONS.forEach((q, i) => {
      const ans = mbtiChoices[i];
      if (ans) axes[q.axis].push(ans);
    });
    const answer: MBTIAnswer = {
      mode: "mbti",
      mbti: computeMBTI(axes),
      interests,
      mood,
      pace,
    };
    sessionStorage.setItem("ondok:answers", JSON.stringify(answer));
    router.push("/result");
  }

  const mbtiStep = step < MBTI_QUESTIONS.length;
  const interestStep = step === MBTI_QUESTIONS.length;
  const moodStep = step === MBTI_QUESTIONS.length + 1;
  const paceStep = step === MBTI_QUESTIONS.length + 2;

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[640px] px-6 py-8 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-fg-muted">
            <span>{step + 1} / {TOTAL_STEPS} · MBTI로 찾기</span>
            <button
              onClick={() => router.push("/")}
              className="text-fg-subtle hover:text-fg-muted"
            >
              나가기
            </button>
          </div>
          <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {mbtiStep && (
          <MbtiStep
            question={MBTI_QUESTIONS[step]}
            onAnswer={handleMbti}
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
          />
        )}

        {interestStep && (
          <InterestStep
            selected={interests}
            onToggle={toggleInterest}
            onBack={() => setStep(step - 1)}
            onNext={() => (interests.length > 0 ? setStep(step + 1) : undefined)}
          />
        )}

        {moodStep && (
          <MoodStep
            selected={mood}
            onSelect={(m) => {
              setMood(m);
              setStep(step + 1);
            }}
            onBack={() => setStep(step - 1)}
          />
        )}

        {paceStep && (
          <PaceStep
            selected={pace}
            onSelect={setPace}
            onBack={() => setStep(step - 1)}
            onFinish={finish}
          />
        )}
      </div>
    </main>
  );
}

function MbtiStep({
  question,
  onAnswer,
  onBack,
}: {
  question: (typeof MBTI_QUESTIONS)[number];
  onAnswer: (l: MBTILetter) => void;
  onBack?: () => void;
}) {
  return (
    <Card as="section" className="px-6 py-7 space-y-5">
      <h2 className="text-xl font-bold text-fg-strong leading-snug">
        {question.prompt}
      </h2>
      <div className="space-y-3">
        {question.options.map((opt) => (
          <button
            key={opt.letter}
            onClick={() => onAnswer(opt.letter)}
            className="w-full min-h-[56px] px-5 py-4 text-left text-base font-medium rounded-button border border-border bg-surface text-fg-strong hover:border-accent-500 hover:bg-accent-50 transition-colors"
          >
            {opt.label}
          </button>
        ))}
      </div>
      {onBack && (
        <div className="pt-2">
          <button
            onClick={onBack}
            className="text-sm font-medium text-fg-muted hover:text-fg-strong"
          >
            ← 이전
          </button>
        </div>
      )}
    </Card>
  );
}

function InterestStep({
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  selected: BookCategory[];
  onToggle: (c: BookCategory) => void;
  onBack: () => void;
  onNext?: () => void;
}) {
  return (
    <Card as="section" className="px-6 py-7 space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-fg-strong leading-snug">
          관심 있는 분야는?
        </h2>
        <p className="text-sm text-fg-muted">하나 이상 골라 주세요.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ALL_CATEGORIES.map((c) => {
          const active = selected.includes(c);
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              className={`min-h-[64px] rounded-button border-2 font-semibold transition-colors ${
                active
                  ? "border-accent-500 bg-accent-50 text-accent-700"
                  : "border-border bg-surface text-fg-strong hover:border-accent-300"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="text-sm font-medium text-fg-muted hover:text-fg-strong"
        >
          ← 이전
        </button>
        <Button onClick={onNext} disabled={selected.length === 0}>
          다음
        </Button>
      </div>
    </Card>
  );
}

function MoodStep({
  selected,
  onSelect,
  onBack,
}: {
  selected: Mood | null;
  onSelect: (m: Mood) => void;
  onBack: () => void;
}) {
  return (
    <Card as="section" className="px-6 py-7 space-y-5">
      <h2 className="text-xl font-bold text-fg-strong leading-snug">
        어떤 분위기의 책을 읽고 싶어?
      </h2>
      <div className="space-y-3">
        {MOOD_OPTIONS.map((m) => {
          const active = m.value === selected;
          return (
            <button
              key={m.value}
              onClick={() => onSelect(m.value)}
              className={`w-full min-h-[64px] px-5 py-3 text-left rounded-button border transition-colors ${
                active
                  ? "border-accent-500 bg-accent-50"
                  : "border-border bg-surface hover:border-accent-300"
              }`}
            >
              <p className="font-semibold text-fg-strong">{m.label}</p>
              <p className="text-sm text-fg-muted">{m.description}</p>
            </button>
          );
        })}
      </div>
      <div className="pt-2">
        <button
          onClick={onBack}
          className="text-sm font-medium text-fg-muted hover:text-fg-strong"
        >
          ← 이전
        </button>
      </div>
    </Card>
  );
}

function PaceStep({
  selected,
  onSelect,
  onBack,
  onFinish,
}: {
  selected: Pace | null;
  onSelect: (p: Pace) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <Card as="section" className="px-6 py-7 space-y-5">
      <h2 className="text-xl font-bold text-fg-strong leading-snug">
        마지막! 어떤 호흡의 책이 좋아?
      </h2>
      <div className="space-y-3">
        {PACE_OPTIONS.map((p) => {
          const active = p.value === selected;
          return (
            <button
              key={p.value}
              onClick={() => onSelect(p.value)}
              className={`w-full min-h-[64px] px-5 py-3 text-left rounded-button border transition-colors ${
                active
                  ? "border-accent-500 bg-accent-50"
                  : "border-border bg-surface hover:border-accent-300"
              }`}
            >
              <p className="font-semibold text-fg-strong">{p.label}</p>
              <p className="text-sm text-fg-muted">{p.description}</p>
            </button>
          );
        })}
      </div>
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="text-sm font-medium text-fg-muted hover:text-fg-strong"
        >
          ← 이전
        </button>
        <Button onClick={onFinish} disabled={!selected}>
          결과 보기
        </Button>
      </div>
    </Card>
  );
}
