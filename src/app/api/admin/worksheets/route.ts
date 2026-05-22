import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createWorksheetAdmin } from "@/data/worksheets";
import type { WorksheetDraft } from "@/lib/worksheet-types";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { ok: false, error: "관리자 권한이 필요합니다." },
      { status: 401 }
    );
  }
  let body: WorksheetDraft;
  try {
    body = (await req.json()) as WorksheetDraft;
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }
  if (!body.type || !body.title || !Array.isArray(body.questions)) {
    return NextResponse.json(
      { ok: false, error: "필수 입력값이 비어 있어요." },
      { status: 400 }
    );
  }
  try {
    const id = await createWorksheetAdmin(body);
    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했어요.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
