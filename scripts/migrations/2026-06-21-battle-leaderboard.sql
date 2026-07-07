-- 사고도구어 배틀 승수 랭킹.
-- battle 은 승리 1건당 game_scores 에 (score=1, game_type='battle') 로 기록.
-- 랭킹은 사용자별 승수 '합계'(SUM) 기준 (다른 게임은 최고점 MAX 기준).

CREATE OR REPLACE FUNCTION public.battle_leaderboard(p_limit INT)
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  school_name TEXT,
  best_score INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT best.user_id,
         p.display_name,
         s.name AS school_name,
         best.wins::INT AS best_score
  FROM (
    SELECT user_id, SUM(score) AS wins
    FROM public.game_scores
    WHERE game_type = 'battle'
    GROUP BY user_id
  ) best
  JOIN public.profiles p ON p.id = best.user_id
  LEFT JOIN public.schools s ON s.code = p.school_code
  ORDER BY best.wins DESC, best.user_id
  LIMIT p_limit;
$$;
