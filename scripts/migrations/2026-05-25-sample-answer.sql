-- Migration: 활동지 전체 모범 답안 (학생이 모두 풀어야 공개)
-- worksheet_questions.sample_answer 와는 다른 의도:
--   · worksheet_questions.sample_answer : 문항 개별 예시 답안 (단답형/서술형 보조)
--   · worksheets.sample_answer          : 활동지 전체 모범 답안 / 풀이 / 해설

ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS sample_answer TEXT;
