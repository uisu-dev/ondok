-- worksheets.created_by 컬럼 추가 — 누가 만들었는지 추적
--
-- 교원은 자신이 만든 활동지만 관리할 수 있고,
-- 사이트 슈퍼관리자(HMAC uisu9060)는 모든 활동지를 관리.
-- created_by 가 NULL 인 활동지는 슈퍼관리자가 직접 만든 것으로 간주.

ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS worksheets_created_by_idx
  ON public.worksheets(created_by);
