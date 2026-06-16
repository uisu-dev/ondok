// 출생연도 → 대략 학년 추정.
// 한국 학제 기준: 학령 = (올해 - 출생연도) - 6
//   예) 2011년생, 2026년 → 15 - 6 = 9 = 중3
// 추천 로직에는 쓰지 않고 관리·표시 용도.

export const MIN_BIRTH_YEAR = 1940;
export function maxBirthYear(now = new Date()): number {
  return now.getFullYear() - 4; // 만 4세 이상만
}

export function isValidBirthYear(year: number, now = new Date()): boolean {
  return (
    Number.isInteger(year) &&
    year >= MIN_BIRTH_YEAR &&
    year <= maxBirthYear(now)
  );
}

/** 추정 학년 라벨. 학생 범위를 벗어나면 미취학/졸업(성인) 처리. */
export function estimateGradeLabel(
  birthYear: number | null | undefined,
  now = new Date()
): string | null {
  if (!birthYear) return null;
  const g = now.getFullYear() - birthYear - 6;
  if (g < 1) return "미취학";
  if (g <= 6) return `초등 ${g}학년`;
  if (g <= 9) return `중등 ${g - 6}학년`;
  if (g <= 12) return `고등 ${g - 9}학년`;
  return "졸업 / 성인";
}
