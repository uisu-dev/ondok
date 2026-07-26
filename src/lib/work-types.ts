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

export interface Work {
  id: number;
  slug: string;
  title: string;
  author: string | null;
  category: string;
  era: string | null;
  summary: string | null;
  body: string;
  commentary: string | null;
  coverEmoji: string;
  questions: WorkQuestion[];
  published: boolean;
  createdAt: string;
}

/** 목록용 — 본문 없이 가벼운 형태. */
export type WorkSummary = Omit<Work, "body" | "commentary" | "questions"> & {
  questionCount: number;
  charCount: number;
};

/** 학생 1명의 읽기 기록. */
export interface WorkRecord {
  lastSection: number;
  completedAt: string | null;
  answers: Record<string, string>;
  answeredCount: number;
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
