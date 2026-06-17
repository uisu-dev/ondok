-- 산성비(사고도구어 낙하) 게임 점수 + 랭킹.
-- score = 제거한 단어 수 (오래 버틸수록 많이 제거 → 높은 랭크).

CREATE TABLE IF NOT EXISTS public.game_scores (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       INT NOT NULL CHECK (score >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS game_scores_user_best_idx ON public.game_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS game_scores_score_idx ON public.game_scores(score DESC);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_scores insert own" ON public.game_scores;
CREATE POLICY "game_scores insert own"
  ON public.game_scores FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "game_scores read own" ON public.game_scores;
CREATE POLICY "game_scores read own"
  ON public.game_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 랭킹: 사용자별 최고 점수 + 이름·학교. service_role 로 호출.
CREATE OR REPLACE FUNCTION public.game_leaderboard(p_limit INT)
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
    GROUP BY user_id
  ) best
  JOIN public.profiles p ON p.id = best.user_id
  LEFT JOIN public.schools s ON s.code = p.school_code
  ORDER BY best.score DESC, best.user_id
  LIMIT p_limit;
$$;
