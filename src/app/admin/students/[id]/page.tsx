import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { canAccessAdmin } from "@/lib/auth";
import { classLabel, estimateGradeLabel } from "@/lib/grade";
import { TYPE_EMOJI, TYPE_LABEL } from "@/lib/worksheet-types";
import { StudentDetail } from "./StudentDetail";
import { loadStudentDetail } from "./load";
import { RemoveAccountCard } from "./RemoveAccountCard";
import { StudentEditCard } from "./StudentEditCard";
import schoolsJson from "@/data/schools.json";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await canAccessAdmin();
  if (!access.ok) redirect("/admin/login");
  const { id } = await params;
  const isSuper = access.reason === "hmac" || access.reason === "admin";

  const data = await loadStudentDetail(id);
  if (data.notFound) notFound();
  if (!data.error && !isSuper && data.student?.school_code !== access.user?.profile?.school_code) {
    redirect("/admin/students");
  }

  const {
    student,
    schoolName,
    breakdown,
    advice,
    favBooks,
    solvedSheets,
    readWorks,
    gameStats,
    totalKnown,
    totalAll,
  } = data;
  const envError = data.error;

  return (
    <div>
      <AdminHeader />
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[720px] px-6 py-8 space-y-5">
          <Link
            href="/admin/students"
            className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
          >
            ← 학생 현황
          </Link>

          {envError ? (
            <Card as="section" className="px-6 py-5 bg-surface-muted">
              <p className="text-sm font-bold text-cat-hum">⚠️ 오류</p>
              <p className="text-xs text-fg-muted mt-1">{envError}</p>
            </Card>
          ) : (
            <>
              {/* 프로필 */}
              <Card as="section" className="px-6 py-6 space-y-2">
                <p className="text-xs font-semibold text-accent-600">학생 상세</p>
                <h1 className="text-2xl font-bold text-fg-strong">
                  {student?.display_name ?? "(이름 미입력)"}
                </h1>
                {student?.login_id && (
                  <p className="text-xs text-fg-subtle">
                    아이디 · <span className="font-mono">{student.login_id}</span>
                  </p>
                )}
                <p className="text-sm text-fg-muted">
                  {schoolName ?? "학교 미지정"}
                  {classLabel(student?.grade, student?.class_no, student?.student_no) ? (
                    <span className="text-accent-600 font-semibold">
                      {" "}
                      · {classLabel(student?.grade, student?.class_no, student?.student_no)}
                    </span>
                  ) : (
                    student?.birth_year &&
                    estimateGradeLabel(student.birth_year) && (
                      <span className="text-fg-subtle">
                        {" "}· 학년·반 미입력 ({estimateGradeLabel(student.birth_year)} 추정)
                      </span>
                    )
                  )}
                  {student?.mbti && (
                    <span className="text-cat-lit font-semibold"> · {student.mbti}</span>
                  )}
                </p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="font-bold text-accent-600" style={{ fontSize: 32, lineHeight: 1 }}>
                    {totalKnown}
                  </span>
                  <span className="text-sm text-fg-muted">/ {totalAll}개 사고도구어 익힘</span>
                </div>
              </Card>

              {/* 지도 방향 분석 */}
              <Card as="section" className="px-6 py-5 space-y-2 bg-[color-mix(in_oklab,var(--color-accent-500)_6%,white)] border border-accent-200">
                <p className="text-sm font-bold text-accent-700">🧭 사고도구어 지도 방향</p>
                <ul className="space-y-1.5">
                  {advice.map((line, i) => (
                    <li key={i} className="text-sm text-fg-strong leading-relaxed flex gap-1.5">
                      <span className="text-accent-500">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* 게임 활동 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">🎮 게임 활동</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-surface-muted rounded-button px-2 py-3">
                    <p className="text-[10px] font-bold text-fg-muted">🃏 짝 맞추기</p>
                    <p className="text-lg font-bold text-fg-strong">{gameStats.matchBest}</p>
                    <p className="text-[10px] text-fg-subtle">최고 점수</p>
                  </div>
                  <div className="bg-surface-muted rounded-button px-2 py-3">
                    <p className="text-[10px] font-bold text-fg-muted">🔤 초성</p>
                    <p className="text-lg font-bold text-fg-strong">{gameStats.chosungBest}</p>
                    <p className="text-[10px] text-fg-subtle">최고 정답</p>
                  </div>
                  <div className="bg-surface-muted rounded-button px-2 py-3">
                    <p className="text-[10px] font-bold text-fg-muted">⚔️ 배틀</p>
                    <p className="text-lg font-bold text-cat-soc">{gameStats.battleWins}</p>
                    <p className="text-[10px] text-fg-subtle">누적 승수</p>
                  </div>
                </div>
              </Card>

              {/* 고전 읽기 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">
                  📜 고전 읽기{" "}
                  {readWorks.length > 0 ? `· ${readWorks.length}편` : ""}
                </p>
                {readWorks.length === 0 ? (
                  <p className="text-xs text-fg-subtle">
                    아직 읽은 작품이 없어요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {readWorks.map((w) => {
                      const pct =
                        w.completed
                          ? 100
                          : w.sectionCount > 0
                            ? Math.round(((w.lastSection + 1) / w.sectionCount) * 100)
                            : 0;
                      return (
                        <div
                          key={w.slug}
                          className="rounded-button border border-border px-4 py-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span aria-hidden className="text-base">
                              {w.coverEmoji}
                            </span>
                            <Link
                              href={`/works/${w.slug}`}
                              className="text-sm font-bold text-fg-strong hover:text-accent-600 flex-1 truncate"
                            >
                              {w.title}
                            </Link>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-chip ${
                                w.completed
                                  ? "bg-[color-mix(in_oklab,var(--color-cat-sci)_16%,white)] text-cat-sci"
                                  : "bg-accent-100 text-accent-700"
                              }`}
                            >
                              {w.completed ? "완독" : `읽는 중 ${pct}%`}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className="h-full bg-accent-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {w.qa.length > 0 ? (
                            <div className="space-y-2 pt-1">
                              <p className="text-[11px] font-bold text-accent-600">
                                점검 문제 답안 {w.qa.length}개
                              </p>
                              {w.qa.map((x, i) => (
                                <div key={i} className="space-y-0.5">
                                  <p className="text-[11px] text-fg-muted leading-snug">
                                    Q{i + 1}. {x.prompt}
                                  </p>
                                  <p className="text-sm text-fg-strong leading-relaxed whitespace-pre-wrap bg-surface-muted rounded-button px-3 py-2">
                                    {x.answer}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-fg-subtle">
                              아직 작성한 답안이 없어요.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* 하트 책 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">
                  ❤ 담아둔 온독도서 {favBooks.length > 0 ? `· ${favBooks.length}권` : ""}
                </p>
                {favBooks.length === 0 ? (
                  <p className="text-xs text-fg-subtle">아직 하트로 담은 책이 없어요.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {favBooks.map((b) => (
                      <Link key={b.id} href={`/book/${b.id}`} className="block group">
                        <div className="relative w-full aspect-[3/4] rounded-button overflow-hidden bg-surface-muted">
                          {b.coverUrl ? (
                            <Image
                              src={b.coverUrl}
                              alt={`${b.title} 표지`}
                              fill
                              sizes="120px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        <p className="text-[11px] font-bold text-fg-strong mt-1 line-clamp-2 leading-snug">
                          {b.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* 작성한 활동지 */}
              <Card as="section" className="px-6 py-5 space-y-3">
                <p className="text-sm font-bold text-fg-strong">
                  ✍️ 작성한 활동지 {solvedSheets.length > 0 ? `· ${solvedSheets.length}건` : ""}
                </p>
                {solvedSheets.length === 0 ? (
                  <p className="text-xs text-fg-subtle">아직 작성·저장한 활동지가 없어요.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {solvedSheets.map((w) => (
                      <li key={w.id}>
                        <Link
                          href={`/worksheet/${w.type}/${w.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-button hover:bg-surface-muted transition-colors"
                        >
                          <span aria-hidden className="text-base">
                            {TYPE_EMOJI[w.type as keyof typeof TYPE_EMOJI] ?? "📄"}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-fg-strong truncate">
                              {w.title}
                            </span>
                            <span className="block text-[10px] text-fg-subtle">
                              {TYPE_LABEL[w.type as keyof typeof TYPE_LABEL] ?? w.type} · 답안{" "}
                              {w.answeredCount}개 ·{" "}
                              {new Date(w.updatedAt).toLocaleDateString("ko-KR", {
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* 급수별 아는/모르는 단어 */}
              <p className="text-xs text-fg-subtle px-1 pt-1">
                급수별로 아는 단어와 더 익혀야 할 단어를 볼 수 있어요.
              </p>
              <StudentDetail breakdown={breakdown} />

              {/* 학적 수정 — 슈퍼관리자·admin 만 */}
              {isSuper && student && (
                <StudentEditCard
                  userId={id}
                  schools={
                    (
                      schoolsJson as {
                        schools: { code: string; name: string; type: string }[];
                      }
                    ).schools
                  }
                  initial={{
                    displayName: student.display_name ?? "",
                    schoolCode: student.school_code,
                    birthYear: student.birth_year,
                    grade: student.grade,
                    classNo: student.class_no,
                    studentNo: student.student_no,
                  }}
                />
              )}

              {/* 부적절 계정 탈퇴 처리 — 슈퍼관리자·admin 만 */}
              {isSuper && (
                <RemoveAccountCard
                  userId={id}
                  displayName={student?.display_name ?? ""}
                  loginId={student?.login_id ?? null}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
