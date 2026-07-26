import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * POST — 읽기 진도·완독·점검 문제 답안을 저장한다.
 * body: { work_id, last_section?, completed?, answers? }
 * 비로그인은 조용히 무시(게스트도 읽기는 가능).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, signedIn: false });

  let body: {
    work_id?: number;
    last_section?: number;
    completed?: boolean;
    answers?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "요청 형식 오류" }, { status: 400 });
  }
  const workId = Number(body.work_id);
  if (!Number.isFinite(workId)) {
    return NextResponse.json({ ok: false, error: "work_id 오류" }, { status: 400 });
  }

  let admin;
  try {
    admin = getAdminSupabase();
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "서버 오류" },
      { status: 500 }
    );
  }

  // 기존 기록과 병합 (진도만 보내거나 답안만 보내는 두 경우 모두 지원)
  const { data: prev } = await admin
    .from("work_records")
    .select("last_section, completed_at, answers")
    .eq("user_id", user.id)
    .eq("work_id", workId)
    .maybeSingle();

  const prevSection = (prev?.last_section as number) ?? 0;
  const prevAnswers = (prev?.answers as Record<string, string>) ?? {};
  const prevCompleted = (prev?.completed_at as string) ?? null;

  // 진도는 뒤로 가지 않게 최댓값 유지
  const lastSection =
    typeof body.last_section === "number"
      ? Math.max(prevSection, Math.floor(body.last_section))
      : prevSection;

  let answers = prevAnswers;
  if (body.answers && typeof body.answers === "object") {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.answers)) {
      if (typeof v === "string" && v.trim().length > 0) cleaned[k] = v;
    }
    answers = cleaned;
  }
  const answeredCount = Object.keys(answers).length;
  const completedAt =
    prevCompleted ?? (body.completed ? new Date().toISOString() : null);

  const { error } = await admin.from("work_records").upsert(
    {
      user_id: user.id,
      work_id: workId,
      last_section: lastSection,
      completed_at: completedAt,
      answers,
      answered_count: answeredCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,work_id" }
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, signedIn: true, completedAt });
}
