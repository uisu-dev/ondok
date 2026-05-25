import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Logout should be idempotent even if auth env is missing locally.
  }

  return NextResponse.json({ ok: true });
}
