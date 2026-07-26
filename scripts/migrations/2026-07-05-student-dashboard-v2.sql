-- 학생 현황 집계 RPC 확장 — 급수별 사고도구어, 고전 읽기, 게임, 최근 활동일 추가.
-- 교사가 반 전체를 여러 각도로 분석할 수 있도록 학생 1명당 한 행으로 모두 집계한다.
-- (클라이언트에서 통계를 계산하므로 추가 쿼리가 필요 없다)

DROP FUNCTION IF EXISTS public.student_dashboard(TEXT);

CREATE OR REPLACE FUNCTION public.student_dashboard(p_school_code TEXT)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  school_code TEXT,
  school_name TEXT,
  birth_year INT,
  mbti TEXT,
  sago BIGINT,
  sago_g1 BIGINT,
  sago_g2 BIGINT,
  sago_g3 BIGINT,
  sago_g4 BIGINT,
  books BIGINT,
  sheets BIGINT,
  works_read BIGINT,
  works_done BIGINT,
  battle_wins BIGINT,
  game_plays BIGINT,
  last_active TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.display_name,
    p.school_code,
    s.name AS school_name,
    p.birth_year,
    p.mbti,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id) AS sago,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '1.%') AS sago_g1,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '2.%') AS sago_g2,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '3.%') AS sago_g3,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '4.%') AS sago_g4,
    (SELECT COUNT(*) FROM public.favorites f WHERE f.user_id = p.id AND f.kind = 'book') AS books,
    (SELECT COUNT(*) FROM public.worksheet_responses wr WHERE wr.user_id = p.id) AS sheets,
    (SELECT COUNT(*) FROM public.work_records wk WHERE wk.user_id = p.id) AS works_read,
    (SELECT COUNT(*) FROM public.work_records wk WHERE wk.user_id = p.id AND wk.completed_at IS NOT NULL) AS works_done,
    (SELECT COALESCE(SUM(g.score), 0) FROM public.game_scores g WHERE g.user_id = p.id AND g.game_type = 'battle') AS battle_wins,
    (SELECT COUNT(*) FROM public.game_scores g WHERE g.user_id = p.id) AS game_plays,
    GREATEST(
      (SELECT MAX(sp.known_at)   FROM public.sago_progress sp       WHERE sp.user_id = p.id),
      (SELECT MAX(wr.updated_at) FROM public.worksheet_responses wr WHERE wr.user_id = p.id),
      (SELECT MAX(wk.updated_at) FROM public.work_records wk        WHERE wk.user_id = p.id),
      (SELECT MAX(g.created_at)  FROM public.game_scores g          WHERE g.user_id = p.id)
    ) AS last_active
  FROM public.profiles p
  LEFT JOIN public.schools s ON s.code = p.school_code
  WHERE p.role = 'student'
    AND (p_school_code IS NULL OR p.school_code = p_school_code)
  ORDER BY p.display_name;
$$;
