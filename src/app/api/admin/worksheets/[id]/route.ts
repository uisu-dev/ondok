import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/auth";
import {
  deleteWorksheetAdmin,
  setWorksheetPublished,
  updateWorksheetAdmin,
} from "@/data/worksheets";
import type { WorksheetDraft } from "@/lib/worksheet-types";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await canAccessAdmin()).ok) {
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
  if (!(await canAccessAdmin()).ok) {
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await canAccessAdmin()).ok) {
    return NextResponse.json({ ok: false, error: "권한 없음" }, { status: 401 });
  }
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ ok: false, error: "잘못된 ID" }, { status: 400 });
  }
  let body: WorksheetDraft;
  try {
    body = (await req.json()) as WorksheetDraft;
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  if (!body.title || !Array.isArray(body.questions)) {
    return NextResponse.json(
      { ok: false, error: "필수 입력값이 비어 있어요." },
      { status: 400 }
    );
  }
  try {
    await updateWorksheetAdmin(num, body);
    return NextResponse.json({ ok: true, id: num });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "수정 중 오류가 발생했어요.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
