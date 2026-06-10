-- favorites: 책 + 활동지 즐겨찾기 (하트)
--
-- kind 으로 종류 구분: 'book' = 추천도서, 'worksheet' = 활동지
-- target_id 는 TEXT 로 두어 양쪽 다 수용 (book 의 정수 id 든 worksheet 의 정수 id 든)

CREATE TABLE IF NOT EXISTS public.favorites (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('book', 'worksheet')),
  target_id   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, kind, target_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_kind_idx
  ON public.favorites (user_id, kind, created_at DESC);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites own" ON public.favorites;
CREATE POLICY "favorites own"
  ON public.favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
