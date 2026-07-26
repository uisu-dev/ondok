-- 고전 읽기(이북) — 작품 + 학생 읽기 기록
--
-- works.body 는 마크다운. '## 소제목' 으로 대목을 나누며, 학생은 통으로 읽고
-- 마지막에 점검 문제를 푼다. questions 는 활동지와 같은 문항 스키마를 JSONB 로 보관.

CREATE TABLE IF NOT EXISTS public.works (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  author      TEXT,                    -- '작자 미상' 등
  category    TEXT NOT NULL DEFAULT '고전소설',
  era         TEXT,                    -- '조선 후기' 등
  summary     TEXT,                    -- 목록에 보이는 한두 줄 소개
  body        TEXT NOT NULL,           -- 다듬은 본문 (마크다운)
  commentary  TEXT,                    -- 작품 해설 (완독 후 공개)
  cover_emoji TEXT NOT NULL DEFAULT '📖',
  questions   JSONB NOT NULL DEFAULT '[]'::jsonb,
  published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS works_published_idx ON public.works(published);
CREATE INDEX IF NOT EXISTS works_category_idx  ON public.works(category);

-- 학생 1명 × 작품 1개 = 1행 (읽기 진도 + 점검 문제 답안)
CREATE TABLE IF NOT EXISTS public.work_records (
  user_id        UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_id        BIGINT NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  last_section   INT    NOT NULL DEFAULT 0,   -- 마지막으로 읽던 대목 index
  completed_at   TIMESTAMPTZ,                 -- 끝까지 읽은 시각
  answers        JSONB  NOT NULL DEFAULT '{}'::jsonb,
  answered_count INT    NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, work_id)
);
CREATE INDEX IF NOT EXISTS work_records_user_idx ON public.work_records(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS work_records_work_idx ON public.work_records(work_id);

ALTER TABLE public.works        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;

-- 공개된 작품은 누구나 읽기
DROP POLICY IF EXISTS "works public read" ON public.works;
CREATE POLICY "works public read"
  ON public.works FOR SELECT
  TO anon, authenticated
  USING (published = TRUE);

-- 읽기 기록은 본인 것만
DROP POLICY IF EXISTS "work_records own" ON public.work_records;
CREATE POLICY "work_records own"
  ON public.work_records FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
