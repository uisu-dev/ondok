import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "온독 플러스 — 충남교육청 온독지수 추천도서",
  description:
    "MBTI와 취향에 맞춰 충남교육청 온독지수 추천도서 214권 중 나에게 어울리는 책을 찾아드려요.",
  openGraph: {
    title: "온독 플러스",
    description: "MBTI와 취향으로 받는 맞춤 추천도서",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
