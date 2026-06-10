import Link from "next/link";
import { getSignedInUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * 모든 페이지 상단에 고정으로 표시되는 미니 헤더.
 * 왼쪽: 온독 플러스 로고 → 홈으로 가는 링크
 * 오른쪽: 로그인 여부에 따라 [로그인/회원가입] 또는 [이름 + 마이페이지 배지]
 */
export async function SiteHeader() {
  const user = await getSignedInUser();
  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur border-b border-border print:hidden">
      <div className="mx-auto max-w-[960px] px-4 sm:px-6 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-bold text-fg-strong hover:text-accent-600 transition-colors"
        >
          <span aria-hidden className="text-base">📘</span>
          <span>온독 플러스</span>
          <span className="hidden sm:inline text-xs font-semibold text-fg-muted ml-1">
            메인 화면
          </span>
        </Link>

        {user ? (
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 group"
            aria-label="마이페이지로 이동"
          >
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 text-[10px] font-bold flex items-center justify-center">
              {(user.profile?.display_name ?? "?").slice(0, 1)}
            </span>
            <span className="text-xs font-semibold text-fg-strong">
              {user.profile?.display_name ?? "내 정보"} 님
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-chip bg-accent-600 text-white text-[10px] font-bold group-hover:bg-accent-700 transition-colors">
              <span aria-hidden>👤</span>
              마이페이지
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/login"
              className="px-2.5 py-1 rounded-button text-fg-muted hover:text-fg-strong"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1 rounded-button bg-accent-600 hover:bg-accent-700 text-white"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
