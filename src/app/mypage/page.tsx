import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getSignedInUser } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { TeacherApplicationCard } from "./TeacherApplicationCard";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, { text: string; tone: string }> = {
  student: { text: "학생", tone: "bg-accent-100 text-accent-700" },
  teacher: { text: "교원", tone: "bg-cat-sci/15 text-cat-sci" },
  admin:   { text: "관리자", tone: "bg-cat-hum/15 text-cat-hum" },
};

const APP_STATUS_LABEL: Record<string, string> = {
  none: "미신청",
  pending: "심사 중",
  approved: "승인됨",
  rejected: "반려됨",
};

export default async function MyPage() {
  const user = await getSignedInUser();
  if (!user) {
    redirect("/login?next=/mypage");
  }
  if (!user.profile) {
    redirect("/login?next=/mypage");
  }

  // 사고도구어 학습 진도 (행 개수 + 등급별 분포)
  let knownByGrade = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let knownTotal = 0;
  try {
    const admin = getAdminSupabase();
    const { data } = await admin
      .from("sago_progress")
      .select("word_key")
      .eq("user_id", user.id);
    if (data) {
      knownTotal = data.length;
      for (const row of data) {
        const g = Number(String(row.word_key).split(".")[0]);
        if (g >= 1 && g <= 4) {
          knownByGrade[g as 1 | 2 | 3 | 4]++;
        }
      }
    }
  } catch {
    /* service role 미설정 시 무시 */
  }

  const profile = user.profile;
  const roleInfo = ROLE_LABEL[profile.role] ?? ROLE_LABEL.student;

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-6">
        {/* 헤더 */}
        <section className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-accent-600">마이페이지</p>
            <h1 className="text-2xl font-bold text-fg-strong mt-1">
              안녕하세요, {profile.display_name} 님
            </h1>
          </div>
          <SignOutButton />
        </section>

        {/* 프로필 카드 */}
        <Card as="section" className="px-6 py-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-fg-muted">계정</p>
              <p className="text-base font-bold text-fg-strong mt-1">
                {profile.display_name}
              </p>
              <p className="text-sm text-fg-muted mt-1">
                {user.school ? user.school.name : "학교 미지정"}
              </p>
              {profile.login_id && (
                <p className="text-xs text-fg-subtle mt-2">
                  아이디 · <span className="font-mono">{profile.login_id}</span>
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-chip text-xs font-bold ${roleInfo.tone}`}
            >
              {roleInfo.text}
            </span>
          </div>
        </Card>

        {/* 사고도구어 학습 진도 */}
        <Card as="section" className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-fg-muted">사고도구어 학습</p>
              <p className="text-lg font-bold text-fg-strong mt-1">
                내가 아는 단어
              </p>
            </div>
            <Link
              href="/sago/learn"
              className="h-9 px-3 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold flex items-center"
            >
              학습 계속하기
            </Link>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="font-bold text-accent-600"
              style={{ fontSize: 48, lineHeight: 1 }}
            >
              {knownTotal}
            </span>
            <span className="text-fg-muted" style={{ fontSize: 24 }}>
              개
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((g) => (
              <div
                key={g}
                className="bg-surface-muted rounded-button px-3 py-2 text-center"
              >
                <p className="text-[10px] font-bold text-fg-muted">{g}급</p>
                <p className="text-base font-bold text-fg-strong">
                  {knownByGrade[g as 1 | 2 | 3 | 4]}
                </p>
              </div>
            ))}
          </div>
          {knownTotal === 0 && (
            <p className="text-xs text-fg-subtle">
              아직 학습 기록이 없어요. <Link href="/sago/learn" className="text-accent-600 font-semibold">학습 모드</Link>에서
              아는 단어를 체크하면 자동으로 저장됩니다.
            </p>
          )}
        </Card>

        {/* 교원 승인 신청 */}
        {profile.role === "student" && (
          <TeacherApplicationCard
            status={profile.teacher_application_status}
            note={profile.teacher_rejection_note}
          />
        )}

        {/* 교원/관리자 전용 메뉴 */}
        {(profile.role === "teacher" || profile.role === "admin") && (
          <Card as="section" className="px-6 py-6 space-y-3">
            <p className="text-xs font-semibold text-fg-muted">교원 메뉴</p>
            <p className="text-base font-bold text-fg-strong">
              활동지 제작 + 사고도구어 데이터 관리
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="h-10 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold flex items-center"
              >
                관리자 대시보드
              </Link>
              {profile.role === "admin" && (
                <Link
                  href="/admin/teachers"
                  className="h-10 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-semibold flex items-center"
                >
                  교원 승인 큐
                </Link>
              )}
            </div>
            <p className="text-xs text-fg-subtle">
              ※ 사이트 슈퍼관리자(uisu9060) 모드는 별도입니다. <code>/admin/login</code> 으로 들어가세요.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
