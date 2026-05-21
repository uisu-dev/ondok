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
CREATE TABLE IF NOT EXISTS public.quiz_logs (
  id             BIGSERIAL PRIMARY KEY,
  mbti           TEXT NOT NULL,
  interests      TEXT[] NOT NULL,
  mood           TEXT NOT NULL,
  pace           TEXT NOT NULL,
  recommended_book_ids INTEGER[] NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quiz_logs_created_idx ON public.quiz_logs (created_at DESC);

-- RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_logs ENABLE ROW LEVEL SECURITY;

-- Public read access to books
DROP POLICY IF EXISTS "Books are readable by everyone" ON public.books;
CREATE POLICY "Books are readable by everyone"
  ON public.books FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public insert for quiz logs (anonymous, no PII)
DROP POLICY IF EXISTS "Anyone can log a quiz result" ON public.quiz_logs;
CREATE POLICY "Anyone can log a quiz result"
  ON public.quiz_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No update or delete from anon
