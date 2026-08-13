import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * POST — 작품 하나의 읽기 기록을 지운다.
 * body: { work_id }
 *
 * 배지는 형광펜 문제를 '첫 시도에' 맞혀야 나온다. 한 번 틀리면 그 작품은
 * 영영 배지를 받을 수 없으므로, 처음부터 다시 도전할 길을 열어 둔다.
 *
 * 이미 받은 배지는 지우지 않는다 — 받은 것을 되돌릴 이유가 없다.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "로그인이 필요합니다" }, { status: 401 });
  }

  let body: { work_id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const workId = Number(body.work_id);
  if (!Number.isFinite(workId)) {
    return NextResponse.json({ ok: false, error: "work_id 오류" }, { status: 400 });
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

  const { data: prev } = await admin
    .from("work_records")
    .select("badge_at")
    .eq("user_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();

  const badgeAt = (prev?.badge_at as string) ?? null;

  // 배지를 이미 받았다면 그것만 남기고 진행 기록을 비운다
  const { error } = await admin.from("work_records").upsert(
    {
      user_id: user.id,
      work_id: workId,
      last_section: 0,
      completed_at: null,
      answers: {},
      answered_count: 0,
      note_answers: {},
      note_correct: 0,
      badge_at: badgeAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,work_id" }
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, badgeAt });
}
