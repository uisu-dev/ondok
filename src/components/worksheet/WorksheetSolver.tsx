"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { Book } from "@/lib/types";
import {
  QTYPE_LABEL,
  TYPE_EMOJI,
  TYPE_LABEL,
  type Question,
  type WorksheetWithQuestions,
} from "@/lib/worksheet-types";

type FontSize = "sm" | "md" | "lg" | "xl";

const FONT_CLASS: Record<FontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const FONT_BUTTONS: { key: FontSize; size: string }[] = [
  { key: "sm", size: "text-[11px]" },
  { key: "md", size: "text-sm" },
  { key: "lg", size: "text-base" },
  { key: "xl", size: "text-lg" },
];

const STORAGE_KEY = "ondok:worksheet-fontsize";

export function WorksheetSolver({
  worksheet,
  book,
}: {
  worksheet: WorksheetWithQuestions;
  book: Book | null;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [fontSize, setFontSize] = useState<FontSize>("md");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontSize | null;
      if (saved && saved in FONT_CLASS) setFontSize(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function changeFontSize(s: FontSize) {
    setFontSize(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  function setAnswer(qIdx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [qIdx]: value }));
  }
  function toggleReveal(qIdx: number) {
    setReveal((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  }

  return (
    <>
      <Card
        as="section"
        className="px-6 py-6 space-y-2 print:shadow-none print:rounded-none print:border print:border-fg-strong"
      >
        <p className="text-xs font-semibold text-accent-600 print:text-fg">
          {TYPE_EMOJI[worksheet.type]} {TYPE_LABEL[worksheet.type]}
        </p>
        <h1 className="text-2xl font-bold text-fg-strong leading-snug">
          {worksheet.title}
        </h1>
        {worksheet.intro && (
          <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-wrap">
            {worksheet.intro}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="text-xs font-semibold text-accent-600 hover:text-accent-700"
          >
            🖨 인쇄하기
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-fg-muted mr-1">글자 크기</span>
            {FONT_BUTTONS.map((b) => {
              const active = b.key === fontSize;
              return (
                <button
                  key={b.key}
                  onClick={() => changeFontSize(b.key)}
                  className={`${b.size} font-bold w-8 h-8 rounded-button border ${
                    active
                      ? "border-accent-500 bg-accent-50 text-accent-700"
                      : "border-border bg-surface text-fg-muted hover:border-accent-300"
                  }`}
                  aria-label={`글자 크기 ${b.key}`}
                  aria-pressed={active}
                >
                  가
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {worksheet.type === "books" && book && (
        <Card
          as="section"
          className="px-5 py-5 flex gap-4 print:shadow-none print:rounded-none print:border print:border-fg-strong print:break-inside-avoid"
        >
          <div className="shrink-0 w-20 sm:w-24">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-muted">
              {book.coverUrl && (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap gap-1">
              <Chip tone={book.category}>{book.category}</Chip>
              <Chip tone="neutral">온독지수 {book.ondokIndex}</Chip>
            </div>
            <p className="text-base font-bold text-fg-strong">{book.title}</p>
            <p className="text-xs text-fg-muted">
              {book.author} · {book.publisher} · {book.year}
            </p>
            <a
              href={book.naverLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 inline-block print:hidden"
            >
              네이버에서 보기 →
            </a>
          </div>
        </Card>
      )}

      {worksheet.type === "exam" && (worksheet.source || worksheet.externalUrl) && (
        <Card
          as="section"
          className="px-5 py-4 space-y-1 print:shadow-none print:rounded-none print:border print:border-fg-strong"
        >
          {worksheet.source && (
            <p className="text-sm font-semibold text-fg-strong">
              출처: {worksheet.source}
            </p>
          )}
          {worksheet.externalUrl && (
            <a
              href={worksheet.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 break-all print:text-fg-strong"
            >
              지문 보기 → {worksheet.externalUrl}
            </a>
          )}
        </Card>
      )}

      {(worksheet.passageImageUrl ||
        (worksheet.type === "written" && worksheet.passage)) && (
        <Card
          as="section"
          className="px-6 py-5 space-y-3 print:shadow-none print:rounded-none print:border print:border-fg-strong print:break-inside-avoid"
        >
          {worksheet.type === "written" && (
            <p className="text-xs font-bold text-accent-600 print:text-fg-strong">
              지문
            </p>
          )}
          {worksheet.passageImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worksheet.passageImageUrl}
              alt="지문 이미지"
              loading="lazy"
              className="block w-full max-h-[480px] object-contain rounded-button bg-surface-muted print:max-h-[60vh]"
            />
          )}
          {worksheet.type === "written" && worksheet.passage && (
            <div
              className={`text-fg-strong leading-relaxed whitespace-pre-wrap break-words ${FONT_CLASS[fontSize]}`}
            >
              {worksheet.passage}
            </div>
          )}
        </Card>
      )}

      <div className="space-y-3">
        {worksheet.questions.map((q, idx) => (
          <QuestionCard
            key={q.id ?? idx}
            index={idx}
            question={q}
            answer={answers[idx]}
            onAnswer={(v) => setAnswer(idx, v)}
            revealed={!!reveal[idx]}
            onToggleReveal={() => toggleReveal(idx)}
          />
        ))}
      </div>

      <p className="text-xs text-fg-subtle text-center print:hidden">
        ⌨️ 작성한 답은 페이지를 떠나면 사라져요. 인쇄해서 종이로 활용하셔도 좋아요.
      </p>
    </>
  );
}

function QuestionCard({
  index,
  question,
  answer,
  onAnswer,
  revealed,
  onToggleReveal,
}: {
  index: number;
  question: Question;
  answer: string | undefined;
  onAnswer: (v: string) => void;
  revealed: boolean;
  onToggleReveal: () => void;
}) {
  return (
    <Card
      as="article"
      className="px-5 py-5 space-y-3 print:shadow-none print:rounded-none print:border print:border-fg-strong print:break-inside-avoid"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold text-accent-700 print:text-fg-strong">
          {index + 1}.
        </span>
        <p className="text-base font-semibold text-fg-strong flex-1 whitespace-pre-wrap">
          {question.prompt}
        </p>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-surface-muted text-fg-muted print:hidden">
          {QTYPE_LABEL[question.type]}
        </span>
      </div>

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt="문제 이미지"
          loading="lazy"
          className="block w-full max-h-[360px] object-contain rounded-button bg-surface-muted print:max-h-[40vh]"
        />
      )}

      {question.type === "multiple_choice" && question.options && (
        <div className="space-y-1.5">
          {question.options.map((opt, i) => {
            const selected = answer === opt.label;
            const showCorrect = revealed && opt.correct;
            return (
              <label
                key={i}
                className={`flex items-start gap-2 px-3 py-2 rounded-button border cursor-pointer transition-colors ${
                  showCorrect
                    ? "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_12%,white)]"
                    : selected
                      ? "border-accent-500 bg-accent-50"
                      : "border-border bg-surface hover:border-accent-300"
                } print:bg-transparent print:border-fg-strong`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  checked={selected}
                  onChange={() => onAnswer(opt.label)}
                  className="mt-1 print:hidden"
                />
                <span className="font-semibold text-fg-strong shrink-0">
                  {opt.label}
                </span>
                <span className="flex-1 text-fg whitespace-pre-wrap">
                  {opt.text}
                </span>
                {showCorrect && (
                  <span className="text-xs font-bold text-[var(--color-cat-sci)] print:hidden">
                    정답
                  </span>
                )}
              </label>
            );
          })}
          <div className="pt-1 print:hidden">
            <button
              onClick={onToggleReveal}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              {revealed ? "정답 가리기" : "정답 보기"}
            </button>
          </div>
        </div>
      )}

      {question.type === "true_false" && question.options && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, i) => {
              const selected = answer === opt.label;
              const showCorrect = revealed && opt.correct;
              const isO = opt.label === "O";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAnswer(opt.label)}
                  className={`min-h-[72px] rounded-button border-2 text-3xl font-bold transition-colors ${
                    showCorrect
                      ? "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-[var(--color-cat-sci)]"
                      : selected
                        ? "border-accent-500 bg-accent-50 text-accent-700"
                        : isO
                          ? "border-border bg-surface text-fg-strong hover:border-accent-300"
                          : "border-border bg-surface text-fg-strong hover:border-accent-300"
                  } print:bg-transparent print:border-fg-strong print:text-fg-strong`}
                  aria-pressed={selected}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="pt-1 print:hidden">
            <button
              onClick={onToggleReveal}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              {revealed ? "정답 가리기" : "정답 보기"}
            </button>
          </div>
        </div>
      )}

      {question.type === "short_answer" && (
        <div className="space-y-2">
          <input
            type="text"
            value={answer ?? ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="답을 입력해 주세요"
            className="w-full h-11 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none print:bg-transparent print:border-0 print:border-b-2 print:border-fg-strong print:rounded-none print:h-10"
          />
          {question.sampleAnswer && (
            <div className="print:hidden">
              <button
                onClick={onToggleReveal}
                className="text-xs font-semibold text-accent-600 hover:text-accent-700"
              >
                {revealed ? "예시 답안 가리기" : "예시 답안 보기"}
              </button>
              {revealed && (
                <p className="mt-1 px-3 py-2 rounded-button bg-[color-mix(in_oklab,var(--color-cat-sci)_8%,white)] text-sm text-fg whitespace-pre-wrap">
                  예시 답안: {question.sampleAnswer}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {question.type === "essay" && (
        <div className="space-y-2">
          <textarea
            value={answer ?? ""}
            onChange={(e) => onAnswer(e.target.value)}
            rows={5}
            placeholder="답안을 자유롭게 작성해 주세요"
            className="w-full px-3 py-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none leading-relaxed print:bg-transparent print:border print:border-fg-strong print:h-32"
          />
          {question.rubric && (
            <div className="print:hidden">
              <button
                onClick={onToggleReveal}
                className="text-xs font-semibold text-accent-600 hover:text-accent-700"
              >
                {revealed ? "채점 기준 가리기" : "채점 기준 보기"}
              </button>
              {revealed && (
                <p className="mt-1 px-3 py-2 rounded-button bg-surface-muted text-xs text-fg leading-relaxed whitespace-pre-wrap">
                  채점 기준: {question.rubric}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
