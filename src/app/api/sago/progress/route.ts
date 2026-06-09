import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

// GET — 현재 사용자의 아는 단어 키 목록 반환.
// 비로그인이면 빈 배열을 200으로 반환 (앱이 localStorage 만 사용하면 됨).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, keys: [], signedIn: false });

  const { data, error } = await supabase
    .from("sago_progress")
    .select("word_key")
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    keys: (data ?? []).map((r) => r.word_key as string),
    signedIn: true,
  });
}

// POST — { add: string[], remove: string[] } 차이를 적용.
// add 는 upsert, remove 는 delete. 인증 필수.
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

  let body: { add?: string[]; remove?: string[] };
  try {
    body = (await req.json()) as { add?: string[]; remove?: string[] };
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const add = Array.isArray(body.add) ? body.add.filter((s) => typeof s === "string") : [];
  const remove = Array.isArray(body.remove)
    ? body.remove.filter((s) => typeof s === "string")
    : [];
  if (add.length === 0 && remove.length === 0) {
    return NextResponse.json({ ok: true });
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

  if (add.length > 0) {
    const rows = add.map((word_key) => ({ user_id: user.id, word_key }));
    const { error } = await admin
      .from("sago_progress")
      .upsert(rows, { onConflict: "user_id,word_key" });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }
  if (remove.length > 0) {
    const { error } = await admin
      .from("sago_progress")
      .delete()
      .eq("user_id", user.id)
      .in("word_key", remove);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}

// DELETE — 전체 초기화. 인증 필수.
export async function DELETE() {
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
    .from("sago_progress")
    .delete()
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
