// 책 외부 링크 생성.
//
// 기존 books-seed.json 의 naverLink 는 네이버 쇼핑 카탈로그(search.shopping.naver.com)라
// 봇 차단·로그인 요구가 잦고 학생용 사이트에 부적절했다.
// 대신 제목+저자로 네이버 통합검색(도서) 결과로 보낸다 — 차단 없이 안정적이고
// 책 정보·도서관 소장 정보까지 노출된다.

export function bookSearchUrl(book: { title: string; author?: string }): string {
  const q = [book.title, book.author].filter(Boolean).join(" ").trim();
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(`${q} 책`)}`;
}
