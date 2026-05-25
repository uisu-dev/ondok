import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/config";

let cached: SupabaseClient | null | undefined = undefined;

/**
 * Returns a Supabase client if env vars are set, else null.
 * Callers must handle null to support local dev without Supabase.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const env = getSupabasePublicEnv();
  if (!env) {
    cached = null;
    return null;
  }
  cached = createClient(env.url, env.key, {
    auth: { persistSession: false },
  });
  return cached;
}
