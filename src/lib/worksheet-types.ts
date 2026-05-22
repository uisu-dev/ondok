export type WorksheetType = "books" | "exam" | "written";
export type QuestionType = "multiple_choice" | "short_answer" | "essay";

export interface QuestionOption {
  label: string; // 예: "①", "②", "③", "④"
  text: string;
  correct: boolean;
}

export interface Question {
  id?: number;
  position: number;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  sampleAnswer?: string;
  rubric?: string;
}

export interface Worksheet {
  id: number;
  type: WorksheetType;
  title: string;
  intro?: string | null;
  bookId?: number | null;
  source?: string | null;
  externalUrl?: string | null;
  passage?: string | null;
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
  externalUrl?: string;
  passage?: string;
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
};
