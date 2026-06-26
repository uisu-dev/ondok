-- 학생 현황 집계 RPC — 사고도구어/도서/활동지 수를 서브쿼리 count 로 정확히 집계
-- (클라이언트 select 의 1000행 제한 문제 회피).
--   p_school_code = NULL  → 전체 학생 (슈퍼관리자/admin)
--   p_school_code = '코드' → 해당 학교 학생 (교원)

CREATE OR REPLACE FUNCTION public.student_dashboard(p_school_code TEXT)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  school_code TEXT,
  school_name TEXT,
  birth_year INT,
  mbti TEXT,
  sago BIGINT,
  books BIGINT,
  sheets BIGINT
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
    (SELECT COUNT(*) FROM public.favorites f WHERE f.user_id = p.id AND f.kind = 'book') AS books,
    (SELECT COUNT(*) FROM public.worksheet_responses wr WHERE wr.user_id = p.id) AS sheets
  FROM public.profiles p
  LEFT JOIN public.schools s ON s.code = p.school_code
  WHERE p.role = 'student'
    AND (p_school_code IS NULL OR p.school_code = p_school_code)
  ORDER BY p.display_name;
$$;
