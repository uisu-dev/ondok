-- 학년·반 수집 + 통계 필터링.
--
-- 왜 grade_year 를 함께 두는가:
--   학년·반은 해마다 바뀐다. 값만 저장하면 2026년에 1학년이던 학생이
--   2027년에도 1학년으로 집계된다. 그래서 '어느 학년도의 값인가'를 같이
--   저장하고, 학년도가 바뀌면 다시 묻는다. (3월 1일 기준)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade      INT,
  ADD COLUMN IF NOT EXISTS class_no   INT,
  ADD COLUMN IF NOT EXISTS grade_year INT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_grade_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_grade_check
  CHECK (grade IS NULL OR (grade BETWEEN 1 AND 6));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_class_no_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_class_no_check
  CHECK (class_no IS NULL OR (class_no BETWEEN 1 AND 30));

-- 학교 × 학년 × 반 집계용
CREATE INDEX IF NOT EXISTS profiles_class_idx
  ON public.profiles (school_code, grade, class_no)
  WHERE role = 'student';

-- 학생 현황 RPC 에 학년·반 추가
DROP FUNCTION IF EXISTS public.student_dashboard(TEXT);

CREATE OR REPLACE FUNCTION public.student_dashboard(p_school_code TEXT)
RETURNS TABLE(
  id UUID,
  login_id TEXT,
  display_name TEXT,
  school_code TEXT,
  school_name TEXT,
  birth_year INT,
  grade INT,
  class_no INT,
  grade_year INT,
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
  works_badge BIGINT,
  battle_wins BIGINT,
  game_plays BIGINT,
  last_active TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.login_id,
    p.display_name,
    p.school_code,
    s.name AS school_name,
    p.birth_year,
    p.grade,
    p.class_no,
    p.grade_year,
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
    (SELECT COUNT(*) FROM public.work_records wk WHERE wk.user_id = p.id AND wk.badge_at IS NOT NULL) AS works_badge,
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
  ORDER BY p.grade NULLS LAST, p.class_no NULLS LAST, p.display_name;
$$;
