/** 공유 캐시·브라우저 캐시에 학생 현황 응답이 남지 않게 한다. */
export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};
