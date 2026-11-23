/**
 * 학생 현황을 다시 받을 때 쓰는 GET.
 * 브라우저 HTTP 캐시와 중간 캐시를 타지 않는다. 자동 폴링은 하지 않는다.
 */
export function freshGet(path: string): Promise<Response> {
  const join = path.includes("?") ? "&" : "?";
  return fetch(`${path}${join}_=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
}
