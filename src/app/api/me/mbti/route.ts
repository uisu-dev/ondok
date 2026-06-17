import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

const MBTI_RE = /^[EI][SN][TF][JP]$/;

// 로그인 학생이 MBTI 진단을 마치면 결과를 profiles.mbti 에 저장.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, signedIn: false });

  let body: { mbti?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const mbti = String(body.mbti ?? "").toUpperCase();
  if (!MBTI_RE.test(mbti)) {
    return NextResponse.json({ ok: false, error: "MBTI 형식 오류" }, { status: 400 });
  }

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }
  const { error } = await admin
    .from("profiles")
    .update({ mbti, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, signedIn: true });
}
