-- 충남교육청(office) 학교 타입 추가 + 교원 소속교 정정.

-- schools.type 에 'office'(교육청 등 기관) 허용
ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_type_check;
ALTER TABLE public.schools
  ADD CONSTRAINT schools_type_check
  CHECK (type IN ('middle', 'high', 'special', 'office'));

-- 충남교육청 추가
INSERT INTO public.schools (code, name, type)
VALUES ('본청00', '충남교육청', 'office')
ON CONFLICT (code) DO NOTHING;

-- 공주여중학교 → 정식명 공주여자중학교
UPDATE public.schools SET name = '공주여자중학교' WHERE code = '중02-03';

-- 교원 소속교 정정 (display_name 기준, 교원/관리자만)
UPDATE public.profiles SET school_code = '중10-05', updated_at = NOW()
  WHERE display_name = '신영섭' AND role IN ('teacher', 'admin');   -- 비인중학교
UPDATE public.profiles SET school_code = '중04-12', updated_at = NOW()
  WHERE display_name = '오재중' AND role IN ('teacher', 'admin');   -- 음봉중학교
UPDATE public.profiles SET school_code = '고34', updated_at = NOW()
  WHERE display_name = '김혜진' AND role IN ('teacher', 'admin');   -- 배방고등학교
UPDATE public.profiles SET school_code = '중02-03', updated_at = NOW()
  WHERE display_name = '박건희' AND role IN ('teacher', 'admin');   -- 공주여자중학교
UPDATE public.profiles SET school_code = '중04-04', updated_at = NOW()
  WHERE display_name = '온지은' AND role IN ('teacher', 'admin');   -- 온양신정중학교
UPDATE public.profiles SET school_code = '본청00', updated_at = NOW()
  WHERE display_name = '장은정' AND role IN ('teacher', 'admin');   -- 충남교육청
