import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/data/supabase-admin";
import { earnsBadge, firstTryCount, quizKeysOf } from "@/lib/work-types";
import type { Annotation, NoteAnswer, WorkQuestion } from "@/lib/work-types";

export const dynamic = "force-dynamic";

/**
 * POST — 읽기 진도·완독·점검 문제 답안·형광펜 문제 채점을 저장한다.
 * body: { work_id, last_section?, completed?, answers?, note?: { key, picked } }
 *
 * 형광펜 문제의 정답은 서버가 works.annotations 를 보고 판정한다.
 * (클라이언트가 보내는 것은 '몇 번을 골랐는지'뿐)
 * 조건을 채우면 badge_at 을 찍는다.
 *
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
    note?: { key?: string; picked?: number };
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

  const [{ data: prev }, { data: work }] = await Promise.all([
    admin
      .from("work_records")
      .select("last_section, completed_at, answers, note_answers, badge_at")
      .eq("user_id", user.id)
      .eq("work_id", workId)
      .maybeSingle(),
    admin
      .from("works")
      .select("annotations, questions")
      .eq("id", workId)
      .maybeSingle(),
  ]);

  if (!work) {
    return NextResponse.json({ ok: false, error: "작품을 찾을 수 없습니다" }, { status: 404 });
  }

  const prevSection = (prev?.last_section as number) ?? 0;
  const prevAnswers = (prev?.answers as Record<string, string>) ?? {};
  const prevCompleted = (prev?.completed_at as string) ?? null;
  const prevBadge = (prev?.badge_at as string) ?? null;
  const noteAnswers: Record<string, NoteAnswer> =
    (prev?.note_answers as Record<string, NoteAnswer>) ?? {};

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

  // 형광펜 문제 채점 — 정답은 서버가 판정한다
  const annotations = (work.annotations ?? {}) as Record<string, Annotation>;
  const noteKey = body.note?.key;
  const picked = body.note?.picked;
  if (
    typeof noteKey === "string" &&
    typeof picked === "number" &&
    annotations[noteKey]?.type === "quiz"
  ) {
    const ok = annotations[noteKey].answer === picked;
    const before = noteAnswers[noteKey];
    noteAnswers[noteKey] = {
      picked,
      // 한 번 맞힌 문제는 다시 틀려도 맞힌 것으로 둔다
      ok: before?.ok === true || ok,
      first: before ? before.first : ok,
    };
  }

  const answeredCount = Object.keys(answers).length;
  const completedAt =
    prevCompleted ?? (body.completed ? new Date().toISOString() : null);

  const questions = (work.questions ?? []) as WorkQuestion[];
  const quizKeys = quizKeysOf(annotations);
  const noteCorrect = quizKeys.filter((k) => noteAnswers[k]?.ok).length;
  // 배지는 첫 시도 정답만 인정한다
  const noteFirstCorrect = firstTryCount(quizKeys, noteAnswers);

  const badgeAt =
    prevBadge ??
    (earnsBadge({
      completed: !!completedAt,
      quizKeys,
      noteAnswers,
      questionCount: questions.length,
      answeredCount,
    })
      ? new Date().toISOString()
      : null);

  const { error } = await admin.from("work_records").upsert(
    {
      user_id: user.id,
      work_id: workId,
      last_section: lastSection,
      completed_at: completedAt,
      answers,
      answered_count: answeredCount,
      note_answers: noteAnswers,
      note_correct: noteCorrect,
      badge_at: badgeAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,work_id" }
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    signedIn: true,
    completedAt,
    noteCorrect,
    noteFirstCorrect,
    quizTotal: quizKeys.length,
    badgeAt,
    // 이번 요청으로 배지를 새로 받았는지
    badgeJustEarned: !prevBadge && !!badgeAt,
  });
}
