import { HTMLAttributes } from "react";
import type { BookCategory } from "@/lib/types";

const CATEGORY_TONES: Record<BookCategory, string> = {
  문학: "bg-[color-mix(in_oklab,var(--color-cat-lit)_12%,white)] text-[var(--color-cat-lit)]",
  과학: "bg-[color-mix(in_oklab,var(--color-cat-sci)_12%,white)] text-[var(--color-cat-sci)]",
  사회: "bg-[color-mix(in_oklab,var(--color-cat-soc)_15%,white)] text-[var(--color-cat-soc)]",
  인문: "bg-[color-mix(in_oklab,var(--color-cat-hum)_12%,white)] text-[var(--color-cat-hum)]",
};

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | BookCategory;
};

export function Chip({ tone = "neutral", className = "", ...rest }: ChipProps) {
  const toneClass =
    tone === "accent"
      ? "bg-accent-50 text-accent-700"
      : tone === "neutral"
        ? "bg-surface-muted text-fg-muted"
        : CATEGORY_TONES[tone];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-semibold ${toneClass} ${className}`}
      {...rest}
    />
  );
}
