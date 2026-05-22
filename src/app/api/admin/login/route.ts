import { NextRequest, NextResponse } from "next/server";
import { setAdminCookie, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
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
