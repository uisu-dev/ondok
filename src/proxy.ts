import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

// 비로그인 상태에서도 볼 수 있는 경로.
// /admin 은 자체 인증(HMAC 슈퍼관리자 또는 supabase 역할)이 있으므로 통과시킴.
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/admin",
  "/api/admin",
  "/api/sago", // 비로그인 시 빈 배열을 200 으로 반환
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  for (const p of PUBLIC_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }
  return false;
}

/**
 * Next.js 16 middleware ("proxy")
 * 1) 모든 요청에서 Supabase 세션을 자동 갱신
 * 2) 비로그인 + 비공개 경로 → /login?next=<path> 로 리다이렉트
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getSupabasePublicEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    signedIn = !!data.user;
  } catch {
    /* ignore — 세션 정보 못 가져오면 비로그인으로 간주 */
  }

  const path = request.nextUrl.pathname;
  if (!signedIn && !isPublicPath(path)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // 정적 자산·이미지·favicon 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
