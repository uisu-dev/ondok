import Link from "next/link";
import { ChosungGame } from "@/components/game/ChosungGame";
import { LeaderboardCard } from "@/components/game/LeaderboardCard";
import { getGameLeaderboard } from "@/data/leaderboard";

export const dynamic = "force-dynamic";

export default async function ChosungGamePage() {
  const leaders = await getGameLeaderboard("chosung", 10);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[560px] px-6 py-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <Link href="/" className="text-fg-muted hover:text-fg-strong">
            ← 홈으로
          </Link>
          <Link href="/game" className="text-accent-600 hover:text-accent-700">
            🃏 짝 맞추기 하러가기 →
          </Link>
        </div>

        <ChosungGame />
        <LeaderboardCard leaders={leaders} unitLabel="맞힌 개수" />
      </div>
    </main>
  );
}
