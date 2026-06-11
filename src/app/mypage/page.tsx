import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getSignedInUser } from "@/lib/auth";
import { getAdminSupabase } from "@/data/supabase-admin";
import { TeacherApplicationCard } from "./TeacherApplicationCard";
import { SignOutButton } from "./SignOutButton";
import { ChangePasswordCard } from "./ChangePasswordCard";
import booksSeed from "@/data/books-seed.json";
import type { Book } from "@/lib/types";
import { TYPE_EMOJI, TYPE_LABEL } from "@/lib/worksheet-types";

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
  // 즐겨찾기 (책 + 활동지)
  let favBooks: Book[] = [];
  let favWorksheets: Array<{ id: number; type: string; title: string }> = [];
  // 내가 푼 활동지
  let solvedWorksheets: Array<{
    id: number;
    type: string;
    title: string;
    answeredCount: number;
    updatedAt: string;
  }> = [];
  try {
    const admin = getAdminSupabase();
    const { data: progress } = await admin
      .from("sago_progress")
      .select("word_key")
      .eq("user_id", user.id);
    if (progress) {
      knownTotal = progress.length;
      for (const row of progress) {
        const g = Number(String(row.word_key).split(".")[0]);
        if (g >= 1 && g <= 4) {
          knownByGrade[g as 1 | 2 | 3 | 4]++;
        }
      }
    }

    const { data: favs } = await admin
      .from("favorites")
      .select("kind, target_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (favs) {
      const allBooks = booksSeed as Book[];
      for (const f of favs) {
        if (f.kind === "book") {
          const b = allBooks.find((x) => String(x.id) === String(f.target_id));
          if (b) favBooks.push(b);
        }
      }
      const wsIds = favs
        .filter((f) => f.kind === "worksheet")
        .map((f) => Number(f.target_id))
        .filter((n) => Number.isFinite(n));
      if (wsIds.length > 0) {
        const { data: wss } = await admin
          .from("worksheets")
          .select("id, type, title, published")
          .in("id", wsIds)
          .eq("published", true);
        if (wss) {
          // favs 순서 유지
          const map = new Map<number, { id: number; type: string; title: string }>();
          for (const w of wss) {
            map.set(w.id, { id: w.id, type: w.type, title: w.title });
          }
          favWorksheets = wsIds.map((id) => map.get(id)).filter(Boolean) as Array<{
            id: number;
            type: string;
            title: string;
          }>;
        }
      }
    }

    // 내가 푼 활동지 (답안 저장된 것)
    const { data: responses } = await admin
      .from("worksheet_responses")
      .select("worksheet_id, answered_count, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (responses && responses.length > 0) {
      const rIds = responses.map((r) => Number(r.worksheet_id));
      const { data: rws } = await admin
        .from("worksheets")
        .select("id, type, title")
        .in("id", rIds);
      const rmap = new Map<number, { type: string; title: string }>();
      for (const w of rws ?? []) rmap.set(w.id, { type: w.type, title: w.title });
      solvedWorksheets = responses
        .map((r) => {
          const w = rmap.get(Number(r.worksheet_id));
          if (!w) return null;
          return {
            id: Number(r.worksheet_id),
            type: w.type,
            title: w.title,
            answeredCount: r.answered_count as number,
            updatedAt: r.updated_at as string,
          };
        })
        .filter(Boolean) as typeof solvedWorksheets;
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

        {/* 즐겨찾기 — 책 */}
        <Card as="section" className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-fg-muted">즐겨찾기</p>
              <p className="text-lg font-bold text-fg-strong mt-1">
                ❤ 마음에 든 책 {favBooks.length > 0 ? `· ${favBooks.length}권` : ""}
              </p>
            </div>
            <Link
              href="/"
              className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold flex items-center"
            >
              책 둘러보기
            </Link>
          </div>
          {favBooks.length === 0 ? (
            <p className="text-xs text-fg-subtle">
              퀴즈 결과 화면에서 책 카드 오른쪽 위 하트 버튼을 누르면 여기에 모입니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favBooks.map((b) => (
                <Link key={b.id} href={`/book/${b.id}`} className="block group">
                  <div className="relative w-full aspect-[3/4] rounded-button overflow-hidden bg-surface-muted">
                    {b.coverUrl ? (
                      <Image
                        src={b.coverUrl}
                        alt={`${b.title} 표지`}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <p className="text-xs font-bold text-fg-strong mt-1.5 line-clamp-2 leading-snug">
                    {b.title}
                  </p>
                  <p className="text-[10px] text-fg-muted truncate">{b.author}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* 즐겨찾기 — 활동지 */}
        <Card as="section" className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-fg-muted">즐겨찾기</p>
              <p className="text-lg font-bold text-fg-strong mt-1">
                ❤ 좋은 활동지 {favWorksheets.length > 0 ? `· ${favWorksheets.length}건` : ""}
              </p>
            </div>
            <Link
              href="/worksheet"
              className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold flex items-center"
            >
              활동지 둘러보기
            </Link>
          </div>
          {favWorksheets.length === 0 ? (
            <p className="text-xs text-fg-subtle">
              활동지 목록에서 카드 오른쪽 하트 버튼을 누르면 여기에 모입니다.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {favWorksheets.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/worksheet/${w.type}/${w.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-button hover:bg-surface-muted transition-colors"
                  >
                    <span aria-hidden className="text-base">
                      {TYPE_EMOJI[w.type as keyof typeof TYPE_EMOJI] ?? "📄"}
                    </span>
                    <span className="text-sm font-semibold text-fg-strong flex-1 truncate">
                      {w.title}
                    </span>
                    <span className="text-[10px] text-fg-subtle whitespace-nowrap">
                      {TYPE_LABEL[w.type as keyof typeof TYPE_LABEL] ?? w.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 내가 푼 활동지 */}
        <Card as="section" className="px-6 py-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-fg-muted">학습 기록</p>
              <p className="text-lg font-bold text-fg-strong mt-1">
                ✍️ 내가 푼 활동지{" "}
                {solvedWorksheets.length > 0 ? `· ${solvedWorksheets.length}건` : ""}
              </p>
            </div>
            <Link
              href="/worksheet"
              className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold flex items-center"
            >
              활동지 풀러 가기
            </Link>
          </div>
          {solvedWorksheets.length === 0 ? (
            <p className="text-xs text-fg-subtle">
              활동지를 풀고 답을 작성하면 자동으로 저장돼요. 여기서 다시 이어 볼 수 있어요.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {solvedWorksheets.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/worksheet/${w.type}/${w.id}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-button hover:bg-surface-muted transition-colors"
                  >
                    <span aria-hidden className="text-base">
                      {TYPE_EMOJI[w.type as keyof typeof TYPE_EMOJI] ?? "📄"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-fg-strong truncate">
                        {w.title}
                      </span>
                      <span className="block text-[10px] text-fg-subtle">
                        답안 {w.answeredCount}개 ·{" "}
                        {new Date(w.updatedAt).toLocaleDateString("ko-KR", {
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        저장
                      </span>
                    </span>
                    <span className="text-[10px] font-semibold text-accent-600 whitespace-nowrap">
                      이어 보기 →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 비밀번호 변경 */}
        <ChangePasswordCard />

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
              활동지 제작 및 관리
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="h-10 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold flex items-center"
              >
                활동지 관리
              </Link>
              {profile.role === "admin" && (
                <>
                  <Link
                    href="/admin/teachers"
                    className="h-10 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-semibold flex items-center"
                  >
                    교원 승인 큐
                  </Link>
                  <Link
                    href="/admin/users"
                    className="h-10 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-semibold flex items-center"
                  >
                    사용자 관리 · 비번 재설정
                  </Link>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
