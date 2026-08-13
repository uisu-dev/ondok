"use client";

import { useEffect, useState } from "react";
import type { Annotation, NoteAnswer } from "@/lib/work-types";

/**
 * 본문의 형광펜을 눌렀을 때 뜨는 시트.
 *  - quiz : 보기를 고르면 곧바로 정답 여부와 해설을 보여 준다
 *  - info : 배경지식을 설명한다
 *
 * 이미 맞힌 문제를 다시 열면 정답과 해설을 그대로 보여 준다.
 * 틀렸던 문제도 다시 풀 수 있게 열어 두되, 배지는 첫 시도만 인정하므로
 * 그 사실을 분명히 알려 준다. (배지에 다시 도전하려면 기록을 지워야 한다)
 */
export function AnnotationSheet({
  annotation,
  label,
  prior,
  onClose,
  onPick,
  onRead,
}: {
  annotation: Annotation;
  label: string;
  prior?: NoteAnswer;
  onClose: () => void;
  onPick: (picked: number) => void;
  onRead: () => void;
}) {
  const solved = prior?.ok === true;
  const [picked, setPicked] = useState<number | null>(
    solved ? (annotation.answer ?? null) : null
  );

  // ESC 로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const isQuiz = annotation.type === "quiz";

  // info 는 열어 본 것만으로 확인 처리
  useEffect(() => {
    if (!isQuiz) onRead();
  }, [isQuiz, onRead]);

  const correct =
    picked !== null && typeof annotation.answer === "number"
      ? picked === annotation.answer
      : false;
  // 배지에 인정되는 것은 이 문제를 처음 풀어서 맞혔을 때뿐이다
  const firstTry = correct && (prior ? prior.first === true : true);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    onPick(i);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-fg-strong/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface rounded-t-card sm:rounded-card shadow-card-hover w-full sm:max-w-md max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-accent-600">
              {isQuiz ? "🧠 잠깐 확인하기" : "💡 알아 두기"}
            </p>
            <p className="text-base font-bold text-fg-strong truncate">
              {annotation.title ?? label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 w-9 h-9 rounded-button hover:bg-surface-muted text-fg-muted text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {isQuiz ? (
            <>
              {prior && prior.first !== true && picked === null && (
                <p className="text-xs text-fg-muted bg-surface-muted rounded-button px-3 py-2 leading-relaxed">
                  지난번에 한 번에 맞히지 못한 문제예요. 다시 풀어 볼 수 있지만
                  <b className="text-fg-strong"> 배지에는 반영되지 않아요</b>.
                </p>
              )}
              <p className="text-sm text-fg-strong leading-relaxed">
                {annotation.question}
              </p>
              <div className="space-y-2">
                {(annotation.options ?? []).map((opt, i) => {
                  const isAnswer = i === annotation.answer;
                  const isPicked = i === picked;
                  let cls =
                    "border-border bg-surface text-fg-strong hover:border-accent-300";
                  if (picked !== null) {
                    if (isAnswer)
                      cls =
                        "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-cat-sci";
                    else if (isPicked)
                      cls =
                        "border-[var(--color-cat-hum)] bg-[color-mix(in_oklab,var(--color-cat-hum)_10%,white)] text-cat-hum";
                    else cls = "border-border bg-surface text-fg-subtle";
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => choose(i)}
                      disabled={picked !== null}
                      className={`w-full text-left px-4 py-3 rounded-button border-2 text-sm font-semibold transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {picked !== null && (
                <div className="space-y-2 pt-1">
                  <p
                    className={`text-sm font-bold leading-relaxed ${
                      correct ? "text-cat-sci" : "text-cat-hum"
                    }`}
                  >
                    {correct
                      ? firstTry
                        ? "✓ 한 번에 맞았어요!"
                        : "✓ 맞았어요 (배지에는 반영되지 않아요)"
                      : "✕ 아쉬워요 — 이 문제는 배지에 반영되지 않아요"}
                  </p>
                  {!correct && (
                    <p className="text-xs text-fg-muted leading-relaxed">
                      해설을 읽고 넘어가세요. 배지에 다시 도전하려면 글 끝에서
                      <b className="text-fg-strong"> 처음부터 다시 읽기</b>를 누르면 돼요.
                    </p>
                  )}
                  {annotation.explain && (
                    <p className="text-sm text-fg leading-relaxed bg-surface-muted rounded-button px-4 py-3">
                      {annotation.explain}
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">
              {annotation.body}
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm"
          >
            계속 읽기
          </button>
        </div>
      </div>
    </div>
  );
}
