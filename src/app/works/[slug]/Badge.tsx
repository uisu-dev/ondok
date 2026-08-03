"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";

/**
 * 작품별 마스터 배지.
 * 조건: 끝까지 읽기 + 형광펜 문제 전부 정답 + 점검 문제 전부 작성.
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
  quizTotal,
  answered,
  questionTotal,
  completed,
  signedIn,
}: {
  title: string;
  emoji: string;
  earned: boolean;
  badgeAt: string | null;
  quizSolved: number;
  quizTotal: number;
  answered: number;
  questionTotal: number;
  completed: boolean;
  signedIn: boolean;
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
      {signedIn && !earned && quizTotal > 0 && quizSolved < quizTotal && (
        <p className="text-xs text-fg-muted leading-relaxed">
          아직 못 맞힌 형광펜 문제가 있어요. 본문에서 <b>?</b> 가 남아 있는 곳을
          다시 눌러 풀어 보세요.
        </p>
      )}
    </Card>
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
