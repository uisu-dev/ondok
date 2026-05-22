-- Migration: 이미지 + OX 퀴즈 지원
-- 1) worksheets / worksheet_questions 에 이미지 컬럼 추가
-- 2) 문제 유형에 'true_false' (OX 퀴즈) 추가
--
-- Supabase Storage 버킷 'worksheet-images' 는 Dashboard에서 별도 생성 (Public bucket).
-- 이 SQL은 column / constraint 만 처리.

ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS passage_image_url TEXT;

ALTER TABLE public.worksheet_questions
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.worksheet_questions
  DROP CONSTRAINT IF EXISTS worksheet_questions_type_check;

ALTER TABLE public.worksheet_questions
  ADD CONSTRAINT worksheet_questions_type_check
  CHECK (type IN ('multiple_choice', 'short_answer', 'essay', 'true_false'));
