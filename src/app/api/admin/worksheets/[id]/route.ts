import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteWorksheetAdmin, setWorksheetPublished } from "@/data/worksheets";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 401 });
  }
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ ok: false, error: "잘못된 ID" }, { status: 400 });
  }
  try {
    await deleteWorksheetAdmin(num);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "삭제 실패";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 401 });
  }
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ ok: false, error: "잘못된 ID" }, { status: 400 });
  }
  let body: { published?: boolean };
  try {
    body = (await req.json()) as { published?: boolean };
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  if (typeof body.published !== "boolean") {
    return NextResponse.json({ ok: false, error: "published 누락" }, { status: 400 });
  }
  try {
    await setWorksheetPublished(num, body.published);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "갱신 실패";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
