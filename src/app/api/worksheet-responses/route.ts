import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/worksheet-responses?worksheet_id=N
// 현재 사용자가 해당 활동지에 저장해 둔 답안 반환.
// 비로그인 → { ok: true, signedIn: false, answers: {} }
export async function GET(req: NextRequest) {
  const wsId = Number(req.nextUrl.searchParams.get("worksheet_id"));
  if (!Number.isFinite(wsId)) {
    return NextResponse.json({ ok: false, error: "worksheet_id 오류" }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: true, signedIn: false, answers: {} });
  }
  const { data, error } = await supabase
    .from("worksheet_responses")
    .select("answers")
    .eq("user_id", user.id)
    .eq("worksheet_id", wsId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    signedIn: true,
    answers: (data?.answers as Record<string, string>) ?? {},
  });
}

// POST /api/worksheet-responses  body: { worksheet_id, answers: { [pos]: text } }
// 답안 전체를 덮어쓰기(upsert). 빈 답안은 제외하고 저장.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }
  let body: { worksheet_id?: number; answers?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const wsId = Number(body.worksheet_id);
  if (!Number.isFinite(wsId)) {
    return NextResponse.json({ ok: false, error: "worksheet_id 오류" }, { status: 400 });
  }

  // 빈 문자열·공백만 있는 답안 제거
  const raw = body.answers ?? {};
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v.trim().length > 0) {
      cleaned[k] = v;
    }
  }
  const answeredCount = Object.keys(cleaned).length;

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }

  // 모두 비웠으면 행 삭제 (목록에서 사라지게)
  if (answeredCount === 0) {
    const { error } = await admin
      .from("worksheet_responses")
      .delete()
      .eq("user_id", user.id)
      .eq("worksheet_id", wsId);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, answeredCount: 0 });
  }

  const { error } = await admin.from("worksheet_responses").upsert(
    {
      user_id: user.id,
      worksheet_id: wsId,
      answers: cleaned,
      answered_count: answeredCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,worksheet_id" }
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, answeredCount });
}
