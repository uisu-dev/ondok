import Link from "next/link";
import { getSignedInUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** 우상단 미니 헤더: 로그인 / 마이페이지 진입점. */
export async function SiteHeader() {
  const user = await getSignedInUser();
  return (
    <div className="w-full bg-transparent print:hidden">
      <div className="mx-auto max-w-[720px] px-6 pt-4 flex justify-end">
        {user ? (
          <Link
            href="/mypage"
            className="text-xs font-semibold text-fg-muted hover:text-accent-600 inline-flex items-center gap-1.5"
          >
            <span className="w-6 h-6 rounded-full bg-accent-100 text-accent-700 text-[10px] font-bold flex items-center justify-center">
              {(user.profile?.display_name ?? "?").slice(0, 1)}
            </span>
            {user.profile?.display_name ?? "마이페이지"} 님
          </Link>
        ) : (
          <div className="flex items-center gap-3 text-xs font-semibold text-fg-muted">
            <Link href="/login" className="hover:text-accent-600">
              로그인
            </Link>
            <span className="text-border">|</span>
            <Link
              href="/signup"
              className="hover:text-accent-600 text-accent-600"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
