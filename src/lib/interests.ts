/**
 * Interest topics — keyword-based recommendation seeds.
 * Each topic maps to a small set of words searched in the 책소개 text.
 */
export interface InterestTopic {
  key: string;
  label: string;
  emoji: string;
  keywords: string[];
}

export const INTEREST_TOPICS: InterestTopic[] = [
  {
    key: "space-nature",
    label: "우주·자연",
    emoji: "🌌",
    keywords: ["우주", "별", "행성", "자연", "생태", "지구", "은하"],
  },
  {
    key: "ai-tech",
    label: "인공지능·기술",
    emoji: "🤖",
    keywords: ["인공지능", "AI", "기술", "로봇", "컴퓨터", "프로그래밍", "디지털", "코딩"],
  },
  {
    key: "history-culture",
    label: "역사·문화",
    emoji: "🏛️",
    keywords: ["역사", "조선", "고려", "삼국", "문화", "전통", "유산"],
  },
  {
    key: "environment-climate",
    label: "환경·기후",
    emoji: "🌍",
    keywords: ["환경", "기후", "생태계", "오염", "탄소", "재활용", "지구온난화"],
  },
  {
    key: "mind-relations",
    label: "마음·관계",
    emoji: "💝",
    keywords: ["마음", "친구", "가족", "사랑", "감정", "심리", "공감"],
  },
  {
    key: "adventure",
    label: "모험·도전",
    emoji: "🗺️",
    keywords: ["모험", "탐험", "도전", "여행", "용기", "비밀", "발견"],
  },
  {
    key: "art-creation",
    label: "예술·창작",
    emoji: "🎨",
    keywords: ["예술", "그림", "음악", "디자인", "만들기", "창작", "미술"],
  },
  {
    key: "society-rights",
    label: "사회·인권",
    emoji: "⚖️",
    keywords: ["사회", "인권", "평등", "차별", "정의", "민주주의", "권리"],
  },
  {
    key: "philosophy-thinking",
    label: "철학·생각",
    emoji: "💭",
    keywords: ["철학", "생각", "물음", "사유", "의미", "삶", "성찰"],
  },
  {
    key: "animals-life",
    label: "동물·생명",
    emoji: "🐾",
    keywords: ["동물", "생명", "강아지", "고양이", "곤충", "식물", "멸종"],
  },
];

export function topicByKey(key: string): InterestTopic | undefined {
  return INTEREST_TOPICS.find((t) => t.key === key);
}
