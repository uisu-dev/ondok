import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

const VALID_KINDS = new Set(["book", "worksheet"]);

// GET /api/favorites?kind=book|worksheet
// 비로그인 → { ok: true, signedIn: false, ids: [] }
export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") ?? "";
  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json(
      { ok: false, error: "kind 값이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: true, signedIn: false, ids: [] });
  }
  const { data, error } = await supabase
    .from("favorites")
    .select("target_id")
    .eq("user_id", user.id)
    .eq("kind", kind);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    signedIn: true,
    ids: (data ?? []).map((r) => r.target_id as string),
  });
}

// POST /api/favorites  body: { kind, target_id }
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
  let body: { kind?: string; target_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const kind = body.kind ?? "";
  const targetId = String(body.target_id ?? "").trim();
  if (!VALID_KINDS.has(kind) || !targetId) {
    return NextResponse.json({ ok: false, error: "필수값 누락" }, { status: 400 });
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
    .from("favorites")
    .upsert(
      { user_id: user.id, kind, target_id: targetId },
      { onConflict: "user_id,kind,target_id" }
    );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/favorites  body: { kind, target_id }
export async function DELETE(req: NextRequest) {
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
  let body: { kind?: string; target_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const kind = body.kind ?? "";
  const targetId = String(body.target_id ?? "").trim();
  if (!VALID_KINDS.has(kind) || !targetId) {
    return NextResponse.json({ ok: false, error: "필수값 누락" }, { status: 400 });
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
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("kind", kind)
    .eq("target_id", targetId);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
