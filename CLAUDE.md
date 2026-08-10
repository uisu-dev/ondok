# CLAUDE.md — ondok

This file provides guidance to Claude Code when working with this repository.

## CRITICAL: Read ARCHITECTURE_INVARIANTS First

**BEFORE starting ANY work**, read `ARCHITECTURE_INVARIANTS.md` to understand the project's non-negotiable rules.

### Document Priority

1. **ARCHITECTURE_INVARIANTS.md** (Supreme - overrides all)
2. **docs/adr.yaml** (Architecture Decision Records)
3. **CLAUDE.md** (This file)
4. **docs/code-convention.yaml** (Coding conventions)

**When in conflict, ARCHITECTURE_INVARIANTS.md always wins.**

---

## Project Overview

**ondok** (온독 플러스) — 충남교육청 온독지수 추천도서 214권을 MBTI·취향 기반 진단 퀴즈로 학생에게 추천하는 웹사이트.

| Item | Detail |
|------|--------|
| Stacks | nodejs, nextjs |
| Package Manager | npm |
| Frontend | src/app, src/components |
| Backend | src/lib, src/data (Supabase) |

**참조 문서**:
- 사양: `.harness/ouroboros/seeds/seed-v1.yaml`
- 인터뷰: `.harness/ouroboros/interviews/interview-2026-05-21.md`
- 데이터 시드: `src/data/books-seed.json` (214권), `scripts/books-seed.sql`
- Supabase 스키마: `scripts/books-schema.sql`

### 3-tier layer mapping (현 프로젝트)

| Layer | 디렉토리 | 책임 |
|-------|---------|------|
| Presentation | `src/app/`, `src/components/` | UI 렌더링, 라우팅, 폼 상태 (클라이언트 컴포넌트) |
| Logic | `src/lib/` | MBTI 파싱, 추천 알고리즘, 질문 정의, 순수 TS 모듈 |
| Data | `src/data/` | Supabase 클라이언트, books/quiz_logs 저장소, JSON fallback |

**Presentation은 Data를 직접 import하지 않는다** — 결과 페이지에서는 `getAllBooks()`/`logQuiz()`만 호출하며, 이들은 내부에서 Supabase 호출 또는 JSON fallback을 처리한다.

---

## Absolute Rules (NEVER violate)

1. **3-tier layer separation** — Presentation / Logic / Data 계층을 반드시 준수
2. **No layer skipping** — Presentation → Logic → Data 순서로만 호출. 레이어를 건너뛰지 않는다
3. **No secrets in code** — Use environment variables. Never commit .env files
4. **No new dependencies without approval** — Ask before adding packages
5. **Follow existing patterns** — Match the codebase's style, don't introduce new paradigms
6. **Run tests before committing** — All tests must pass

---

## Architecture Layers (3-Tier)

이 프로젝트는 **3-tier layered architecture**를 따릅니다.

### Layer Definitions

| Layer | 책임 | 금지사항 |
|-------|------|---------|
| **Presentation** | 사용자 소통 (UI, HTTP 요청/응답, 입력 검증, 응답 포맷팅) | 비즈니스 로직 금지, DB 직접 접근 금지 |
| **Logic** | 비즈니스 규칙 (알고리즘, 검증, 트랜잭션, 서비스 조율) | UI 코드 금지, Raw SQL 금지, HTTP 응답 직접 처리 금지 |
| **Data** | 데이터 소통 (DB 조작, 외부 API 호출, 캐싱) | 비즈니스 로직 금지, Presentation 의존 금지 |

### Stack-Layer Mapping


### Layer Communication Rules

```
Presentation ──→ Logic ──→ Data
     ↑               ↑
   DTO/Interface    Model/Entity

  ✅ Presentation → Logic (via service call)
  ✅ Logic → Data (via repository/ORM)
  ❌ Presentation → Data (layer skip)
  ❌ Data → Logic (reverse dependency)
  ❌ Logic → Presentation (reverse dependency)
```

- **레이어 간 통신은 DTO/인터페이스를 통해서만** — 내부 도메인 객체를 직접 노출하지 않는다
- **하위 레이어만 호출** — 상위 레이어를 절대 import하지 않는다
- **각 모듈은 자기 레이어의 책임만 갖는다** — 한 모듈이 다른 레이어의 일을 하면 안 된다

### Testing by Layer

