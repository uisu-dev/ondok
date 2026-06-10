-- worksheet_responses: 학생이 활동지에 작성한 답안 저장
--
-- answers 는 { "<position>": "<답안텍스트>" } 형태의 JSONB.
-- 활동지 1개당 사용자 1개의 답안 묶음 (덮어쓰기).

CREATE TABLE IF NOT EXISTS public.worksheet_responses (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worksheet_id  BIGINT NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  answers       JSONB NOT NULL DEFAULT '{}'::jsonb,
  answered_count INT NOT NULL DEFAULT 0,  -- 비어있지 않은 답안 개수 (목록 표시용)
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, worksheet_id)
);

CREATE INDEX IF NOT EXISTS worksheet_responses_user_idx
  ON public.worksheet_responses (user_id, updated_at DESC);

ALTER TABLE public.worksheet_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worksheet_responses own" ON public.worksheet_responses;
CREATE POLICY "worksheet_responses own"
  ON public.worksheet_responses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
