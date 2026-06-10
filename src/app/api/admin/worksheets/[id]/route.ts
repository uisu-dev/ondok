import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin, hasFullWorksheetAccess } from "@/lib/auth";
import {
  deleteWorksheetAdmin,
  getWorksheetOwner,
  setWorksheetPublished,
  updateWorksheetAdmin,
} from "@/data/worksheets";
import type { WorksheetDraft } from "@/lib/worksheet-types";

/**
 * 활동지 ID 에 대한 권한 검사 공통 함수.
 * - HMAC 슈퍼관리자: 모든 활동지에 대해 통과
 * - 교원/관리자 사용자: 자신이 만든(created_by = user.id) 활동지에만 통과
 */
async function gateWorksheet(id: number): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const access = await canAccessAdmin();
  if (!access.ok) return { ok: false, status: 401, error: "권한 없음" };
  if (hasFullWorksheetAccess(access.reason)) return { ok: true };
  const owner = await getWorksheetOwner(id);
  if (owner === undefined) return { ok: false, status: 404, error: "활동지를 찾을 수 없어요." };
  if (owner === access.user?.id) return { ok: true };
  return { ok: false, status: 403, error: "자신이 만든 활동지만 관리할 수 있어요." };
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ ok: false, error: "잘못된 ID" }, { status: 400 });
  }
  const g = await gateWorksheet(num);
  if (!g.ok) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
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
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ ok: false, error: "잘못된 ID" }, { status: 400 });
  }
  const g = await gateWorksheet(num);
  if (!g.ok) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
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
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    return NextResponse.json({ ok: false, error: "잘못된 ID" }, { status: 400 });
  }
  const g = await gateWorksheet(num);
  if (!g.ok) return NextResponse.json({ ok: false, error: g.error }, { status: g.status });
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
