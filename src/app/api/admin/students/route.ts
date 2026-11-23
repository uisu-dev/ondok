import { NextResponse } from "next/server";
import { loadStudentDashboard } from "@/app/admin/students/dashboard";
import { canAccessAdmin } from "@/lib/auth";
import { NO_STORE_HEADERS } from "@/lib/no-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

/**
 * GET — 학생 현황 목록.
 * 교원 화면의 새로고침이 이 응답으로 표·반 통계를 갈아끼운다.
 * 학교 범위는 세션으로만 정한다. 쿼리로 학교를 바꾸지 않는다.
 */
export async function GET() {
  const access = await canAccessAdmin();
  if (!access.ok) {
    return json({ ok: false, error: "권한이 없습니다." }, 403);
  }

  const isSuper = access.reason === "hmac" || access.reason === "admin";
  const teacherSchool = access.user?.profile?.school_code ?? null;
  if (!isSuper && !teacherSchool) {
    return json(
      { ok: false, error: "소속 학교가 지정된 교원 계정으로 로그인해야 합니다." },
      403
    );
  }

  try {
    const students = await loadStudentDashboard(isSuper ? null : teacherSchool);
    return json({
      ok: true,
      fetchedAt: new Date().toISOString(),
      students,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
    return json({ ok: false, error: message }, 500);
  }
}
