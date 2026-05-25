import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 형식이 올바르지 않아요." },
      { status: 400 }
    );
  }

  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "이메일과 비밀번호를 입력해 주세요." },
      { status: 400 }
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "Supabase Auth 설정을 확인해 주세요.",
      },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: "이메일 또는 비밀번호가 올바르지 않아요." },
      { status: 401 }
    );
  }

  if (!isAuthorizedAdmin(data.user)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, error: "관리자 권한이 없는 계정이에요." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
