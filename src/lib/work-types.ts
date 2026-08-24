import type { QuestionOption, QuestionType } from "./worksheet-types";

/** 작품 뒤에 붙는 점검 문제 (활동지와 같은 문항 스키마). */
export interface WorkQuestion {
  position: number;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  sampleAnswer?: string;
  rubric?: string;
}

/**
 * 본문 속 형광펜 주석. 본문에 [[표시할 말|키]] 로 심고 키로 연결한다.
 *  - quiz : 짧은 확인 문제 (보기 중 하나 고르기)
 *  - info : 배경지식 설명
 */
export interface Annotation {
  type: "quiz" | "info";
  /** quiz */
  question?: string;
  options?: string[];
  answer?: number; // options 의 인덱스
  explain?: string;
  /** info */
  title?: string;
  body?: string;
}

export interface Work {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  category: string;
  era: string | null;
  /** 창작(정착) 추정 연도 — 시대순 정렬용 */
  eraOrder: number;
  summary: string | null;
  body: string;
  commentary: string | null;
  coverEmoji: string;
  questions: WorkQuestion[];
  annotations: Record<string, Annotation>;
  published: boolean;
  createdAt: string;
}

/** 목록용 — 본문 없이 가벼운 형태. */
export type WorkSummary = Omit<
  Work,
  "body" | "commentary" | "questions" | "annotations"
> & {
  questionCount: number;
  charCount: number;
  /** 본문에 심긴 형광펜 문제 수 (배지 조건 안내용) */
  quizCount: number;
};

/** 형광펜 문제 1개의 채점 결과. */
export interface NoteAnswer {
  picked: number;
  ok: boolean;
  /** 처음 고른 답이 정답이었는지 */
  first: boolean;
}

/** 학생 1명의 읽기 기록. */
export interface WorkRecord {
  lastSection: number;
  completedAt: string | null;
  answers: Record<string, string>;
  answeredCount: number;
  noteAnswers: Record<string, NoteAnswer>;
  badgeAt: string | null;
}

/**
 * 시대 구간. era_order(창작 추정 연도)로 나눈다.
 * 목록에서 이 단위로 묶어 보여 준다.
 */
export interface EraBand {
  key: string;
  label: string;
  note: string;
  until: number;
}

export const ERA_BANDS: EraBand[] = [
  { key: "early", label: "조선 전기", note: "15~16세기", until: 1600 },
  { key: "mid", label: "조선 중기", note: "17세기", until: 1700 },
  { key: "late", label: "조선 후기", note: "18세기", until: 1800 },
  { key: "last", label: "조선 말기", note: "19세기", until: 9999 },
];

export function eraBandOf(eraOrder: number): EraBand {
  return ERA_BANDS.find((b) => eraOrder < b.until) ?? ERA_BANDS[ERA_BANDS.length - 1];
}

/** 시대순으로 묶는다. 작품이 없는 구간은 빼고 돌려준다. */
export function groupByEra<T extends { eraOrder: number }>(
  works: T[]
): Array<{ band: EraBand; works: T[] }> {
  const sorted = [...works].sort((a, b) => a.eraOrder - b.eraOrder);
  const out: Array<{ band: EraBand; works: T[] }> = [];
  for (const w of sorted) {
    const band = eraBandOf(w.eraOrder);
    const last = out[out.length - 1];
    if (last && last.band.key === band.key) last.works.push(w);
    else out.push({ band, works: [w] });
  }
  return out;
}

/**
 * 배지 조건을 채웠는지.
 * 완독 + 형광펜 문제 전부 정답 + 점검 문제 전부 작성.
 *
 * 첫 시도(first)가 아니라 ok 를 본다. 한 번 틀리면 그 작품을 통째로 다시
 * 읽어야 배지를 받을 수 있게 했더니 학생들이 지쳐서 포기했다. 못 맞힌
 * 문제만 다시 풀어 채우는 편이 실제로 더 많이 읽게 만든다.
 * (first 는 그대로 기록해 두고 '한 번에 맞힌 수' 표시에만 쓴다)
 */
export function earnsBadge(opts: {
  completed: boolean;
  quizKeys: string[];
  noteAnswers: Record<string, NoteAnswer>;
  questionCount: number;
  answeredCount: number;
}): boolean {
  if (!opts.completed) return false;
  if (opts.answeredCount < opts.questionCount) return false;
  return opts.quizKeys.every((k) => opts.noteAnswers[k]?.ok === true);
}

/** 아직 맞히지 못한 형광펜 문제 키 — '남은 것' 안내에 쓴다. */
export function unsolvedQuizKeys(
  quizKeys: string[],
  noteAnswers: Record<string, NoteAnswer>
): string[] {
  return quizKeys.filter((k) => noteAnswers[k]?.ok !== true);
}

/** 맞힌 형광펜 문제 수 (재시도 포함). */
export function solvedCount(
  quizKeys: string[],
  noteAnswers: Record<string, NoteAnswer>
): number {
  return quizKeys.filter((k) => noteAnswers[k]?.ok === true).length;
}

/** 첫 시도에 맞힌 문제 수 — 배지 조건은 아니고 '얼마나 잘 읽었나' 표시용. */
export function firstTryCount(
  quizKeys: string[],
  noteAnswers: Record<string, NoteAnswer>
): number {
  return quizKeys.filter((k) => noteAnswers[k]?.first === true).length;
}

/** 본문에서 형광펜 문제(quiz)로 쓰인 주석 키만 추린다. */
export function quizKeysOf(annotations: Record<string, Annotation>): string[] {
  return Object.entries(annotations)
    .filter(([, a]) => a.type === "quiz")
    .map(([k]) => k);
}

export interface WorkSection {
  title: string;
  paragraphs: string[];
}

/**
 * 본문 마크다운을 대목 단위로 나눈다.
 * '## 소제목' 이 대목 경계이고, 빈 줄이 문단 경계.
 */
export function parseSections(body: string): WorkSection[] {
  const sections: WorkSection[] = [];
  let current: WorkSection | null = null;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.slice(3).trim(), paragraphs: [] };
      continue;
    }
    if (!current) current = { title: "", paragraphs: [] };
    if (!line) continue;
    current.paragraphs.push(line);
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.title || s.paragraphs.length > 0);
}

/** 대략적인 읽기 시간(분). 한국어 성인 기준 분당 약 500자로 잡되 학생 속도를 감안. */
export function readingMinutes(charCount: number): number {
  return Math.max(1, Math.round(charCount / 350));
}
