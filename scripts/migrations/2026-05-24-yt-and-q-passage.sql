-- Migration: YouTube 영상 링크 + 문항별 지문(추천도서용)
-- worksheets.youtube_url: 관리자가 관련 유튜브 영상 URL 1개 첨부
-- worksheet_questions.passage: 문항마다 짧은 지문/원문 인용 (선택)

ALTER TABLE public.worksheets
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

ALTER TABLE public.worksheet_questions
  ADD COLUMN IF NOT EXISTS passage TEXT;
