import type {
  Book,
  BookCategory,
  CareerAnswer,
  InterestAnswer,
  MBTIAnswer,
  MBTIType,
  Mood,
  QuizAnswer,
  Recommendation,
} from "./types";
import { topicByKey } from "./interests";
import { careerByKey } from "./careers";

type Temperament = "NF" | "NT" | "SJ" | "SP";

const CATEGORY_WEIGHTS: Record<Temperament, Record<BookCategory, number>> = {
  // Idealists: meaning + people → literature + humanities
  NF: { 문학: 3, 인문: 2, 사회: 1, 과학: 1 },
  // Analysts: systems + theory → science + humanities
  NT: { 과학: 3, 인문: 2, 사회: 1, 문학: 1 },
  // Sentinels: rules + community → social + humanities
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

interface ScoredEntry {
  book: Book;
  score: number;
  reasons: string[];
}

function scoreMBTI(book: Book, a: MBTIAnswer): ScoredEntry {
  const reasons: string[] = [];
  const weights = CATEGORY_WEIGHTS[temperament(a.mbti)];

  let score = weights[book.category] ?? 0;
  if (score >= 2) reasons.push(`${a.mbti} 유형이 끌릴 만한 ${book.category}`);

  if (a.interests.includes(book.category)) {
    score += 5;
    reasons.push(`관심 분야 ‘${book.category}’`);
  }

  const moodKws = MOOD_KEYWORDS[a.mood];
  let moodMatches = 0;
  for (const kw of moodKws) if (book.description.includes(kw)) moodMatches++;
  if (moodMatches > 0) {
    score += Math.min(moodMatches * 1.5, 6);
    reasons.push(`‘${MOOD_LABEL[a.mood]}’ 분위기`);
  }

  if (a.pace === "story" && book.category === "문학") {
    score += 2;
    reasons.push("이야기 호흡");
  } else if (a.pace === "info" && (book.category === "과학" || book.category === "사회")) {
    score += 2;
    reasons.push("정보·지식 호흡");
  }

  return { book, score, reasons };
}

function scoreInterest(book: Book, a: InterestAnswer): ScoredEntry {
  const reasons: string[] = [];
  let score = 0;
  const matchedLabels: string[] = [];

  for (const topicKey of a.topics) {
    const topic = topicByKey(topicKey);
    if (!topic) continue;
    let matches = 0;
    for (const kw of topic.keywords) {
      if (book.description.includes(kw)) matches++;
    }
    if (matches > 0) {
      score += Math.min(matches * 1.5, 6);
      matchedLabels.push(topic.label);
    }
  }

  if (matchedLabels.length > 0) {
    reasons.push(`관심 주제 ‘${matchedLabels.join(", ")}’`);
  }

  return { book, score, reasons };
}

function scoreCareer(book: Book, a: CareerAnswer): ScoredEntry {
  const career = careerByKey(a.career);
  if (!career) return { book, score: 0, reasons: [] };

  const reasons: string[] = [];
  let score = 0;

  if (career.preferredCategories.includes(book.category)) {
    score += 5;
    reasons.push(`‘${career.label}’과 어울리는 ${book.category}`);
  }

  let matches = 0;
  for (const kw of career.keywords) {
    if (book.description.includes(kw)) matches++;
  }
  if (matches > 0) {
    score += Math.min(matches * 1.5, 6);
    reasons.push(`‘${career.label}’ 관련 키워드`);
  }

  return { book, score, reasons };
}

function dispatchScore(book: Book, answer: QuizAnswer): ScoredEntry {
  if (answer.mode === "mbti") return scoreMBTI(book, answer);
  if (answer.mode === "interest") return scoreInterest(book, answer);
  return scoreCareer(book, answer);
}

/**
 * Score every book and return top picks with category diversity.
 * Deterministic: same answers → same recommendations.
 */
export function recommend(
  books: Book[],
  answer: QuizAnswer,
  limit = 4
): Recommendation[] {
  const scored = books
    .map((book) => dispatchScore(book, answer))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.book.id - b.book.id);

  if (scored.length === 0) return [];

  const picked: ScoredEntry[] = [];
  const usedCategories = new Set<BookCategory>();
  const usedIds = new Set<number>();

  // Always take the top item.
  picked.push(scored[0]);
  usedCategories.add(scored[0].book.category);
  usedIds.add(scored[0].book.id);

  // Prefer category diversity until 2 categories represented.
  for (const c of scored) {
    if (picked.length >= limit) break;
    if (usedIds.has(c.book.id)) continue;
    if (usedCategories.size < 2 && usedCategories.has(c.book.category)) continue;
    picked.push(c);
    usedCategories.add(c.book.category);
    usedIds.add(c.book.id);
  }

  // Fill remaining by raw score if diversity wasn't possible.
  for (const c of scored) {
    if (picked.length >= limit) break;
    if (usedIds.has(c.book.id)) continue;
    picked.push(c);
    usedIds.add(c.book.id);
  }

  return picked;
}

export const __test__ = { scoreMBTI, scoreInterest, scoreCareer, temperament };
