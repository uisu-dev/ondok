-- Supabase schema for ondok plus.
-- Run this in Supabase SQL editor BEFORE seeding (scripts/books-seed.sql).

-- Books: 충남교육청 온독지수 추천도서 (read-only at runtime)
CREATE TABLE IF NOT EXISTS public.books (
  id           INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  publisher    TEXT NOT NULL,
  year         INTEGER NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('문학', '과학', '사회', '인문')),
  ondok_index  INTEGER NOT NULL,
  cover_url    TEXT NOT NULL,
  description  TEXT NOT NULL,
  naver_link   TEXT NOT NULL,
  isbn         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS books_category_idx ON public.books (category);
CREATE INDEX IF NOT EXISTS books_ondok_index_idx ON public.books (ondok_index);

-- Anonymous quiz logs (제한적 저장): 통계용. 개인 식별 불가.
-- 모드(mbti/interest/career)에 따라 다른 컬럼이 채워진다.
CREATE TABLE IF NOT EXISTS public.quiz_logs (
  id                    BIGSERIAL PRIMARY KEY,
  mode                  TEXT NOT NULL CHECK (mode IN ('mbti', 'interest', 'career')),
  -- MBTI mode columns
  mbti                  TEXT,
  interests             TEXT[],
  mood                  TEXT,
  pace                  TEXT,
  -- Interest mode columns
  topics                TEXT[],
  -- Career mode columns
  career                TEXT,
  -- Common
  recommended_book_ids  INTEGER[] NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quiz_logs_created_idx ON public.quiz_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_logs_mode_idx ON public.quiz_logs (mode);

-- RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Books are readable by everyone" ON public.books;
CREATE POLICY "Books are readable by everyone"
  ON public.books FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can log a quiz result" ON public.quiz_logs;
CREATE POLICY "Anyone can log a quiz result"
  ON public.quiz_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No update or delete from anon.
