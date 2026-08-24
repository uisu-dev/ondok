-- 배지 조건 완화에 따른 소급 지급.
--
-- 이전 규칙은 형광펜 문제를 '첫 시도에' 맞혀야 배지를 줬다. 한 번 틀리면
-- 작품을 통째로 다시 읽어야 해서 학생들이 포기했고, 그래서 조건을
-- '다시 풀어 맞혀도 인정'으로 바꿨다.
--
-- 문제는 이미 조건을 채워 놓고도 배지를 못 받은 학생들이다. 배지는
-- 기록을 저장할 때만 판정되므로, 그 학생들이 뭔가를 다시 건드리기
-- 전까지는 배지가 나오지 않는다. 여기서 한 번에 소급 지급한다.
--
-- 조건 (앱의 earnsBadge 와 같다):
--   완독 + 점검 문제 전부 작성 + 그 작품의 quiz 주석을 전부 ok

UPDATE public.work_records wr
SET badge_at   = NOW(),
    updated_at = NOW()
FROM public.works w
WHERE w.id = wr.work_id
  AND wr.badge_at IS NULL
  AND wr.completed_at IS NOT NULL
  AND wr.answered_count >= COALESCE(jsonb_array_length(w.questions), 0)
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_each(COALESCE(w.annotations, '{}'::jsonb)) AS a(akey, aval)
    WHERE aval->>'type' = 'quiz'
      AND COALESCE(wr.note_answers -> a.akey ->> 'ok', 'false') <> 'true'
  );

-- 몇 명에게 나갔는지 확인용
SELECT COUNT(*) AS 소급지급_배지수
FROM public.work_records
WHERE badge_at::date = NOW()::date;
