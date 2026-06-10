-- popular_favorites: 즐겨찾기(하트) 수 기준 인기 항목 집계 RPC
--
-- 메인 화면에서 '추천 많이 받은' 도서·활동지를 보여주기 위해 사용.
-- service_role 로 호출 (전체 사용자 기준 집계).

CREATE OR REPLACE FUNCTION public.popular_favorites(p_kind TEXT, p_limit INT)
RETURNS TABLE(target_id TEXT, cnt BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT target_id, COUNT(*)::BIGINT AS cnt
  FROM public.favorites
  WHERE kind = p_kind
  GROUP BY target_id
  ORDER BY cnt DESC, target_id
  LIMIT p_limit;
$$;
