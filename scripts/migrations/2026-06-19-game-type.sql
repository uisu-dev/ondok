-- 게임이 여러 종류가 되어 랭킹을 게임별로 분리.
--   'match'   = 사고도구어 짝 맞추기
--   'chosung' = 초성 힌트 퀴즈

ALTER TABLE public.game_scores
  ADD COLUMN IF NOT EXISTS game_type TEXT NOT NULL DEFAULT 'match';

CREATE INDEX IF NOT EXISTS game_scores_type_score_idx
  ON public.game_scores(game_type, score DESC);

-- 랭킹 RPC 를 game_type 별로 재정의
DROP FUNCTION IF EXISTS public.game_leaderboard(INT);
DROP FUNCTION IF EXISTS public.game_leaderboard(TEXT, INT);

CREATE OR REPLACE FUNCTION public.game_leaderboard(p_game_type TEXT, p_limit INT)
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
         best.score AS best_score
  FROM (
    SELECT user_id, MAX(score) AS score
    FROM public.game_scores
    WHERE game_type = p_game_type
    GROUP BY user_id
  ) best
  JOIN public.profiles p ON p.id = best.user_id
  LEFT JOIN public.schools s ON s.code = p.school_code
  ORDER BY best.score DESC, best.user_id
  LIMIT p_limit;
$$;
