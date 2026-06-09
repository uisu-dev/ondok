export type WorksheetType = "books" | "exam" | "written";
export type QuestionType =
  | "multiple_choice"
  | "short_answer"
  | "essay"
  | "true_false";

export interface QuestionOption {
  label: string; // 예: "①", "②", "③", "④", "O", "X"
  text: string;
  correct: boolean;
}

export interface Question {
  id?: number;
  position: number;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[]; // multiple_choice + true_false 둘 다 사용
  sampleAnswer?: string;
  rubric?: string;
  imageUrl?: string;
  passage?: string | null; // 문항별 지문(원문 인용, 선택) — 주로 추천도서 활동지에 사용
}

export interface Worksheet {
  id: number;
  type: WorksheetType;
  title: string;
  intro?: string | null;
  bookId?: number | null;
  source?: string | null;
  externalUrl?: string | null; // deprecated — UI에서 더 이상 노출 안 함, 기존 데이터 보존용
  passage?: string | null;
  passageImageUrl?: string | null;
  youtubeUrl?: string | null;
  sampleAnswer?: string | null; // 활동지 전체 모범 답안 (학생은 모두 풀어야 공개)
  difficultyOverride?: string | null; // '초등 하'/'중등 중' 등. NULL 이면 자동 산출
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorksheetWithQuestions extends Worksheet {
  questions: Question[];
}

export interface WorksheetDraft {
  type: WorksheetType;
  title: string;
  intro?: string;
  bookId?: number | null;
  source?: string;
  externalUrl?: string; // kept for backward compat; UI no longer surfaces
  passage?: string;
  passageImageUrl?: string;
  youtubeUrl?: string;
  sampleAnswer?: string;
  difficultyOverride?: string | null;
  questions: Omit<Question, "id">[];
}

export const TYPE_LABEL: Record<WorksheetType, string> = {
  books: "온독 추천도서 활동지",
  exam: "수능·모의고사 비문학 활동지",
  written: "사고도구어 활용 자체 지문 활동지",
};

export const TYPE_EMOJI: Record<WorksheetType, string> = {
  books: "📚",
  exam: "🎯",
  written: "✍️",
};

export const QTYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: "객관식",
  short_answer: "단답형",
  essay: "서술형",
  true_false: "OX 퀴즈",
};
