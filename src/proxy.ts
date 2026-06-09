import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

/**
 * Next.js 16 middleware ("proxy") — 모든 요청에서 Supabase 세션을 자동 갱신.
 * 강제 리디렉트는 하지 않음 (보호된 페이지는 페이지 단위로 isAdmin / role 검사).
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

  // 세션 갱신만 (실패해도 무시)
  try {
    await supabase.auth.getUser();
  } catch {
    /* ignore */
  }
  return response;
}

export const config = {
  matcher: [
    // 정적 자산·이미지·favicon 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
