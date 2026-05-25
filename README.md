# 온독 플러스 (ondok)

충남교육청 **온독지수 추천도서 214권**을 MBTI·취향 기반 진단 퀴즈로 학생에게 추천하는 웹사이트.

## 스택

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (semantic tokens via `@theme`)
- Supabase Postgres (books + 익명 quiz_logs)
- Vercel 배포 예정
- AI Harness Template (Ouroboros 워크플로우 + 품질 게이트) 적용

## 디렉토리 구조

```
src/
  app/              # Presentation: 페이지 (/, /quiz, /result)
  components/       # Presentation: 재사용 UI (Card, Button, Chip, ...)
  lib/              # Logic: 순수 TS 모듈 (mbti, recommend, questions, types)
  data/             # Data: Supabase 클라이언트, 책 저장소
scripts/
  xlsx-to-json.mjs  # 원본 xlsx → JSON 시드 변환
  books-schema.sql  # Supabase 테이블 + RLS 정책
  books-seed.sql    # 214권 UPSERT 시드
.harness/           # 품질 게이트, Ouroboros 시드
.claude/            # 슬래시 커맨드 + 에이전트 페르소나
```

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000 접속
```

Supabase 환경변수가 없으면 자동으로 `src/data/books-seed.json` 로컬 시드로 폴백합니다. 따라서 외부 설정 없이도 전 페이지가 동작합니다.

## 데이터 시드 재생성

원본 xlsx가 갱신되었을 때:

```bash
node scripts/xlsx-to-json.mjs
# → src/data/books-seed.json
# → scripts/books-seed.sql
```

기본 입력 경로는 `C:\Users\User\Documents\카카오톡 받은 파일\온독지수_도서_책소개_네이버_표지포함.xlsx`입니다. 다른 경로면 인자로 전달:

```bash
node scripts/xlsx-to-json.mjs "path/to/file.xlsx"
```

## Supabase 설정

1. https://supabase.com 에서 새 프로젝트 생성 (region: Northeast Asia (Seoul) 권장).
2. **SQL Editor**에서 `scripts/books-schema.sql` 실행 → 테이블 + RLS 생성.
3. **SQL Editor**에서 `scripts/books-seed.sql` 실행 → 214권 시드.
4. **Project Settings → API** 에서 `URL`, `anon public` 키 복사.
5. `.env.local` 파일 작성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
# 또는 새 Supabase publishable key 사용:
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
ADMIN_EMAILS=teacher@example.com
```

6. **Auth → Users**에서 관리자 이메일/비밀번호 계정을 만들고, 그 이메일을
   `ADMIN_EMAILS`에 추가합니다. 여러 명이면 쉼표로 구분합니다. 대신
   `app_metadata.role = "admin"` 또는 `app_metadata.roles = ["admin"]`으로도
   관리자 권한을 줄 수 있습니다.
7. `npm run dev` 재시작.

## Vercel 배포

1. GitHub에 푸시 (`origin/main`).
2. https://vercel.com 에서 **New Project → Import Git Repository**.
3. **Environment Variables**에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(또는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`), `ADMIN_EMAILS` 추가.
4. Deploy.

빌드 캐시 + 정적 페이지 prerender 덕분에 첫 배포 후에는 초당 수많은 요청도 무리 없이 처리됩니다.

## 추천 로직 개요

`src/lib/recommend.ts`의 `recommend(books, answers, limit)`는 다음을 합산합니다.

| 요소 | 점수 | 비고 |
|------|------|------|
| MBTI 기질(NF/NT/SJ/SP) ↔ 분류 가중치 | 0~3점 | `CATEGORY_WEIGHTS` 테이블 |
| 관심 분야 직접 매칭 | +5점 | 학생 선택 카테고리 |
| 분위기 키워드 매칭 | +1.5×N (최대 +6) | 책소개 텍스트 내 키워드 |
| 호흡(이야기/정보) 보너스 | +2점 | 문학(이야기) / 과학·사회(정보) |

상위 점수에서 **카테고리 다양성**을 보장 (최소 2개 분류 노출 후 점수순 채움).

## 품질 게이트

- `npm run build` — Next/TS 타입 검사 통과 필수.
- `.harness/gates/check-secrets.sh` — .env 등 시크릿 누출 검사.
- `.harness/gates/check-boundaries.sh` — 레이어 경계 위반 검사 (Presentation → Data 직접 import 금지).
- `.harness/detect-violations.sh` — 전체 게이트 일괄 실행.

## 라이선스 / 데이터 출처

- 도서 메타데이터(서명/저자/출판사/책소개/표지): 충남교육청 온독지수 추천도서 목록.
- 표지 이미지: 네이버 책 (https://*.pstatic.net) 직접 참조.
- 코드: MIT (별도 라이선스 파일 추가 예정).
