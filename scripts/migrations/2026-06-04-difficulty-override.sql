-- Migration: 활동지 난이도 수동 오버라이드
-- 자동 산출 난이도가 어색할 때 관리자가 직접 지정.
-- 값 형식: '초등 하' / '초등 중' / '초등 상' / '중등 하' / ... / '고등 상'
-- NULL 이면 자동 산출값을 사용.

ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS difficulty_override TEXT;
