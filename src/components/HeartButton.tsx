"use client";

import { useState, useTransition } from "react";

type Kind = "book" | "worksheet";

interface Props {
  kind: Kind;
  targetId: string | number;
  initialFavorited: boolean;
  /** 로그인된 사용자만 동작. 비로그인은 disabled. */
  enabled: boolean;
  /** 어떤 컨텍스트에서 표시되는지에 따라 크기/색 조정 */
  size?: "sm" | "md";
}

/**
 * 하트 토글 버튼. 사용자가 책/활동지를 찜할 수 있게 함.
 * - 비로그인: 회색 + 클릭 시 /login 이동
 * - 로그인: 클릭하면 /api/favorites 호출 (낙관적 UI 업데이트)
 */
export function HeartButton({
  kind,
  targetId,
  initialFavorited,
  enabled,
  size = "md",
}: Props) {
  const [fav, setFav] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const idStr = String(targetId);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!enabled) {
      // 비로그인은 로그인 페이지로 (현재 경로 next 로)
      const next = typeof window !== "undefined" ? window.location.pathname : "/";
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    const willBe = !fav;
    setFav(willBe);
    startTransition(async () => {
      const method = willBe ? "POST" : "DELETE";
      try {
        const res = await fetch("/api/favorites", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, target_id: idStr }),
        });
        if (!res.ok) {
          // 실패 시 롤백
          setFav(!willBe);
        }
      } catch {
        setFav(!willBe);
      }
    });
  }

  const px = size === "sm" ? 18 : 22;
  const label = fav ? "즐겨찾기 해제" : "즐겨찾기 추가";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={fav}
      aria-label={label}
      title={enabled ? label : "로그인하면 찜할 수 있어요"}
      className={`shrink-0 inline-flex items-center justify-center rounded-full transition-all ${
        fav
          ? "bg-cat-hum/15 text-cat-hum hover:bg-cat-hum/20"
          : enabled
            ? "bg-surface-muted text-fg-muted hover:bg-border hover:text-cat-hum"
            : "bg-surface-muted text-fg-subtle hover:bg-border"
      } ${size === "sm" ? "w-8 h-8" : "w-10 h-10"} ${
        pending ? "opacity-60" : ""
      }`}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill={fav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
