import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SagoMatchGame } from "@/components/game/SagoMatchGame";
import { LeaderboardCard } from "@/components/game/LeaderboardCard";
import { getGameLeaderboard } from "@/data/leaderboard";

export const dynamic = "force-dynamic";

export default async function GamePage() {
  const leaders = await getGameLeaderboard("match", 10);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[560px] px-6 py-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <Link href="/" className="text-fg-muted hover:text-fg-strong">
            ← 홈으로
          </Link>
          <span className="flex gap-3">
            <Link href="/game/chosung" className="text-accent-600 hover:text-accent-700">
              🔤 초성 퀴즈
            </Link>
            <Link href="/game/battle" className="text-accent-600 hover:text-accent-700">
              ⚔️ 배틀
            </Link>
          </span>
        </div>

        <SagoMatchGame />
        <LeaderboardCard leaders={leaders} unitLabel="점수" />
      </div>
    </main>
  );
}
