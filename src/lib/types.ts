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

/* ----------------------------------------------------------
 * QuizAnswer — discriminated union across the 3 entry paths.
 * Stored in sessionStorage as JSON and consumed by /result.
 * ---------------------------------------------------------- */
export type QuizMode = "mbti" | "interest" | "career";

export interface MBTIAnswer {
  mode: "mbti";
  mbti: MBTIType;
  interests: BookCategory[];
  mood: Mood;
  pace: Pace;
}

export interface InterestAnswer {
  mode: "interest";
  topics: string[]; // InterestTopic.key values
}

export interface CareerAnswer {
  mode: "career";
  career: string; // CareerTrack.key value
}

export type QuizAnswer = MBTIAnswer | InterestAnswer | CareerAnswer;

export interface Recommendation {
  book: Book;
  score: number;
  reasons: string[];
}
