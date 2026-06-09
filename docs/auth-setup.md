# 회원가입 셋업 가이드 (자체 ID/비번)

소셜 OAuth 대신 사용자가 **직접 정한 아이디·비번**으로 가입하도록 단순화했습니다.
Supabase 대시보드에서 해야 하는 작업은 **딱 두 가지**입니다.

## 1) DB 마이그레이션 적용 (한 번만)

Supabase Dashboard → SQL Editor 에서 순서대로 실행:

1. `scripts/migrations/2026-06-05-auth-profiles.sql` — `profiles`, `schools`, `sago_progress` 테이블 + RLS + 가입 트리거
2. `scripts/schools-seed.sql` — 충남 중·고·특수 학교 **238개** 시드

다시 학교 목록을 갱신하려면:

```bash
node scripts/extract-schools.mjs "C:/.../학교 명단.xlsx"
# → src/data/schools.json + scripts/schools-seed.sql 재생성
```

## 2) Supabase Auth — Email Provider + 이메일 확인 끄기

Supabase Dashboard → **Authentication** → **Providers** → **Email** :

- **Enable Email provider** : ON (기본값)
- **Confirm email** : **OFF** ← 중요. 이걸 켜두면 가입 즉시 로그인이 안 됩니다.

내부적으로는 `<아이디>@ondok.local` 이라는 가짜 이메일로 저장되고,
사용자에게는 자기가 정한 아이디만 보입니다.

> Site URL / Redirect URLs 설정은 더 이상 필요 없습니다 (외부 리디렉트가 없으므로).

## 끝.

위 두 가지만 끝내면 회원가입 → 로그인 → 마이페이지 → 사고도구어 진도 동기화까지 즉시 동작합니다.

---

## 권한 모델 (변동 없음)

| Role | 부여 시점 | 권한 |
|------|----------|------|
| `student` | 가입 즉시 자동 부여 | 활동지 풀이·학생용 인쇄, 사고도구어 학습 진도 자동 저장, 마이페이지 |
| `teacher` | 학생이 ‘교원 승인 신청’ → 관리자가 승인 | 학생 권한 + 활동지 만들기/수정/교사용 인쇄(정답 포함) |
| `admin` | DB 에서 직접 부여 | 교원 권한 + `/admin/teachers` 승인 큐 처리 |

### 첫 admin 만들기

```sql
-- Supabase SQL Editor 에서:
UPDATE public.profiles
SET role = 'admin'
WHERE login_id = '여기에_본인_아이디';
```

또는 기존 슈퍼관리자 비번(`uisu9060`)으로 `/admin/login` 들어가면
`/admin/teachers` 에서 똑같이 승인/반려 가능.

## 가입 정책 (필요시 조정)

`src/lib/login-id.ts` 에서 변경:

- **아이디 규칙**: 영문 소문자로 시작, 4~20자, 영문/숫자/_/. 허용
- **예약어**: admin, root, system, ondok, support 등 자동 차단
- **비밀번호**: 8자 이상 (코드에서 검증)

## 사용자가 비번을 잊어버렸을 때 (당장은 수동)

Supabase Dashboard → Authentication → Users → 해당 사용자 선택
→ ‘…’ 메뉴에서 **Reset password** 또는 임시 비번 재발급.

자체 비번찾기 UI 는 차후 추가 가능 (이메일 발송 인프라가 없으므로,
관리자가 직접 초기화 후 새 임시 비번을 알려주는 방식이 가장 단순합니다).
