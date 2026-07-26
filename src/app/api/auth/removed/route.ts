import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/data/supabase-admin";
import { isValidLoginId } from "@/lib/login-id";

export const dynamic = "force-dynamic";

/**
 * 로그인에 실패한 아이디가 '탈퇴 처리'된 것인지 확인한다.
 * 탈퇴 사유를 본인에게 안내하기 위한 용도이며, 그 외 정보는 반환하지 않는다.
 */
export async function GET(req: NextRequest) {
  const loginId = (req.nextUrl.searchParams.get("login_id") ?? "")
    .trim()
    .toLowerCase();
  if (!isValidLoginId(loginId)) {
    return NextResponse.json({ removed: false });
  }

  try {
    const admin = getAdminSupabase();
    const { data } = await admin
      .from("removed_accounts")
      .select("reason, removed_at")
      .eq("login_id", loginId)
      .maybeSingle();
    if (!data) return NextResponse.json({ removed: false });
    return NextResponse.json({
      removed: true,
      reason: (data.reason as string) ?? null,
      removedAt: (data.removed_at as string) ?? null,
    });
  } catch {
    return NextResponse.json({ removed: false });
  }
}
