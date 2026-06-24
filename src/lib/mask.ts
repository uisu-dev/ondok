// 이름 마스킹 (게임 랭킹 등 공개 화면용 개인정보 보호).
//   2글자: 김민   → 김*
//   3글자: 김민수 → 김*수
//   4글자: 남궁민수 → 남궁**
//   5글자+: 3번째부터 끝까지 별표
export function maskName(name: string | null | undefined): string {
  if (!name) return "익명";
  const ch = [...name.trim()];
  const len = ch.length;
  if (len <= 1) return name;
  if (len <= 3) {
    ch[1] = "*"; // 2~3글자: 두 번째 글자
  } else {
    for (let i = 2; i < len; i++) ch[i] = "*"; // 4글자 이상: 3번째~끝
  }
  return ch.join("");
}
