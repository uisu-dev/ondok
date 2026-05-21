import type { BookCategory } from "./types";

/**
 * Career/major tracks — each one maps to:
 *  - preferred book categories (boost via category match)
 *  - keyword set searched in 책소개
 */
export interface CareerTrack {
  key: string;
  label: string;
  emoji: string;
  description: string;
  preferredCategories: BookCategory[];
  keywords: string[];
}

export const CAREER_TRACKS: CareerTrack[] = [
  {
    key: "science-research",
    label: "과학·연구",
    emoji: "🔬",
    description: "과학자·연구자 — 자연의 원리를 파헤치고 싶어요",
    preferredCategories: ["과학"],
    keywords: ["과학", "연구", "실험", "발견", "법칙", "물리", "화학", "생물", "수학"],
  },
  {
    key: "medical-health",
    label: "의료·보건",
    emoji: "🩺",
    description: "의사·간호사·약사·보건 — 사람을 살리고 돌봐요",
    preferredCategories: ["과학", "사회"],
    keywords: ["의학", "약", "생명", "건강", "병", "의사", "치료", "몸", "면역"],
  },
  {
    key: "engineering-tech",
    label: "공학·기술·개발",
    emoji: "⚙️",
    description: "엔지니어·개발자 — 무언가 만들고 고치는 게 좋아요",
    preferredCategories: ["과학"],
    keywords: ["기술", "공학", "발명", "엔지니어", "컴퓨터", "프로그래밍", "기계", "AI"],
  },
  {
    key: "literature-arts",
    label: "글·언어·예술",
    emoji: "✍️",
    description: "작가·시인·예술가 — 표현하는 즐거움이 좋아요",
    preferredCategories: ["문학", "인문"],
    keywords: ["글", "이야기", "예술", "그림", "음악", "시", "소설", "표현", "언어"],
  },
  {
    key: "education-counseling",
    label: "교육·상담·심리",
    emoji: "🧑‍🏫",
    description: "교사·상담사·심리학자 — 사람의 마음과 성장을 도와요",
    preferredCategories: ["인문", "사회"],
    keywords: ["교육", "선생님", "상담", "심리", "마음", "성장", "배움", "어린이"],
  },
  {
    key: "law-politics",
    label: "법·정치·행정",
    emoji: "⚖️",
    description: "법조인·공무원·정치가 — 사회 규칙과 정의에 관심 있어요",
    preferredCategories: ["사회", "인문"],
    keywords: ["법", "정치", "정의", "행정", "정책", "헌법", "권리", "민주주의"],
  },
  {
    key: "business-economy",
    label: "경영·경제·창업",
    emoji: "📊",
    description: "경영자·창업가 — 새로운 가치를 만들고 싶어요",
    preferredCategories: ["사회"],
    keywords: ["경영", "경제", "기업", "돈", "시장", "사업", "마케팅", "금융"],
  },
  {
    key: "environment-agriculture",
    label: "환경·농업·해양",
    emoji: "🌱",
    description: "환경 전문가·농업·해양 — 자연과 함께 일하고 싶어요",
    preferredCategories: ["과학", "사회"],
    keywords: ["환경", "농업", "바다", "지구", "자연", "생태", "기후"],
  },
  {
    key: "social-welfare",
    label: "사회복지·시민활동",
    emoji: "🤝",
    description: "사회복지사·NGO — 이웃과 공동체를 돕고 싶어요",
    preferredCategories: ["사회", "인문"],
    keywords: ["복지", "사회", "이웃", "공동체", "도움", "봉사", "약자"],
  },
  {
    key: "sports-physical",
    label: "체육·운동",
    emoji: "⚽",
    description: "운동선수·체육 전문가 — 몸을 움직이며 도전해요",
    preferredCategories: ["사회", "과학"],
    keywords: ["운동", "체육", "스포츠", "선수", "건강", "몸", "도전"],
  },
];

export function careerByKey(key: string): CareerTrack | undefined {
  return CAREER_TRACKS.find((c) => c.key === key);
}
