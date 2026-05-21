import type { MBTIAxis, MBTILetter, MBTIType } from "./types";

export type AxisAnswers = Record<MBTIAxis, MBTILetter[]>;

/**
 * Aggregate per-axis letter counts into a 4-letter MBTI code.
 * Ties favor the first option (E, S, T, J) as a deterministic default.
 */
export function computeMBTI(answers: AxisAnswers): MBTIType {
  const ei = pickLetter(answers.EI, "E", "I");
  const sn = pickLetter(answers.SN, "S", "N");
  const tf = pickLetter(answers.TF, "T", "F");
  const jp = pickLetter(answers.JP, "J", "P");
  return `${ei}${sn}${tf}${jp}` as MBTIType;
}

function pickLetter(
  letters: MBTILetter[] | undefined,
  first: MBTILetter,
  second: MBTILetter
): MBTILetter {
  if (!letters || letters.length === 0) return first;
  const firstCount = letters.filter((l) => l === first).length;
  const secondCount = letters.length - firstCount;
  return secondCount > firstCount ? second : first;
}

const TYPE_LABELS: Record<MBTIType, string> = {
  INTJ: "전략가",
  INTP: "탐구가",
  ENTJ: "지휘관",
  ENTP: "발명가",
  INFJ: "옹호자",
  INFP: "중재자",
  ENFJ: "선도자",
  ENFP: "활동가",
  ISTJ: "관리자",
  ISFJ: "수호자",
  ESTJ: "경영자",
  ESFJ: "집정관",
  ISTP: "장인",
  ISFP: "예술가",
  ESTP: "기업가",
  ESFP: "연예인",
};

export function labelForMBTI(type: MBTIType): string {
  return TYPE_LABELS[type] ?? type;
}
