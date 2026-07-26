import sagoData from "@/data/sago-words.json";

interface SagoWord {
  grade: number;
  word: string;
  suffix: number | null;
  raw: string;
}

const ALL: SagoWord[] = (sagoData.words as SagoWord[]).slice();

// 빈도 분포가 매우 다르므로 길이가 긴 어휘부터 매칭 ⇒ "단순화"가 "단순"으로
// 중복 카운트되지 않게 함. (간단한 휴리스틱 — 완벽한 형태소 분석은 아님)
const BY_LENGTH = [...ALL].sort((a, b) => b.word.length - a.word.length);

export interface SagoStats {
  total: number; // 등장한 표제어(고유) 개수
  byGrade: Record<1 | 2 | 3 | 4, number>;
  matches: { word: string; grade: number; count: number }[];
}

/** 한글 음절인지. */
function isHangul(c: string | undefined): boolean {
  return !!c && c >= "가" && c <= "힣";
}

/**
 * 표제어 바로 뒤에 붙으면 '다른 낱말의 일부'로 보는 글자 (용언 활용 어미).
 *   저지 + 른  → 저지르다   (沮止 아님)
 *   주시 + 면  → 주다       (注視 아님)
 *   전이 + 었  → ~전이었다  (轉移 아님)
 * 조사(은·는·이·가·을·를·도·의…)와 '하다/되다/적' 파생은 명사 뒤에 정상적으로
 * 붙으므로 막지 않는다. (요구했다·양식을·비교하면 등은 그대로 인정)
 */
const TAIL_BLOCK = new Set(["었", "였", "겠", "면", "러", "려", "니", "른"]);

/**
 * 표제어를 본문에서 찾아 카운트한다. 형태소 분석기는 아니지만 두 가지
 * 어절 경계 규칙으로 오탐을 크게 줄인다.
 *
 *  1) 어절 중간에서 시작하는 매칭 제외 — 앞 글자가 한글이면 무시
 *     (흥부가→'부가', 남편의→'편의', 세상이→'상이', 부모의→'모의')
 *  2) 뒤에 용언 어미가 붙으면 제외 — TAIL_BLOCK 참고
 *
 * 그 대가로 '재분석' 안의 '분석'처럼 접두사가 붙은 합성어는 놓치지만,
 * 서사문·설명문 모두에서 잡음이 훨씬 크므로 이 편이 통계가 정확하다.
 */
export function analyzeSago(passage: string): SagoStats {
  if (!passage || !passage.trim()) {
    return {
      total: 0,
      byGrade: { 1: 0, 2: 0, 3: 0, 4: 0 },
      matches: [],
    };
  }
  // Use a working copy of the passage where we *mask out* matched ranges so a
  // shorter headword can't also match inside a longer one we've already counted.
  let working = passage;
  const matches: SagoStats["matches"] = [];
  const seen = new Set<string>();

  for (const w of BY_LENGTH) {
    if (seen.has(w.word)) continue;
    let count = 0;
    let from = 0;
    while (true) {
      const idx = working.indexOf(w.word, from);
      if (idx < 0) break;
      const prev = idx > 0 ? working[idx - 1] : undefined;
      const next = working[idx + w.word.length];
      // 어절 시작이 아니거나(앞이 한글), 뒤에 용언 어미가 붙으면 다른 낱말로 본다.
      if (isHangul(prev) || (isHangul(next) && TAIL_BLOCK.has(next!))) {
        from = idx + 1;
        continue;
      }
      count++;
      // mask the matched span so subsequent shorter headwords don't reuse it
      working =
        working.slice(0, idx) +
        " ".repeat(w.word.length) +
        working.slice(idx + w.word.length);
      from = idx + w.word.length;
    }
    if (count > 0) {
      matches.push({ word: w.word, grade: w.grade, count });
      seen.add(w.word);
    }
  }

  const byGrade: SagoStats["byGrade"] = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const m of matches) {
    byGrade[m.grade as 1 | 2 | 3 | 4]++;
  }
  return { total: matches.length, byGrade, matches };
}

/** "사고도구어 12개 · 1급 1 · 2급 4 · 3급 5 · 4급 2" 같은 짧은 한 줄 요약. */
export function formatSagoStatsLine(stats: SagoStats): string {
  if (stats.total === 0) return "사고도구어 0개";
  const g = stats.byGrade;
  return `사고도구어 ${stats.total}개 · 1급 ${g[1]} · 2급 ${g[2]} · 3급 ${g[3]} · 4급 ${g[4]}`;
}

export type SchoolLevel = "초등" | "중등" | "고등";
export type Rank = "하" | "중" | "상";

export interface Difficulty {
  level: SchoolLevel;
  rank: Rank;
}

const LEVEL_ORDER: Record<SchoolLevel, number> = {
  초등: 1,
  중등: 2,
  고등: 3,
};
const ORDER_TO_LEVEL: Record<1 | 2 | 3, SchoolLevel> = {
  1: "초등",
  2: "중등",
  3: "고등",
};

