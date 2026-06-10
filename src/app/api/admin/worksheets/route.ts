import { NextRequest, NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/auth";
import { createWorksheetAdmin } from "@/data/worksheets";
import type { WorksheetDraft } from "@/lib/worksheet-types";

export async function POST(req: NextRequest) {
  const access = await canAccessAdmin();
  if (!access.ok) {
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
    // HMAC 슈퍼관리자가 만들면 createdBy = null, 교원/관리자 사용자면 본인 id
    const createdBy = access.reason === "hmac" ? null : access.user?.id ?? null;
    const id = await createWorksheetAdmin(body, createdBy);
    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : "저장 중 오류가 발생했어요.";
    // Detect common missing-table case and give a more actionable hint.
    if (
      raw.includes("public.worksheets") ||
      raw.includes("schema cache") ||
      raw.includes("worksheet_questions") ||
      raw.includes("created_by")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "데이터베이스 마이그레이션이 누락되었어요. Supabase SQL Editor 에서 scripts/migrations/2026-06-12-worksheet-owner.sql 까지 모두 실행해 주세요.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: false, error: raw }, { status: 500 });
  }
}
