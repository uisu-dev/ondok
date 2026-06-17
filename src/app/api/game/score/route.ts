import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

// POST — 게임 종료 시 점수 저장 + 내 최고점 반환.
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
  let body: { score?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const score = Math.floor(Number(body.score));
  if (!Number.isFinite(score) || score < 0 || score > 100000) {
    return NextResponse.json({ ok: false, error: "점수 오류" }, { status: 400 });
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
    .from("game_scores")
    .insert({ user_id: user.id, score });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // 내 최고점
  const { data: best } = await admin
    .from("game_scores")
    .select("score")
    .eq("user_id", user.id)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, bestScore: best?.score ?? score });
}
