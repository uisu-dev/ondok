-- Patch: profiles 에 login_id 컬럼 추가 + 모든 사용자 초기화
--
-- 1) 첫 마이그레이션이 login_id 없는 버전이었던 경우 CREATE TABLE IF NOT EXISTS 가
--    두 번째 실행을 건너뛰어 컬럼이 누락됨 → ALTER TABLE 로 보강.
-- 2) 모든 가입자 삭제 후, 새로 본인 한 명만 가입 → role='admin' 으로 승급.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS login_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_id_unique
  ON public.profiles (lower(login_id))
  WHERE login_id IS NOT NULL;

-- 전체 사용자 삭제. auth.users CASCADE 로 public.profiles 행도 같이 사라짐.
DELETE FROM auth.users;

-- sago_progress 도 비움 (혹시 남아 있는 학습 기록 정리)
TRUNCATE TABLE public.sago_progress;
