-- profiles.mbti — 학생이 MBTI 진단을 하면 결과를 저장해 마이페이지에 표시.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mbti TEXT;
