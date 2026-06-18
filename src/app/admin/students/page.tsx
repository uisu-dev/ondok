import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { estimateGradeLabel } from "@/lib/grade";

export const dynamic = "force-dynamic";

interface StudentRow {
  id: string;
  name: string;
  grade: string | null;
  mbti: string | null;
  sago: number;
  books: number;
  sheets: number;
}

export default async function StudentsPage() {
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");

  const schoolCode = access.user?.profile?.school_code ?? null;
  const schoolName = access.user?.school?.name ?? null;

  // 슈퍼관리자(HMAC) 등 학교 미지정인 경우 안내
  if (!schoolCode) {
    return (
      <div>
        <AdminHeader />
        <main className="flex-1 w-full">
          <div className="mx-auto max-w-[820px] px-6 py-8 space-y-4">
            <Link href="/admin" className="text-xs font-semibold text-fg-muted hover:text-fg-strong">
              ← 관리자 대시보드
            </Link>
            <Card as="section" className="px-6 py-8 text-center space-y-2">
              <p className="text-3xl">🏫</p>
              <p className="text-sm text-fg-muted">
                소속 학교가 지정된 교원 계정으로 로그인하면 학생 현황을 볼 수 있어요.
              </p>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  let students: StudentRow[] = [];
  let envError: string | null = null;
  try {
    const admin = getAdminSupabase();
    const { data: rawStudents, error } = await admin
      .from("profiles")
      .select("id, display_name, birth_year, mbti")
      .eq("school_code", schoolCode)
      .eq("role", "student")
      .order("display_name");
    if (error) throw error;
    const list = rawStudents ?? [];
    const ids = list.map((s) => s.id);

    const sagoCount: Record<string, number> = {};
    const bookCount: Record<string, number> = {};
    const sheetCount: Record<string, number> = {};
    if (ids.length > 0) {
      const [sg, fv, rp] = await Promise.all([
        admin.from("sago_progress").select("user_id").in("user_id", ids),
        admin.from("favorites").select("user_id").eq("kind", "book").in("user_id", ids),
        admin.from("worksheet_responses").select("user_id").in("user_id", ids),
      ]);
      for (const r of sg.data ?? []) sagoCount[r.user_id] = (sagoCount[r.user_id] ?? 0) + 1;
      for (const r of fv.data ?? []) bookCount[r.user_id] = (bookCount[r.user_id] ?? 0) + 1;
      for (const r of rp.data ?? []) sheetCount[r.user_id] = (sheetCount[r.user_id] ?? 0) + 1;
    }

    students = list.map((s) => ({
      id: s.id,
      name: s.display_name ?? "(이름 미입력)",
      grade: estimateGradeLabel(s.birth_year),
      mbti: s.mbti,
      sago: sagoCount[s.id] ?? 0,
      books: bookCount[s.id] ?? 0,
      sheets: sheetCount[s.id] ?? 0,
    }));
  } catch (e) {
    envError = e instanceof Error ? e.message : "데이터를 불러오지 못했어요.";
  }

  const n = students.length;
  const sum = (k: "sago" | "books" | "sheets") =>
    students.reduce((a, s) => a + s[k], 0);
  const avg = (total: number) => (n > 0 ? Math.round((total / n) * 10) / 10 : 0);
  const totalSago = sum("sago");
  const totalBooks = sum("books");
  const totalSheets = sum("sheets");

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[920px] px-6 py-8 space-y-5">
          <Link href="/admin" className="text-xs font-semibold text-fg-muted hover:text-fg-strong">
            ← 관리자 대시보드
          </Link>
          <Card as="section" className="px-6 py-6 space-y-1">
            <p className="text-xs font-semibold text-accent-600">학생 현황</p>
            <h1 className="text-2xl font-bold text-fg-strong">
              {schoolName ?? "우리 학교"}
            </h1>
            <p className="text-sm text-fg-muted">
              소속 학생들의 학습 현황이에요. 수업 참고 자료로 활용하세요.
            </p>
          </Card>

          {envError && (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
            </Card>
          )}

          {/* 학교 통계 */}
          {!envError && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="학생 수" value={n} unit="명" />
              <StatCard
                label="평균 아는 단어"
                value={avg(totalSago)}
                unit="개"
                hint={`총 ${totalSago}개`}
              />
              <StatCard
                label="도서 선택"
                value={totalBooks}
                unit="권"
                hint={`평균 ${avg(totalBooks)}권`}
              />
              <StatCard
                label="활동지 풀이"
                value={totalSheets}
                unit="건"
                hint={`평균 ${avg(totalSheets)}건`}
              />
            </div>
          )}

          {/* 개별 학생 */}
          {!envError && n === 0 ? (
            <Card as="section" className="px-6 py-8 text-center">
              <p className="text-sm text-fg-muted">
                아직 가입한 학생이 없어요.
              </p>
            </Card>
          ) : (
            !envError && (
              <Card as="section" className="px-2 py-2 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-fg-muted text-xs border-b border-border">
                      <th className="text-left font-semibold px-3 py-2">이름</th>
                      <th className="text-left font-semibold px-3 py-2">학년</th>
                      <th className="text-center font-semibold px-3 py-2">사고도구어</th>
                      <th className="text-center font-semibold px-3 py-2">도서</th>
                      <th className="text-center font-semibold px-3 py-2">활동지</th>
                      <th className="text-center font-semibold px-3 py-2">MBTI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2.5 font-semibold text-fg-strong">
                          {s.name}
                        </td>
                        <td className="px-3 py-2.5 text-fg-muted text-xs">
                          {s.grade ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-accent-600">
                          {s.sago}
                        </td>
                        <td className="px-3 py-2.5 text-center text-fg-strong">
                          {s.books}
                        </td>
                        <td className="px-3 py-2.5 text-center text-fg-strong">
                          {s.sheets}
                        </td>
                        <td className="px-3 py-2.5 text-center text-cat-lit font-semibold">
                          {s.mbti ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )
          )}

          <p className="text-xs text-fg-subtle leading-relaxed">
            · 사고도구어: 학습 모드에서 ‘아는 단어’로 저장한 개수 · 도서: 추천도서에서 하트로 담은 권수
            · 활동지: 답안을 작성·저장한 활동지 수
          </p>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
}) {
  return (
    <Card as="section" className="px-4 py-4">
      <p className="text-xs font-semibold text-fg-muted">{label}</p>
      <p className="mt-1">
        <span className="font-bold text-accent-600" style={{ fontSize: 28, lineHeight: 1 }}>
          {value}
        </span>
        <span className="text-fg-muted text-sm ml-0.5">{unit}</span>
      </p>
      {hint && <p className="text-[10px] text-fg-subtle mt-0.5">{hint}</p>}
    </Card>
  );
}
