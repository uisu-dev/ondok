"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";

/**
 * 작품별 마스터 배지.
 * 조건: 끝까지 읽기 + 형광펜 문제 전부 맞히기 + 점검 문제 전부 작성.
 *
 * 틀린 문제는 다시 풀어 맞히면 인정된다. 대신 '아직 남은 것'을 하나씩
 * 짚어 주고 눌러서 바로 갈 수 있게 해, 본문에서 찾아 헤매지 않게 한다.
 */

/** 배지 도안 — 작품 표지 이모지를 금테로 감싼다. */
export function BadgeMedal({
  emoji,
  size = 72,
  locked = false,
}: {
  emoji: string;
  size?: number;
  locked?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.44,
        background: locked
          ? "var(--color-surface-muted)"
          : "linear-gradient(145deg, #fde68a, #f59e0b 55%, #d97706)",
        boxShadow: locked
          ? "inset 0 0 0 2px var(--color-border)"
          : "inset 0 0 0 3px rgba(255,255,255,.45), 0 4px 14px rgba(217,119,6,.28)",
        filter: locked ? "grayscale(1) opacity(.45)" : undefined,
      }}
    >
      {emoji}
    </span>
  );
}

export function BadgeCard({
  title,
  emoji,
  earned,
  badgeAt,
  quizSolved,
  quizFirstTry,
  quizTotal,
  answered,
  questionTotal,
  completed,
  signedIn,
  unsolvedNotes,
  unansweredQuestions,
  onGoNote,
  onGoQuestion,
  onGoEnd,
  onReset,
}: {
  title: string;
  emoji: string;
  earned: boolean;
  badgeAt: string | null;
  /** 맞힌 형광펜 문제 수 (다시 풀어 맞힌 것 포함) */
  quizSolved: number;
  /** 그중 한 번에 맞힌 수 — 조건은 아니고 칭찬용 */
  quizFirstTry: number;
  quizTotal: number;
  answered: number;
  questionTotal: number;
  completed: boolean;
  signedIn: boolean;
  /** 아직 못 맞힌 형광펜 문제 (키 + 제목) */
  unsolvedNotes: Array<{ key: string; title: string; tried: boolean }>;
  /** 아직 안 쓴 점검 문제 (번호 + 물음) */
  unansweredQuestions: Array<{ index: number; prompt: string }>;
  onGoNote?: (key: string) => void;
  onGoQuestion?: (index: number) => void;
  onGoEnd?: () => void;
  onReset?: () => void;
}) {
  const steps = [
    { label: "끝까지 읽기", done: completed, detail: completed ? "완독" : "읽는 중" },
    {
      label: "형광펜 문제 모두 맞히기",
      done: quizTotal === 0 || quizSolved >= quizTotal,
      detail: `${quizSolved}/${quizTotal}`,
    },
    {
      label: "점검 문제 모두 답하기",
      done: questionTotal === 0 || answered >= questionTotal,
      detail: `${answered}/${questionTotal}`,
    },
  ];

  // 남은 일이 있으면 하나씩 짚어 준다. 본문에서 '?' 를 찾아 헤매지 않도록.
  const todoCount =
    (completed ? 0 : 1) + unsolvedNotes.length + unansweredQuestions.length;

  return (
    <Card
      as="section"
      className={`px-6 py-6 space-y-4 ${
        earned
          ? "bg-[color-mix(in_oklab,var(--color-cat-soc)_9%,white)] border border-[color-mix(in_oklab,var(--color-cat-soc)_45%,white)]"
          : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <BadgeMedal emoji={emoji} locked={!earned} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-accent-600">
            {earned ? "🏅 마스터 배지 획득" : "🏅 마스터 배지"}
          </p>
          <p className="text-base font-bold text-fg-strong leading-snug">
            {title}
          </p>
          <p className="text-[11px] text-fg-muted mt-0.5">
            {earned
              ? badgeAt
                ? `${new Date(badgeAt).toLocaleDateString("ko-KR")} 획득`
                : "축하해요!"
              : "세 가지를 모두 채우면 배지를 받아요"}
          </p>
          {!earned && signedIn && todoCount > 0 && (
            <p className="text-[11px] text-fg-subtle mt-0.5 leading-relaxed">
              <b className="text-accent-600">{todoCount}가지</b>만 더 하면 받아요.
            </p>
          )}
          {earned && quizTotal > 0 && (
            <p className="text-[11px] text-fg-subtle mt-0.5">
              한 번에 맞힌 문제 {quizFirstTry}/{quizTotal}
              {quizFirstTry === quizTotal && " · 전부 한 번에 맞혔어요!"}
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span
              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                s.done
                  ? "bg-[var(--color-cat-sci)] text-white"
                  : "bg-surface-muted text-fg-subtle"
              }`}
            >
              {s.done ? "✓" : ""}
            </span>
            <span
              className={`flex-1 text-sm ${
                s.done ? "text-fg-strong font-semibold" : "text-fg-muted"
              }`}
            >
              {s.label}
            </span>
            <span className="text-xs font-bold text-fg-subtle shrink-0">
              {s.detail}
            </span>
          </li>
        ))}
      </ul>

      {!signedIn && (
        <p className="text-xs text-fg-subtle">
          배지는 로그인해야 저장돼요.
        </p>
      )}

      {/* 남은 것 — 본문에서 찾아 헤매지 않도록 눌러서 바로 가게 한다 */}
      {signedIn && !earned && todoCount > 0 && (
        <div className="rounded-card bg-surface-muted px-4 py-4 space-y-3">
          <p className="text-xs font-bold text-fg-strong">
            아직 남은 것 {todoCount}가지
          </p>

          <ul className="space-y-1.5">
            {!completed && (
              <li>
                <button
                  type="button"
                  onClick={onGoEnd}
                  className="w-full text-left px-3 py-2.5 rounded-button bg-surface hover:bg-accent-50 border border-border transition-colors flex items-center gap-2"
                >
                  <span aria-hidden className="text-sm">📖</span>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-fg-strong">
                    끝까지 읽고 완독 누르기
                  </span>
                  <span aria-hidden className="text-fg-subtle text-xs">→</span>
                </button>
              </li>
            )}

            {unsolvedNotes.map((n) => (
              <li key={n.key}>
                <button
                  type="button"
                  onClick={() => onGoNote?.(n.key)}
                  className="w-full text-left px-3 py-2.5 rounded-button bg-surface hover:bg-accent-50 border border-border transition-colors flex items-center gap-2"
                >
                  <span aria-hidden className="text-sm">
                    {n.tried ? "🔁" : "❓"}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-fg-strong truncate">
                      {n.title}
                    </span>
                    <span className="block text-[10px] text-fg-subtle">
                      {n.tried ? "다시 풀기" : "아직 안 푼 형광펜 문제"}
                    </span>
                  </span>
                  <span aria-hidden className="text-fg-subtle text-xs">→</span>
                </button>
              </li>
            ))}

            {unansweredQuestions.map((q) => (
              <li key={q.index}>
                <button
                  type="button"
                  onClick={() => onGoQuestion?.(q.index)}
                  className="w-full text-left px-3 py-2.5 rounded-button bg-surface hover:bg-accent-50 border border-border transition-colors flex items-center gap-2"
                >
                  <span aria-hidden className="text-sm">✍️</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-fg-strong truncate">
                      점검 문제 {q.index + 1}번
                    </span>
                    <span className="block text-[10px] text-fg-subtle truncate">
                      {q.prompt}
                    </span>
                  </span>
                  <span aria-hidden className="text-fg-subtle text-xs">→</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="text-[11px] text-fg-subtle leading-relaxed">
            틀렸던 문제도 다시 풀어 맞히면 인정돼요. 남은 것을 다 채우면 그 자리에서
            배지가 나옵니다.
          </p>
        </div>
      )}

      {signedIn && !earned && todoCount === 0 && (
        <p className="text-xs text-fg-muted">잠시만요, 배지를 확인하는 중이에요…</p>
      )}

      {signedIn && onReset && (
        <p className="text-[11px] text-fg-subtle text-center pt-1">
          <button
            type="button"
            onClick={onReset}
            className="underline hover:text-fg-muted"
          >
            처음부터 다시 읽기
          </button>
          {" "}— 기록을 지우고 새로 도전해요
        </p>
      )}

    </Card>
  );
}

/** 처음부터 다시 읽기 — 되돌릴 수 없으니 한 번 물어본다. */
export function ResetConfirm({
  title,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-fg-strong/55 flex items-center justify-center p-6"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface rounded-card shadow-card-hover w-full max-w-xs px-6 py-7 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1.5">
          <p className="text-base font-bold text-fg-strong leading-snug">
            처음부터 다시 읽을까요?
          </p>
          <p className="text-sm text-fg-muted leading-relaxed">
            「{title}」의 읽기 기록·형광펜 문제 답·점검 문제 답이 모두 지워져요.
            지운 기록은 되돌릴 수 없어요.
          </p>
          <p className="text-xs text-fg-subtle leading-relaxed pt-1">
            이미 받은 배지는 그대로 남아요.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 h-11 rounded-button border-2 border-border text-fg-strong font-bold text-sm disabled:opacity-50"
          >
            그만두기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 h-11 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm disabled:opacity-50"
          >
            {pending ? "지우는 중…" : "다시 읽기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 배지를 막 받았을 때 뜨는 축하 화면. */
export function BadgeCelebration({
  title,
  emoji,
  onClose,
}: {
  title: string;
  emoji: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-fg-strong/55 flex items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface rounded-card shadow-card-hover w-full max-w-xs px-6 py-8 text-center space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <BadgeMedal emoji={emoji} size={104} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-cat-soc">🏅 마스터 배지 획득!</p>
          <p className="text-xl font-bold text-fg-strong leading-snug">{title}</p>
          <p className="text-sm text-fg-muted leading-relaxed pt-1">
            끝까지 읽고 문제도 모두 맞혔어요.
            <br />
            마이페이지에서 모은 배지를 볼 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm"
        >
          좋아요
        </button>
      </div>
    </div>
  );
}
