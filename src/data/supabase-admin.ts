import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 * This client BYPASSES Row Level Security and must NEVER be exposed to the browser.
 * Only import in:
 *  - Server Components (page.tsx without "use client")
 *  - Route handlers (route.ts)
 *  - Server actions ("use server")
 */
export function getAdminSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  if (!key || key === "__FILL_IN_FROM_SUPABASE_DASHBOARD__") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
        "Supabase Dashboard → Project Settings → API → service_role secret 을 복사해 .env.local 에 추가하세요."
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
