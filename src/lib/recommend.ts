import type {
  Book,
  BookCategory,
  MBTIType,
  Mood,
  Pace,
  QuizAnswer,
  Recommendation,
} from "./types";

type Temperament = "NF" | "NT" | "SJ" | "SP";

const CATEGORY_WEIGHTS: Record<Temperament, Record<BookCategory, number>> = {
  // Idealists: care about meaning, people → literature + humanities
  NF: { 문학: 3, 인문: 2, 사회: 1, 과학: 1 },
  // Analysts: love systems, theory → science + humanities
  NT: { 과학: 3, 인문: 2, 사회: 1, 문학: 1 },
  // Sentinels: rules, community, structure → social + humanities
  SJ: { 사회: 3, 인문: 2, 과학: 1, 문학: 1 },
  // Explorers: experience-driven, balanced curiosity
  SP: { 문학: 2, 과학: 2, 사회: 2, 인문: 1 },
};

const MOOD_KEYWORDS: Record<Mood, string[]> = {
  warm: ["따뜻", "사랑", "행복", "가족", "친구", "마음", "포근"],
  exciting: ["흥미", "재미", "신기", "비밀", "추리", "사건", "박진감"],
  calm: ["잔잔", "평화", "고요", "일상", "산책", "조용"],
  deep: ["사유", "진지", "성찰", "의미", "철학", "생각", "물음"],
  adventurous: ["모험", "탐험", "도전", "여행", "미지", "용기"],
};

const MOOD_LABEL: Record<Mood, string> = {
  warm: "따뜻한",
  exciting: "신나는",
  calm: "잔잔한",
  deep: "깊이 있는",
  adventurous: "모험적인",
};

function temperament(type: MBTIType): Temperament {
  const sn = type[1];
  const tf = type[2];
  const jp = type[3];
  if (sn === "N") return tf === "F" ? "NF" : "NT";
  return jp === "J" ? "SJ" : "SP";
}

export interface ScoreBreakdown {
  mbtiFit: number;
  interest: number;
  mood: number;
  pace: number;
  total: number;
  reasons: string[];
}

function scoreBook(book: Book, answers: QuizAnswer): ScoreBreakdown {
  const reasons: string[] = [];
  const weights = CATEGORY_WEIGHTS[temperament(answers.mbti)];

  const mbtiFit = weights[book.category] ?? 0;
  if (mbtiFit >= 2) {
    reasons.push(`${answers.mbti} 유형이 끌릴 만한 ${book.category}`);
  }

  let interest = 0;
  if (answers.interests.includes(book.category)) {
    interest = 5;
    reasons.push(`관심 분야 ‘${book.category}’`);
  }

  let mood = 0;
  const kws = MOOD_KEYWORDS[answers.mood];
  let matchedKw = 0;
  for (const kw of kws) {
    if (book.description.includes(kw)) matchedKw++;
  }
  if (matchedKw > 0) {
    mood = Math.min(matchedKw * 1.5, 6);
    reasons.push(`‘${MOOD_LABEL[answers.mood]}’ 분위기`);
  }

  let pace = 0;
  if (answers.pace === "story" && book.category === "문학") {
    pace = 2;
    reasons.push("이야기 호흡");
  } else if (
    answers.pace === "info" &&
    (book.category === "과학" || book.category === "사회")
  ) {
    pace = 2;
    reasons.push("정보·지식 호흡");
  }

  return {
    mbtiFit,
    interest,
    mood,
    pace,
    total: mbtiFit + interest + mood + pace,
    reasons,
  };
}

/**
 * Score every book and return top picks, with category diversity.
 * Deterministic: same answers → same recommendations.
 */
export function recommend(
  books: Book[],
  answers: QuizAnswer,
  limit = 4
): Recommendation[] {
  const scored = books
    .map((book) => ({ book, breakdown: scoreBook(book, answers) }))
    .filter((x) => x.breakdown.total > 0)
    .sort(
      (a, b) =>
        b.breakdown.total - a.breakdown.total || a.book.id - b.book.id
    );

  if (scored.length === 0) return [];

  // Phase 1: take the top item.
  const picked: typeof scored = [];
  const usedCategories = new Set<BookCategory>();
  const usedIds = new Set<number>();

  picked.push(scored[0]);
  usedCategories.add(scored[0].book.category);
  usedIds.add(scored[0].book.id);

  // Phase 2: diversify — for the next picks, prefer unseen categories
  // until we have at least 2 categories represented.
  for (const candidate of scored) {
    if (picked.length >= limit) break;
    if (usedIds.has(candidate.book.id)) continue;
    if (usedCategories.size < 2 && usedCategories.has(candidate.book.category)) {
      continue; // skip; look for a different category first
    }
    picked.push(candidate);
    usedCategories.add(candidate.book.category);
    usedIds.add(candidate.book.id);
  }

  // Phase 3: if still short (couldn't diversify), fill by raw score.
  for (const candidate of scored) {
    if (picked.length >= limit) break;
    if (usedIds.has(candidate.book.id)) continue;
    picked.push(candidate);
    usedIds.add(candidate.book.id);
  }

  return picked.map((x) => ({
    book: x.book,
    score: x.breakdown.total,
    reasons: x.breakdown.reasons,
  }));
}

export const __test__ = { scoreBook, temperament };
