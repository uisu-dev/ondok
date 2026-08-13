-- 학교 명단 보정 — 자동 생성: scripts/fetch-schools-neis.mjs
-- 출처: NEIS 학교기본정보 API (충청남도교육청 N10)
--
-- 기존 학교의 code 는 건드리지 않는다. profiles.school_code 가 이를 FK 로
-- 참조하므로 코드를 바꾸면 학생·교원 소속이 끊긴다.
-- 신규 학교의 code 는 NEIS 표준학교코드를 그대로 쓴다.

-- ① 이름 정정 2개 (같은 학교이므로 코드 유지)
UPDATE public.schools SET name = '충남다사랑학교' WHERE code = '고37';  -- 충남다사랑
UPDATE public.schools SET name = '충남온라인학교' WHERE code = '고81';  -- 충남온라인

-- 추가할 학교 없음
