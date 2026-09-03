-- 본문·해설에 섞여 들어간 캐리지 리턴(\r) 을 지운다.
--
-- 까닭: 생성한 시드 SQL 을 git 이 CRLF 로 바꿔 놓는 바람에, 붙여 넣을 때
-- SQL 문자열 리터럴 안의 줄바꿈까지 \r\n 으로 들어갔다. 그 결과
-- 작품 해설이 문단으로 나뉘지 않고 한 덩어리로 나왔다.
--
-- 화면 쪽은 이미 CRLF 를 견디도록 고쳤으므로 이 정리는 데이터를 깨끗이
-- 두기 위한 것이다. 여러 번 돌려도 안전하다.

UPDATE public.works
SET body       = replace(body, chr(13), ''),
    commentary = replace(commentary, chr(13), ''),
    summary    = replace(summary, chr(13), '')
WHERE body LIKE '%' || chr(13) || '%'
   OR commentary LIKE '%' || chr(13) || '%'
   OR summary LIKE '%' || chr(13) || '%';

-- 확인: 0 이 나와야 한다
SELECT COUNT(*) AS "아직 CR 이 남은 작품"
FROM public.works
WHERE body LIKE '%' || chr(13) || '%'
   OR commentary LIKE '%' || chr(13) || '%'
   OR summary LIKE '%' || chr(13) || '%';
