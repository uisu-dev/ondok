import type { BookCategory, MBTIAxis, MBTILetter, Mood, Pace } from "./types";

export interface MBTIQuestion {
  id: string;
  axis: MBTIAxis;
  prompt: string;
  options: [
    { label: string; letter: MBTILetter },
    { label: string; letter: MBTILetter }
  ];
}

// 8문항 — 각 축 2문항씩 (학생 친화적 문구)
export const MBTI_QUESTIONS: MBTIQuestion[] = [
  {
    id: "ei-1",
    axis: "EI",
    prompt: "쉬는 시간이 생기면 보통 어떻게 보내?",
    options: [
      { label: "친구들과 떠들며 어울려요", letter: "E" },
      { label: "혼자 조용히 보내는 게 좋아요", letter: "I" },
    ],
  },
  {
    id: "ei-2",
    axis: "EI",
    prompt: "새로운 학기에 새 친구를 만나면?",
    options: [
      { label: "먼저 다가가서 말을 걸어요", letter: "E" },
      { label: "친해질 때까지 시간이 필요해요", letter: "I" },
    ],
  },
  {
    id: "sn-1",
    axis: "SN",
    prompt: "수업에서 더 흥미로운 건?",
    options: [
      { label: "지금 실제로 일어나는 일", letter: "S" },
      { label: "혹시 이런 일이 일어난다면?", letter: "N" },
    ],
  },
  {
    id: "sn-2",
    axis: "SN",
    prompt: "책을 고른다면 어떤 게 끌려?",
    options: [
      { label: "실제 인물이나 사건을 담은 책", letter: "S" },
      { label: "상상과 가능성이 가득한 책", letter: "N" },
    ],
  },
  {
    id: "tf-1",
    axis: "TF",
    prompt: "친구가 고민을 털어놨을 때 먼저 드는 생각은?",
    options: [
      { label: "왜 그렇게 됐는지 원인을 찾고 싶어요", letter: "T" },
      { label: "친구가 얼마나 속상할지 마음이 쓰여요", letter: "F" },
    ],
  },
  {
    id: "tf-2",
    axis: "TF",
    prompt: "결정할 때 더 신뢰하는 건?",
    options: [
      { label: "사실과 논리로 따져 본 결과", letter: "T" },
      { label: "마음이 향하는 방향", letter: "F" },
    ],
  },
  {
    id: "jp-1",
    axis: "JP",
    prompt: "방학 계획표를 만든다면?",
    options: [
      { label: "요일별로 차근차근 계획해요", letter: "J" },
      { label: "그날그날 마음 가는 대로 보내요", letter: "P" },
    ],
  },
  {
    id: "jp-2",
    axis: "JP",
    prompt: "약속 시간이 다가오면?",
    options: [
      { label: "여유 있게 미리 준비해요", letter: "J" },
      { label: "임박해서 후다닥 준비해요", letter: "P" },
    ],
  },
];

export const ALL_CATEGORIES: BookCategory[] = ["문학", "과학", "사회", "인문"];

export interface MoodOption {
  value: Mood;
  label: string;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: "warm", label: "따뜻한", description: "마음이 포근해지는 이야기" },
  { value: "exciting", label: "신나는", description: "재미있고 흥미진진한 이야기" },
  { value: "calm", label: "잔잔한", description: "조용하고 평온한 이야기" },
  { value: "deep", label: "깊이 있는", description: "곱씹게 되는 진지한 이야기" },
  { value: "adventurous", label: "모험적인", description: "모험과 도전이 가득한 이야기" },
];

export interface PaceOption {
  value: Pace;
  label: string;
  description: string;
}

export const PACE_OPTIONS: PaceOption[] = [
  { value: "story", label: "이야기 위주", description: "소설·그림책처럼 이야기에 푹 빠지고 싶어요" },
  { value: "info", label: "정보·지식 위주", description: "새로운 지식과 정보를 알아가는 게 좋아요" },
  { value: "mixed", label: "둘 다 좋아요", description: "이야기와 정보, 균형 있게 즐겨요" },
];
