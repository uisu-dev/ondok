-- 출석번호(student_no) 추가 + 관리자 학적 수정 지원.
--
-- 2026-08-20-grade-class.sql 과 겹치는 ADD COLUMN 은 IF NOT EXISTS 라
-- 둘 중 어느 것을 먼저 돌려도 안전하다. 이 파일만 돌려도 필요한 칼럼은 다 생긴다.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS grade      INT,
  ADD COLUMN IF NOT EXISTS class_no   INT,
  ADD COLUMN IF NOT EXISTS grade_year INT,
  ADD COLUMN IF NOT EXISTS student_no INT;   -- 반에서의 출석번호

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_grade_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_grade_check
  CHECK (grade IS NULL OR (grade BETWEEN 1 AND 6));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_class_no_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_class_no_check
  CHECK (class_no IS NULL OR (class_no BETWEEN 1 AND 30));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_student_no_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_student_no_check
  CHECK (student_no IS NULL OR (student_no BETWEEN 1 AND 60));

CREATE INDEX IF NOT EXISTS profiles_class_idx
  ON public.profiles (school_code, grade, class_no)
  WHERE role = 'student';

-- 학생 현황 RPC 에 출석번호 추가 + 번호순 정렬
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
  student_no INT,
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
    p.student_no,
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
  ORDER BY p.grade NULLS LAST, p.class_no NULLS LAST,
           p.student_no NULLS LAST, p.display_name;
$$;