/**
 * 학교급(초·중·고) × 단계(상·중·하) 9단계 난이도 산출.
 *
 * 세 가지 시그널을 결합:
 *   1) 가중평균 등급 (사고도구어 등급별 비중)
 *   2) 지문 분량 (글자 수)  — 짧은 글은 학교급 상한이 됨
 *   3) 사고도구어 표본 크기 — 너무 적으면 추정이 부정확하므로 상한
 *
 * 짧고 단어 적은 글이 한두 개의 어려운 단어 때문에 중·고등으로 오판되는
 * 문제를 보완. 분량·표본의 캡이 평균보다 낮으면 캡 학교급의 '상'으로 맞춤.
 */
export function difficultyOf(
  stats: SagoStats,
  passage?: string | null
): Difficulty | null {
  if (stats.total === 0) return null;

  const g = stats.byGrade;
  const sagoCount = stats.total;
  const avg = (g[1] * 1 + g[2] * 2 + g[3] * 3 + g[4] * 4) / sagoCount;
  const charCount = passage ? passage.replace(/\s+/g, "").length : 0;

  // 1) 가중평균 기반 학교급 + 단계
  let avgLevel: SchoolLevel;
  let avgRank: Rank;
  if (avg <= 1.5) {
    avgLevel = "초등";
    avgRank = "하";
  } else if (avg <= 1.9) {
    avgLevel = "초등";
    avgRank = "중";
  } else if (avg <= 2.3) {
    avgLevel = "초등";
    avgRank = "상";
  } else if (avg <= 2.6) {
    avgLevel = "중등";
    avgRank = "하";
  } else if (avg <= 2.9) {
    avgLevel = "중등";
    avgRank = "중";
  } else if (avg <= 3.2) {
    avgLevel = "중등";
    avgRank = "상";
  } else if (avg <= 3.5) {
    avgLevel = "고등";
    avgRank = "하";
  } else if (avg <= 3.8) {
    avgLevel = "고등";
    avgRank = "중";
  } else {
    avgLevel = "고등";
    avgRank = "상";
  }

  // 2) 분량 상한 — 지문 글자 수(공백 제외)에 따라 최대 학교급 제한
  //    초등 글 = 50~150자, 중등 글 = 150~400자, 고등 글 = 400자 이상
  //    (지문 텍스트가 없으면 상한 없음)
  const lengthCap: SchoolLevel | null =
    charCount === 0 ? null : charCount < 150 ? "초등" : charCount < 400 ? "중등" : "고등";

  // 3) 표본 크기 상한 — 사고도구어 수가 너무 적으면 평균이 부정확
  const sampleCap: SchoolLevel =
    sagoCount < 3 ? "초등" : sagoCount < 8 ? "중등" : "고등";

  // 두 상한 중 더 낮은 것이 실효 상한
  const capOrder = Math.min(
    lengthCap ? LEVEL_ORDER[lengthCap] : 3,
    LEVEL_ORDER[sampleCap]
  ) as 1 | 2 | 3;
  const effectiveCap = ORDER_TO_LEVEL[capOrder];

  // 평균 학교급이 상한을 넘으면 상한 학교급의 '상' 으로 표기
  if (LEVEL_ORDER[avgLevel] > capOrder) {
    return { level: effectiveCap, rank: "상" };
  }
  return { level: avgLevel, rank: avgRank };
}

/** "초등 하" 등의 문자열을 Difficulty 객체로 파싱. 잘못된 형식은 null. */
export function parseDifficulty(s: string | null | undefined): Difficulty | null {
  if (!s) return null;
  const m = s.trim().match(/^(초등|중등|고등)\s+([하중상])$/);
  if (!m) return null;
  return { level: m[1] as SchoolLevel, rank: m[2] as Rank };
}

/** 사용 가능한 9단계 라벨 배열 (UI select 등에서 사용). */
export const DIFFICULTY_OPTIONS: Difficulty[] = (
  ["초등", "중등", "고등"] as SchoolLevel[]
).flatMap((level) =>
  (["하", "중", "상"] as Rank[]).map((rank) => ({ level, rank }))
);

/** "초등 하" 형식의 한 줄 라벨. */
export function difficultyLabel(diff: Difficulty): string {
  return `${diff.level} ${diff.rank}`;
}

/** 난이도 chip 색 — 학교급별로 색이 다르고, 단계는 그대로 표기. */
export function difficultyClass(diff: Difficulty): string {
  // 초등 = 초록, 중등 = 주황, 고등 = 보라 (책 분류 색에서 차용)
  switch (diff.level) {
    case "초등":
      return "bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-[var(--color-cat-sci)]";
    case "중등":
      return "bg-[color-mix(in_oklab,var(--color-cat-soc)_16%,white)] text-[var(--color-cat-soc)]";
    case "고등":
      return "bg-[color-mix(in_oklab,var(--color-cat-lit)_14%,white)] text-[var(--color-cat-lit)]";
  }
}
