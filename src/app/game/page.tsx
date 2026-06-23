import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SagoMatchGame } from "@/components/game/SagoMatchGame";
import { getGameLeaderboard } from "@/data/leaderboard";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const leaders = await getGameLeaderboard(10);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[560px] px-6 py-8 space-y-6">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>

        <SagoMatchGame />

        {/* 랭킹 */}
        <Card as="section" className="px-6 py-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-fg-strong">🏆 명예의 전당</p>
            <p className="text-xs text-fg-subtle">제거한 단어 수 기준</p>
          </div>
          {leaders.length === 0 ? (
            <p className="text-sm text-fg-muted">
              아직 기록이 없어요. 첫 도전자가 되어 보세요!
            </p>
          ) : (
            <ol className="space-y-1.5">
              {leaders.map((e, i) => (
                <li
                  key={e.userId}
                  className="flex items-center gap-3 px-3 py-2 rounded-button odd:bg-surface-muted"
                >
                  <span
                    className={`w-6 text-center font-bold ${
                      i === 0
                        ? "text-cat-soc"
                        : i === 1
                          ? "text-fg-muted"
                          : i === 2
                            ? "text-cat-hum"
                            : "text-fg-subtle"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-fg-strong truncate">
                      {e.displayName ?? "익명"}
                    </span>
                    {e.schoolName && (
                      <span className="block text-[10px] text-fg-subtle truncate">
                        {e.schoolName}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-bold text-accent-600">
                    {e.bestScore}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </main>
  );
}
