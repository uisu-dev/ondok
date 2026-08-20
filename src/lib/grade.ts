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

/** 추정 학령(1=초1 … 12=고3). 학생 범위 밖이면 null. */
export function estimateGradeNumber(
  birthYear: number | null | undefined,
  now = new Date()
): number | null {
  if (!birthYear) return null;
  const g = now.getFullYear() - birthYear - 6;
  if (g < 1 || g > 12) return null;
  return g;
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

// ── 학년·반 (직접 입력받는 값) ────────────────────────────────────────
// birth_year 로 추정하는 위 함수들과 달리, 아래는 학생이 직접 고른 값을 다룬다.
// 학년·반은 해마다 바뀌므로 '어느 학년도의 값인가'(grade_year)를 함께 본다.

/** 오늘이 속한 학년도. 3월 1일에 새 학년도가 시작된다. */
export function currentSchoolYear(now = new Date()): number {
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
}

/** 학교 종류별 학년 선택지. 특수학교는 과정이 다양해 6학년까지 연다. */
export function gradeOptions(schoolType: string | null | undefined): number[] {
  if (schoolType === "special") return [1, 2, 3, 4, 5, 6];
  return [1, 2, 3];
}

export const MAX_CLASS_NO = 30;
export const CLASS_OPTIONS: number[] = Array.from(
  { length: 20 },
  (_, i) => i + 1
);

export function isValidGrade(
  grade: number,
  schoolType?: string | null
): boolean {
  return Number.isInteger(grade) && gradeOptions(schoolType).includes(grade);
}

export function isValidClassNo(classNo: number): boolean {
  return Number.isInteger(classNo) && classNo >= 1 && classNo <= MAX_CLASS_NO;
}

/**
 * 학년·반을 (다시) 물어야 하는지.
 * 학생만 대상이며, 값이 없거나 지난 학년도의 값이면 true.
 * 교원 승인 심사 중인 사람은 곧 교사가 되므로 묻지 않는다.
 */
export function needsClassInfo(
  profile: {
    role: string;
    grade: number | null;
    class_no: number | null;
    grade_year: number | null;
    teacher_application_status?: string | null;
  } | null,
  now = new Date()
): boolean {
  if (!profile) return false;
  if (profile.role !== "student") return false;
  if (profile.teacher_application_status === "pending") return false;
  if (profile.grade == null || profile.class_no == null) return true;
  return profile.grade_year !== currentSchoolYear(now);
}

/** '2학년 3반' 같은 표시용 라벨. 값이 없으면 null. */
export function classLabel(
  grade: number | null | undefined,
  classNo: number | null | undefined
): string | null {
  if (grade == null || classNo == null) return null;
  return `${grade}학년 ${classNo}반`;
}
