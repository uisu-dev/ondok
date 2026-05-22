import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/data/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "worksheet-images";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { ok: false, error: "관리자 권한이 필요합니다." },
      { status: 401 }
    );
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Supabase 설정 오류" },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "요청 형식 오류 (FormData 필요)" },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { ok: false, error: "파일이 첨부되지 않았어요." },
      { status: 400 }
    );
  }
  // Already client-resized; cap server-side at 6MB defensively.
  if (file.size > 6 * 1024 * 1024) {
    return NextResponse.json(
      { ok: false, error: "이미지가 너무 큽니다(6MB 초과)." },
      { status: 413 }
    );
  }

  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${stamp}-${rand}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    // Detect missing bucket
    const msg = error.message || "";
    if (msg.includes("Bucket not found") || msg.includes("not found")) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Supabase Storage 버킷 'worksheet-images' 가 없어요. Supabase Dashboard → Storage 에서 새 버킷을 만들고 'Public bucket'으로 설정해 주세요.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl, path });
}
