-- profiles.birth_year 추가 — 출생연도로 대략 학년을 추정(매년 학년 갱신 불필요).
-- 추천 로직에는 사용하지 않고, 관리·표시 용도.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year INT;

-- 천안중학교(중01-01) 소속 학생 일괄 2011년생 입력 (현재 중3).
UPDATE public.profiles
SET birth_year = 2011,
    updated_at = NOW()
WHERE school_code = '중01-01'
  AND role = 'student';
