-- Migration: 회원가입 인프라 (ID/비번 자체 가입)
--   schools — 충남 중·고·특수 학교 명단 (별도 schools-seed.sql 로 데이터 입력)
--   profiles — auth.users 와 1:1, 사용자 부가 정보 (아이디·이름·학교·권한)
--   sago_progress — 학생 사고도구어 학습 진도 (cross-device sync)
--
-- 인증 방식: Supabase Authentication → Email/Password provider 사용.
-- Supabase 의 email 컬럼은 내부적으로 '<login_id>@ondok.local' 형태로 저장하고,
-- 사용자에게는 login_id 만 보여준다.

-- 학교 명단
CREATE TABLE IF NOT EXISTS public.schools (
  code  TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  type  TEXT NOT NULL CHECK (type IN ('middle', 'high', 'special'))
);
CREATE INDEX IF NOT EXISTS schools_type_idx ON public.schools(type);
CREATE INDEX IF NOT EXISTS schools_name_idx ON public.schools(name);

-- 사용자 프로필 (auth.users 1:1)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login_id      TEXT,                  -- 사용자가 가입 시 정한 아이디 (영문/숫자/_/.)
  display_name  TEXT,
  school_code   TEXT REFERENCES public.schools(code),
  role          TEXT NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student', 'teacher', 'admin')),
  teacher_application_status TEXT NOT NULL DEFAULT 'none'
                  CHECK (teacher_application_status IN ('none', 'pending', 'approved', 'rejected')),
  teacher_application_at  TIMESTAMPTZ,
  teacher_approved_at     TIMESTAMPTZ,
  teacher_rejection_note  TEXT,
  onboarded_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- login_id 는 대소문자 무시 유니크
CREATE UNIQUE INDEX IF NOT EXISTS profiles_login_id_unique
  ON public.profiles (lower(login_id))
  WHERE login_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_school_idx ON public.profiles(school_code);
CREATE INDEX IF NOT EXISTS profiles_application_idx ON public.profiles(teacher_application_status)
  WHERE teacher_application_status = 'pending';

-- 사고도구어 학습 진도 (per-user × per-word)
CREATE TABLE IF NOT EXISTS public.sago_progress (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_key  TEXT NOT NULL,  -- 'grade.raw' 예: '1.검사3'
  known_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, word_key)
);
CREATE INDEX IF NOT EXISTS sago_progress_user_idx ON public.sago_progress(user_id);

-- RLS
ALTER TABLE public.schools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sago_progress   ENABLE ROW LEVEL SECURITY;

-- schools : 누구나 읽기
DROP POLICY IF EXISTS "schools public read" ON public.schools;
CREATE POLICY "schools public read"
  ON public.schools FOR SELECT
  TO anon, authenticated
  USING (true);

-- profiles : 자기 것만 읽기/쓰기
DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles insert own" ON public.profiles;
CREATE POLICY "profiles insert own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles update own" ON public.profiles;
CREATE POLICY "profiles update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
-- 권한(role)·승인(approval) 같은 민감 필드 변경은 service_role 로만 (서버 액션)

-- sago_progress : 자기 것만
DROP POLICY IF EXISTS "sago progress own" ON public.sago_progress;
CREATE POLICY "sago progress own"
  ON public.sago_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 가입 시 빈 profile 자동 생성 트리거.
-- /signup 서버 액션이 곧이어 login_id / display_name / school_code 를 채운다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
