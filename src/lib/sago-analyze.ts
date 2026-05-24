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

/**
 * Naive substring matcher: 표제어가 본문에 한 번이라도 등장하면 1 카운트.
 * 한국어 형태소 분석을 하지 않으므로 "단순"이 "단순하다"·"단순함" 안에도
 * 검출되지만, 일반적인 학습용 통계 표시 목적으로는 충분히 유용.
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
