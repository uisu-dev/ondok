-- 고전 읽기 — ① 시대순 정렬 ② 작품별 마스터 배지
--
-- ① era 는 '조선 후기' 같은 뭉뚱그린 문자열이라 정렬에 쓸 수 없다.
--    창작(정착) 추정 연도를 era_order 에 담아 이것으로 정렬한다.
-- ② 형광펜 문제를 모두 맞히고 완독하면 작품별 배지를 준다.
--    note_answers 에 주석 키별 채점 결과를 남긴다.
--      { "심술보": { "picked": 1, "ok": true, "first": true }, ... }
--      first = 처음 고른 답이 정답이었는지 (교사 통계용, 배지 판정에는 미사용)

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS era_order INT NOT NULL DEFAULT 9999;

CREATE INDEX IF NOT EXISTS works_era_order_idx ON public.works(era_order);

ALTER TABLE public.work_records
  ADD COLUMN IF NOT EXISTS note_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS note_correct INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS work_records_badge_idx
  ON public.work_records(user_id) WHERE badge_at IS NOT NULL;
