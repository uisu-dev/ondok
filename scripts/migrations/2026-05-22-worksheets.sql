-- Migration: worksheets + worksheet_questions tables.
-- Run in Supabase SQL Editor after adding SUPABASE_SERVICE_ROLE_KEY to env.

CREATE TABLE IF NOT EXISTS public.worksheets (
  id            BIGSERIAL PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('books', 'exam', 'written')),
  title         TEXT NOT NULL,
  intro         TEXT,                                 -- 활동지 소개 / 안내문
  book_id       INTEGER REFERENCES public.books(id),  -- 'books' 타입 전용
  source        TEXT,                                 -- 'exam' 타입: 출제 회차·문번호 등
  external_url  TEXT,                                 -- 'exam' 타입: 평가원 PDF 등 외부 본문 링크
  passage       TEXT,                                 -- 'written' 타입: 자체 지문 본문
  published     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS worksheets_type_idx ON public.worksheets(type);
CREATE INDEX IF NOT EXISTS worksheets_pub_idx  ON public.worksheets(published);
CREATE INDEX IF NOT EXISTS worksheets_created_idx ON public.worksheets(created_at DESC);

CREATE TABLE IF NOT EXISTS public.worksheet_questions (
  id            BIGSERIAL PRIMARY KEY,
  worksheet_id  BIGINT NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('multiple_choice', 'short_answer', 'essay')),
  prompt        TEXT NOT NULL,
  options       JSONB,                                -- MC: [{label,text,correct}]
  sample_answer TEXT,                                 -- short/essay: 예시 답안
  rubric        TEXT                                  -- essay: 평가 기준 (선택)
);

CREATE INDEX IF NOT EXISTS wq_ws_pos_idx ON public.worksheet_questions(worksheet_id, position);

-- RLS: 일반(anon) 사용자는 published worksheet 만 읽을 수 있음.
-- 쓰기는 service_role 키만 (관리자 페이지 서버 액션에서 사용).
ALTER TABLE public.worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worksheet_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "worksheets public read" ON public.worksheets;
CREATE POLICY "worksheets public read"
  ON public.worksheets FOR SELECT
  TO anon, authenticated
  USING (published = TRUE);

DROP POLICY IF EXISTS "ws_questions public read" ON public.worksheet_questions;
CREATE POLICY "ws_questions public read"
  ON public.worksheet_questions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.worksheets w
            WHERE w.id = worksheet_questions.worksheet_id
              AND w.published = TRUE)
  );

-- service_role bypasses RLS by default; no INSERT/UPDATE/DELETE policies needed for anon.
