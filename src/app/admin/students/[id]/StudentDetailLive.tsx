"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { DataRefreshBar } from "@/components/admin/DataRefreshBar";
import { freshGet } from "@/components/admin/fresh-get";
import { classLabel, estimateGradeLabel } from "@/lib/grade";
import type { Book } from "@/lib/types";
import { TYPE_EMOJI, TYPE_LABEL } from "@/lib/worksheet-types";
import { StudentDetail, type GradeBreakdown } from "./StudentDetail";
import { RemoveAccountCard } from "./RemoveAccountCard";
import { StudentEditCard } from "./StudentEditCard";
import { StudentPasswordCard } from "./StudentPasswordCard";

interface QA {
  prompt: string;
  answer: string;
}

interface SnapshotStudent {
  login_id: string | null;
  display_name: string | null;
  school_code: string | null;
  birth_year: number | null;
  grade: number | null;
  class_no: number | null;
  student_no: number | null;
  mbti: string | null;
}

interface Snapshot {
  student: SnapshotStudent | null;
  schoolName: string | null;
  breakdown: GradeBreakdown[];
  advice: string[];
  favBooks: Book[];
  solvedSheets: Array<{
    id: number;
    type: string;
    title: string;
    answeredCount: number;
    updatedAt: string;
  }>;
  readWorks: Array<{
    slug: string;
    title: string;
    coverEmoji: string;
    completed: boolean;
    lastSection: number;
    sectionCount: number;
    updatedAt: string;
    qa: QA[];
  }>;
  gameStats: { matchBest: number; chosungBest: number; battleWins: number };
  totalKnown: number;
  totalAll: number;
}

function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const row = value as Snapshot;
  return (
    Array.isArray(row.breakdown) &&
    Array.isArray(row.readWorks) &&
    Array.isArray(row.solvedSheets) &&
    Array.isArray(row.favBooks) &&
    Array.isArray(row.advice) &&
    typeof row.totalKnown === "number" &&
    typeof row.totalAll === "number" &&
    !!row.gameStats &&
    typeof row.gameStats.matchBest === "number"
  );
}

/**
 * 학생 한 명의 현황. 새로고침은 이 화면의 데이터만 갈아끼우고
 * 펼친 단어 목록·입력 중인 학적은 그대로 둔다.
 */
export function StudentDetailLive({
  studentId,
  isSuper,
  schools,
  fetchedAt: initialFetchedAt,
  initial,
}: {
  studentId: string;
  isSuper: boolean;
  schools: { code: string; name: string; type: string }[];
  fetchedAt: string;
  initial: Snapshot;
}) {
  const [data, setData] = useState(initial);
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt);
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  async function refresh() {
    const seq = ++requestSeq.current;
    setLoading(true);
    setRefreshError(null);
    try {
      const res = await freshGet(`/api/admin/students/${studentId}?full=1`);
      const json = (await res.json()) as {
        ok?: boolean;
        fetchedAt?: string;
        detail?: unknown;
      };
      if (seq !== requestSeq.current) return;
      if (!res.ok || !json.ok || !isSnapshot(json.detail)) {
        setRefreshError("다시 불러오지 못했어요. 지금 화면은 그대로 둡니다.");
        return;
      }
      setData(json.detail);
      setFetchedAt(
        typeof json.fetchedAt === "string" ? json.fetchedAt : new Date().toISOString()
      );
    } catch {
      if (seq !== requestSeq.current) return;
      setRefreshError("다시 불러오지 못했어요. 지금 화면은 그대로 둡니다.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
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

  return (
    <div className="space-y-5">
      <DataRefreshBar
        sticky
        fetchedAt={fetchedAt}
        loading={loading}
        error={refreshError}
        onRefresh={refresh}
      />

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

      {/* 임시 비밀번호 — 교원도 제 학교 학생에게는 발급할 수 있다 */}
      {student && (
        <StudentPasswordCard
          userId={studentId}
          displayName={student.display_name ?? ""}
          loginId={student.login_id ?? null}
        />
      )}

      {/* 학적 수정 — 슈퍼관리자·admin 만 */}
      {isSuper && student && (
        <StudentEditCard
          userId={studentId}
          schools={schools}
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
          userId={studentId}
          displayName={student?.display_name ?? ""}
          loginId={student?.login_id ?? null}
        />
      )}
    </div>
  );
}