- **Logic Layer**: 테스트 커버리지 최우선. 순수 비즈니스 로직에 집중. mock은 최소화
- **Data Layer**: 통합 테스트 위주. 실제 DB/외부 서비스 연동 검증
- **Presentation Layer**: E2E/스냅샷 테스트. UI 렌더링과 라우팅 검증
- **원칙**: 구현과 테스트를 함께 작성. 일괄 작성 금지

---

## Development Workflow

### Ouroboros Loop (Specification-First)

For new features or significant changes, use the Ouroboros workflow:

```
/interview "what to build"  →  /seed  →  /run  →  /evaluate  →  /evolve
     (명세 확정)              (스펙 생성)  (구현)    (검증)       (진화)
```

1. **`/interview`** — Socratic interview to clarify requirements (Ambiguity <= 0.2 to pass)
2. **`/seed`** — Generate immutable spec from interview
3. **`/run`** — Execute via Double Diamond (Discover→Define→Design→Deliver)
4. **`/evaluate`** — 3-stage verification (Mechanical→Semantic→Judgment)
5. **`/evolve`** — Incorporate learnings, converge ontology

Other commands: `/unstuck` (when stuck), `/pm` (generate PRD)

### Before Starting Work
1. Read `ARCHITECTURE_INVARIANTS.md`
2. Check `docs/adr.yaml` for relevant architectural decisions
3. For new features: run `/interview` to clarify scope first
4. Understand the scope of changes

### During Work
1. Follow `docs/code-convention.yaml` rules for your stack
2. Respect dependency boundaries (see `.harness/gates/rules/boundaries.yaml`)
3. Stay aligned with seed spec (if exists in `.harness/ouroboros/seeds/`)
4. Write tests for new functionality

### Before Committing
1. `npx tsc --noEmit` — 타입 검사
2. `npm run build` — 빌드가 통과하는지
3. 작품(content/works) 을 건드렸으면 `node scripts/build-works-seed.mjs`
4. 비밀키가 섞여 들어가지 않았는지 확인 (`.env.local` 은 커밋 금지)

---

## Harness Gates — 사용하지 않음

`.harness/gates/*.sh` 는 템플릿에 딸려 온 검사 스크립트이나 **이 프로젝트에서는 쓰지 않는다.**

check-boundaries.sh 가 import 구문을 파싱하지 않고 줄 안의 문자열만 훑어
오탐을 쏟아 냈기 때문이다. 예를 들어 이런 것들을 위반으로 잡았다.

- `form.append("file", blob, "upload.jpg")` → `.jpg` 의 `pg` 를 PostgreSQL import 로 오인
- `const defs = definitionsData...`        → `defs` 의 `fs` 를 Node fs import 로 오인

CI 워크플로(.github/workflows/harness-gates.yaml)는 2026-08-10 에 제거했다.
검증은 위의 타입 검사·빌드로 대신한다.

---

## Agent Personas

9 specialized agents available via commands:

| Agent | Role | When to Use |
|-------|------|-------------|
| Interviewer | 질문만 한다 | `/interview` — 요구사항 명확화 |
| Ontologist | 본질을 정의한다 | `/seed` — 도메인 모델 추출 |
| Seed Architect | 스펙을 결정화한다 | `/seed` — 불변 명세 생성 |
| Evaluator | 검증한다 | `/evaluate` — 3단계 평가 |
| Contrarian | 반대 상황을 묻는다 | `/evolve` — 가정 검증 |
| Simplifier | 복잡성을 줄인다 | `/unstuck` — 단순화 |
| Researcher | 근거를 조사한다 | `/unstuck` — 사실 확인 |
| Architect | 구조를 본다 | `/unstuck` — 설계 분석 |
| Hacker | 우회로를 찾는다 | `/unstuck` — 임시 해결 |

---

## Reference Documents

- `docs/code-convention.yaml` — Coding conventions (filterable by `stacks` field)
- `docs/adr.yaml` — Architecture Decision Records (filterable by `stacks`, `date`, `status`)
- `.harness/gates/rules/boundaries.yaml` — Dependency boundary rules
- `.harness/gates/rules/structure.yaml` — Project structure rules
- `.harness/ouroboros/seeds/` — Seed specifications (if using Ouroboros workflow)
- `.harness/ouroboros/scoring/ambiguity-checklist.yaml` — Ambiguity scoring criteria
