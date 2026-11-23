"use client";

/**
 * 교원 현황 화면의 수동 새로고침.
 * 시각은 한국 시간으로 고정해 서버 렌더와 브라우저의 시간대가 달라도 같게 맞춘다.
 */
export function formatSeoulHms(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${pick("hour")}:${pick("minute")}:${pick("second")}`;
}

export function DataRefreshBar({
  fetchedAt,
  loading,
  error,
  onRefresh,
  sticky = false,
  compact = false,
}: {
  fetchedAt: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  sticky?: boolean;
  compact?: boolean;
}) {
  const stamp = formatSeoulHms(fetchedAt);
  return (
      <div className={sticky ? "sticky top-12 z-30" : undefined}>
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent-200 bg-[color-mix(in_oklab,var(--color-accent-500)_10%,white)] ${
          compact ? "px-3 py-2.5" : "px-4 py-3"
        } ${sticky ? "shadow-sm" : ""}`}
      >
        <p
          className={`font-semibold text-fg-strong tabular-nums ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          마지막 업데이트{" "}
          <time dateTime={fetchedAt}>{stamp}</time>
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-busy={loading}
          aria-label={loading ? "불러오는 중" : "새로고침"}
          className={`rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait ${
            compact
              ? "h-9 min-w-[6.5rem] px-3 text-xs"
              : "h-10 min-w-[7.5rem] px-4 text-sm"
          }`}
        >
          {loading ? (
            <span
              className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"
              aria-hidden
            />
          ) : (
            <span aria-hidden className="text-base leading-none">
              ↻
            </span>
          )}
          {loading ? "불러오는 중" : "새로고침"}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-cat-hum font-semibold mt-1.5 px-1">{error}</p>
      )}
    </div>
  );
}
