export type BookCategory = "문학" | "과학" | "사회" | "인문";

export interface Book {
  id: number;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: BookCategory;
  ondokIndex: number;
  coverUrl: string;
  description: string;
  naverLink: string;
  isbn: string;
}

export type MBTIAxis = "EI" | "SN" | "TF" | "JP";
export type MBTILetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type MBTIType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export type Mood = "warm" | "exciting" | "calm" | "deep" | "adventurous";
export type Pace = "story" | "info" | "mixed";

export interface QuizAnswer {
  mbti: MBTIType;
  interests: BookCategory[];
  mood: Mood;
  pace: Pace;
}

export interface Recommendation {
  book: Book;
  score: number;
  reasons: string[];
}
