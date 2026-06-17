export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  schoolName: string | null;
  bestScore: number;
}

/** 산성비 게임 랭킹 상위 N (사용자별 최고점). 없으면 빈 배열. */
export async function getGameLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  try {
    const { getAdminSupabase } = await import("./supabase-admin");
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.rpc("game_leaderboard", {
      p_limit: limit,
    });
    if (error || !data) return [];
    return (data as Array<{
      user_id: string;
      display_name: string | null;
      school_name: string | null;
      best_score: number;
    }>).map((r) => ({
      userId: r.user_id,
      displayName: r.display_name,
      schoolName: r.school_name,
      bestScore: r.best_score,
    }));
  } catch {
    return [];
  }
}
