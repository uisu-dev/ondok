-- 본문 속 형광펜 주석 — 중요한 낱말·문장을 눌러 짧은 문제를 풀거나 배경지식을 보는 장치.
--
-- 본문(body)에는 [[표시할 말|키]] 형태로 표시하고, 그 키에 해당하는 내용을
-- annotations 에 담는다. 예)
--   annotations = {
--     "maepum": { "type": "info", "title": "매품팔이", "body": "…" },
--     "simsulbo": { "type": "quiz", "question": "…", "options": ["…"], "answer": 1, "explain": "…" }
--   }

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS annotations JSONB NOT NULL DEFAULT '{}'::jsonb;
