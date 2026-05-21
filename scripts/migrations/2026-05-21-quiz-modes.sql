-- Migration: 3-way quiz modes (mbti / interest / career)
-- Run this in Supabase SQL editor for existing installs whose quiz_logs table
-- still uses the original mbti-only schema.
-- Safe to re-run.

-- Add mode + new payload columns
ALTER TABLE public.quiz_logs ADD COLUMN IF NOT EXISTS mode TEXT;
ALTER TABLE public.quiz_logs ADD COLUMN IF NOT EXISTS topics TEXT[];
ALTER TABLE public.quiz_logs ADD COLUMN IF NOT EXISTS career TEXT;

-- Backfill mode for any pre-existing rows (only mbti existed before)
UPDATE public.quiz_logs SET mode = 'mbti' WHERE mode IS NULL;

-- Make mbti-mode columns nullable so interest/career inserts don't fail
ALTER TABLE public.quiz_logs ALTER COLUMN mbti DROP NOT NULL;
ALTER TABLE public.quiz_logs ALTER COLUMN interests DROP NOT NULL;
ALTER TABLE public.quiz_logs ALTER COLUMN mood DROP NOT NULL;
ALTER TABLE public.quiz_logs ALTER COLUMN pace DROP NOT NULL;

-- Now require mode going forward (after backfill)
ALTER TABLE public.quiz_logs ALTER COLUMN mode SET NOT NULL;

-- Enforce mode values
ALTER TABLE public.quiz_logs DROP CONSTRAINT IF EXISTS quiz_logs_mode_check;
ALTER TABLE public.quiz_logs
  ADD CONSTRAINT quiz_logs_mode_check
  CHECK (mode IN ('mbti', 'interest', 'career'));

-- Helpful index
CREATE INDEX IF NOT EXISTS quiz_logs_mode_idx ON public.quiz_logs (mode);
