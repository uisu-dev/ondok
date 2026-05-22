import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, verifyAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Diagnose missing server config BEFORE checking the password so the user
  // immediately knows whether the problem is "wrong password" or "server not
  // configured yet" (most common when Vercel env vars aren't set after deploy).
  const missing: string[] = [];
  if (!process.env.ADMIN_PASSWORD?.trim()) missing.push("ADMIN_PASSWORD");
  if (!process.env.ADMIN_SESSION_SECRET?.trim()) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `서버 환경변수가 비어 있어요: ${missing.join(", ")}. Vercel 프로젝트 설정 → Environment Variables 에서 추가한 뒤 재배포해 주세요.`,
      },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }
  const password = String(body.password ?? "");
  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { ok: false, error: "비밀번호가 올바르지 않아요." },
      { status: 401 }
    );
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
