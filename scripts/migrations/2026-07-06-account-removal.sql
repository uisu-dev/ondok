-- (1) 학생 현황에 아이디(login_id) 노출  (2) 부적절 계정 탈퇴 처리 기록

-- ── 탈퇴 처리된 아이디 ────────────────────────────────────────────
-- auth.users 를 지우면 profiles 등은 CASCADE 로 함께 사라지므로, '왜 지워졌는지'를
-- 남겨 두어야 그 아이디로 로그인·재가입을 시도할 때 안내할 수 있다.
CREATE TABLE IF NOT EXISTS public.removed_accounts (
  login_id      TEXT PRIMARY KEY,
  display_name  TEXT,
  school_code   TEXT,
  reason        TEXT,
  removed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_by    TEXT              -- 처리한 관리자 표시용 (이름 또는 'superadmin')
);

ALTER TABLE public.removed_accounts ENABLE ROW LEVEL SECURITY;
-- 클라이언트 직접 조회는 막고, 서버(service_role)에서만 읽고 쓴다.

-- ── student_dashboard 에 login_id 추가 ────────────────────────────
DROP FUNCTION IF EXISTS public.student_dashboard(TEXT);

CREATE OR REPLACE FUNCTION public.student_dashboard(p_school_code TEXT)
RETURNS TABLE(
  id UUID,
  login_id TEXT,
  display_name TEXT,
  school_code TEXT,
  school_name TEXT,
  birth_year INT,
  mbti TEXT,
  sago BIGINT,
  sago_g1 BIGINT,
  sago_g2 BIGINT,
  sago_g3 BIGINT,
  sago_g4 BIGINT,
  books BIGINT,
  sheets BIGINT,
  works_read BIGINT,
  works_done BIGINT,
  battle_wins BIGINT,
  game_plays BIGINT,
  last_active TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.login_id,
    p.display_name,
    p.school_code,
    s.name AS school_name,
    p.birth_year,
    p.mbti,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id) AS sago,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '1.%') AS sago_g1,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '2.%') AS sago_g2,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '3.%') AS sago_g3,
    (SELECT COUNT(*) FROM public.sago_progress sp WHERE sp.user_id = p.id AND sp.word_key LIKE '4.%') AS sago_g4,
    (SELECT COUNT(*) FROM public.favorites f WHERE f.user_id = p.id AND f.kind = 'book') AS books,
    (SELECT COUNT(*) FROM public.worksheet_responses wr WHERE wr.user_id = p.id) AS sheets,
    (SELECT COUNT(*) FROM public.work_records wk WHERE wk.user_id = p.id) AS works_read,
    (SELECT COUNT(*) FROM public.work_records wk WHERE wk.user_id = p.id AND wk.completed_at IS NOT NULL) AS works_done,
    (SELECT COALESCE(SUM(g.score), 0) FROM public.game_scores g WHERE g.user_id = p.id AND g.game_type = 'battle') AS battle_wins,
    (SELECT COUNT(*) FROM public.game_scores g WHERE g.user_id = p.id) AS game_plays,
    GREATEST(
      (SELECT MAX(sp.known_at)   FROM public.sago_progress sp       WHERE sp.user_id = p.id),
      (SELECT MAX(wr.updated_at) FROM public.worksheet_responses wr WHERE wr.user_id = p.id),
      (SELECT MAX(wk.updated_at) FROM public.work_records wk        WHERE wk.user_id = p.id),
      (SELECT MAX(g.created_at)  FROM public.game_scores g          WHERE g.user_id = p.id)
    ) AS last_active
  FROM public.profiles p
  LEFT JOIN public.schools s ON s.code = p.school_code
  WHERE p.role = 'student'
    AND (p_school_code IS NULL OR p.school_code = p_school_code)
  ORDER BY p.display_name;
$$;
