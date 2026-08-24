"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TYPE_EMOJI, TYPE_LABEL } from "@/lib/worksheet-types";
import { issueStudentTempPassword } from "./[id]/actions";
import type { StudentRow } from "./StudentsTable";

/**
 * 학생 현황 모달.
 *
 * 목록에서 이름을 누르면 페이지를 옮기지 않고 여기서 바로 보여 준다.
 * 여러 학생을 견주어 볼 때 뒤로가기를 반복하지 않아도 된다.
 *
 * 표에 이미 있는 값(사고도구어 수·도서·활동지 등)은 즉시 그리고,
 * 지도 방향 분석처럼 따로 계산이 필요한 것만 API 로 받아 채운다.
 */

interface QA {
  prompt: string;
  answer: string;
}

interface Detail {
  student: {
    loginId: string | null;
    name: string | null;
    schoolName: string | null;
    grade: number | null;
    classNo: number | null;
    studentNo: number | null;
    birthYear: number | null;
    mbti: string | null;
  };
  sago: {
    totalKnown: number;
    totalAll: number;
    byGrade: Array<{
      grade: number;
      known: number;
      total: number;
      examples: string[];
    }>;
  };
  advice: string[];
  books: Array<{ id: number | string; title: string }>;
  sheets: Array<{
    id: number;
    type: string;
    title: string;
    answeredCount: number;
    updatedAt: string;
    qa: QA[];
  }>;
  works: Array<{
    slug: string;
    title: string;
    coverEmoji: string;
    completed: boolean;
    lastSection: number;
    sectionCount: number;
    answered: number;
    updatedAt: string;
    qa: QA[];
  }>;
  games: { matchBest: number; chosungBest: number; battleWins: number };
}

const GRADE_LABEL: Record<number, string> = {
  1: "1급",
  2: "2급",
  3: "3급",
  4: "4급",
};

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

export function StudentModal({
  row,
  onClose,
  onPrev,
  onNext,
}: {
  row: StudentRow;
  onClose: () => void;
  /** 목록에서 이전/다음 학생으로 바로 넘기기 (닫았다 열 필요 없이) */
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 작성 내용은 길어서 기본으로 접어 두고, 누른 것만 편다
  const [openWork, setOpenWork] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<number | null>(null);
  // 임시 비밀번호 발급
  const [pwPending, setPwPending] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // 학생이 바뀌면 부모가 key 를 갈아 끼워 새로 마운트하므로,
  // 여기서는 초기화 없이 받아 오기만 하면 된다.
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/students/${row.id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!alive) return;
        if (!json.ok) {
          setError(json.error ?? "불러오지 못했어요.");
          return;
        }
        setDetail(json as Detail);
      })
      .catch(() => {
        if (alive) setError("불러오지 못했어요.");
      });
    return () => {
      alive = false;
    };
  }, [row.id]);

  // ESC 로 닫기, ←/→ 로 학생 이동, 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev?.();
      else if (e.key === "ArrowRight") onNext?.();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onPrev, onNext]);

  async function resetPassword() {
    if (pwPending) return;
    if (
      !window.confirm(
        `${row.name} 님의 비밀번호를 임시 비밀번호로 재설정할까요?
기존 비밀번호는 더 이상 쓸 수 없게 됩니다.`
      )
    )
      return;
    setPwPending(true);
    setPwError(null);
    try {
      const res = await issueStudentTempPassword(row.id);
      if (!res.ok) setPwError(res.message);
      else setTempPw(res.password);
    } finally {
      setPwPending(false);
    }
  }

  const classText =
    row.grade != null && row.classNo != null
      ? `${row.grade}학년 ${row.classNo}반${row.studentNo != null ? ` ${row.studentNo}번` : ""}`
      : "학년·반 미입력";

  return (
    <div
      className="fixed inset-0 z-[70] bg-fg-strong/55 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-modal-title"
    >
      <div
        className="bg-surface rounded-t-card sm:rounded-card shadow-card-hover w-full sm:max-w-[640px] max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 머리 */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-accent-600">학생 현황</p>
              <h2
                id="student-modal-title"
                className="text-xl font-bold text-fg-strong leading-snug truncate"
              >
                {row.name}
                {row.loginId && (
                  <span className="ml-2 text-xs font-mono font-normal text-fg-subtle">
                    {row.loginId}
                  </span>
                )}
              </h2>
              <p className="text-xs text-fg-muted mt-0.5 truncate">
                {row.schoolName ?? "학교 미지정"} · {classText}
                {row.mbti && (
                  <span className="text-cat-lit font-semibold"> · {row.mbti}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(onPrev || onNext) && (
                <>
                  <button
                    type="button"
                    onClick={onPrev}
                    disabled={!onPrev}
                    aria-label="이전 학생"
                    className="w-9 h-9 rounded-button hover:bg-surface-muted text-fg-muted disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!onNext}
                    aria-label="다음 학생"
                    className="w-9 h-9 rounded-button hover:bg-surface-muted text-fg-muted disabled:opacity-30"
                  >
                    ›
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="w-9 h-9 rounded-button hover:bg-surface-muted text-fg-muted text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* 몸통 */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 표에 이미 있는 값 — 기다리지 않고 바로 보여 준다 */}
          <div className="grid grid-cols-4 gap-2">
            <Stat label="사고도구어" value={row.sago} tone="accent" />
            <Stat label="도서" value={row.books} />
            <Stat label="활동지" value={row.sheets} />
            <Stat label="고전 완독" value={row.worksDone} />
          </div>

          {error && (
            <p className="text-sm text-cat-hum font-semibold">{error}</p>
          )}

          {!detail && !error && (
            <p className="text-xs text-fg-subtle">자세한 현황을 불러오는 중…</p>
          )}

          {detail && (
            <>
              {/* 지도 방향 */}
              <section className="rounded-card bg-[color-mix(in_oklab,var(--color-accent-500)_7%,white)] border border-accent-200 px-4 py-3.5 space-y-1.5">
                <p className="text-xs font-bold text-accent-700">
                  🧭 사고도구어 지도 방향
                </p>
                {detail.advice.map((line, i) => (
                  <p key={i} className="text-sm text-fg leading-relaxed">
                    {line}
                  </p>
                ))}
              </section>

              {/* 급수별 진도 */}
              <section className="space-y-2">
                <p className="text-xs font-bold text-fg-strong">
                  급수별 진도 · {detail.sago.totalKnown}/{detail.sago.totalAll}
                </p>
                <div className="space-y-1.5">
                  {detail.sago.byGrade.map((g) => {
                    const pct =
                      g.total > 0 ? Math.round((g.known / g.total) * 100) : 0;
                    return (
                      <div key={g.grade} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-fg-muted w-8 shrink-0">
                          {GRADE_LABEL[g.grade]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-cat-sci)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-fg-subtle w-20 text-right shrink-0">
                          {g.known}/{g.total} ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 고전 읽기 */}
              <section className="space-y-2">
                <p className="text-xs font-bold text-fg-strong">
                  📜 고전 읽기 {detail.works.length > 0 && `· ${detail.works.length}편`}
                </p>
                {detail.works.length === 0 ? (
                  <p className="text-xs text-fg-subtle">아직 읽은 작품이 없어요.</p>
                ) : (
                  <ul className="space-y-1">
                    {detail.works.map((w) => {
                      const open = openWork === w.slug;
                      return (
                        <li key={w.slug} className="rounded-button bg-surface-muted">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenWork(open ? null : w.slug)
                            }
                            disabled={w.qa.length === 0}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left disabled:cursor-default"
                          >
                            <span aria-hidden className="text-base">
                              {w.coverEmoji}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold text-fg-strong truncate">
                                {w.title}
                              </span>
                              <span className="block text-[10px] text-fg-subtle">
                                {w.completed
                                  ? "완독"
                                  : `${w.lastSection + 1}/${w.sectionCount} 대목`}
                                {w.answered > 0 && ` · 점검 문제 ${w.answered}개 작성`}
                                {" · "}
                                {dateLabel(w.updatedAt)}
                              </span>
                            </span>
                            {w.qa.length > 0 && (
                              <span
                                aria-hidden
                                className="text-[10px] font-bold text-accent-600 shrink-0"
                              >
                                {open ? "접기" : "답안 보기"}
                              </span>
                            )}
                          </button>
                          {open && <AnswerList qa={w.qa} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* 활동지 */}
              <section className="space-y-2">
                <p className="text-xs font-bold text-fg-strong">
                  ✍️ 작성한 활동지{" "}
                  {detail.sheets.length > 0 && `· ${detail.sheets.length}건`}
                </p>
                {detail.sheets.length === 0 ? (
                  <p className="text-xs text-fg-subtle">
                    아직 작성한 활동지가 없어요.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {detail.sheets.map((sh) => {
                      const open = openSheet === sh.id;
                      return (
                        <li key={sh.id} className="rounded-button bg-surface-muted">
                          <button
                            type="button"
                            onClick={() => setOpenSheet(open ? null : sh.id)}
                            disabled={sh.qa.length === 0}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left disabled:cursor-default"
                          >
                            <span aria-hidden className="text-base">
                              {TYPE_EMOJI[sh.type as keyof typeof TYPE_EMOJI] ?? "📄"}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold text-fg-strong truncate">
                                {sh.title}
                              </span>
                              <span className="block text-[10px] text-fg-subtle">
                                {TYPE_LABEL[sh.type as keyof typeof TYPE_LABEL] ??
                                  sh.type}{" "}
                                · 답안 {sh.answeredCount}개 · {dateLabel(sh.updatedAt)}
                              </span>
                            </span>
                            {sh.qa.length > 0 && (
                              <span
                                aria-hidden
                                className="text-[10px] font-bold text-accent-600 shrink-0"
                              >
                                {open ? "접기" : "답안 보기"}
                              </span>
                            )}
                          </button>
                          {open && <AnswerList qa={sh.qa} />}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* 도서 · 게임 */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-fg-strong">
                    ❤️ 담은 도서 {detail.books.length > 0 && `· ${detail.books.length}권`}
                  </p>
                  {detail.books.length === 0 ? (
                    <p className="text-xs text-fg-subtle">아직 담은 책이 없어요.</p>
                  ) : (
                    <p className="text-xs text-fg-muted leading-relaxed">
                      {detail.books
                        .slice(0, 6)
                        .map((b) => b.title)
                        .join(", ")}
                      {detail.books.length > 6 && ` 외 ${detail.books.length - 6}권`}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-fg-strong">🎮 게임</p>
                  <p className="text-xs text-fg-muted">
                    짝맞추기 {detail.games.matchBest} · 초성 {detail.games.chosungBest}{" "}
                    · 배틀 {detail.games.battleWins}
                  </p>
                </div>
              </section>
            </>
          )}
        </div>

        {/* 발 */}
        <div className="px-6 py-3.5 border-t border-border space-y-3">
          {tempPw && (
            <div className="rounded-button bg-[color-mix(in_oklab,var(--color-cat-sci)_10%,white)] border border-[var(--color-cat-sci)] px-4 py-3 space-y-1">
              <p className="text-xs font-bold text-cat-sci">
                임시 비밀번호가 발급됐어요
              </p>
              <p
                className="font-mono font-bold text-fg-strong tracking-widest"
                style={{ fontSize: 22 }}
              >
                {tempPw}
              </p>
              <p className="text-[11px] text-fg-muted leading-relaxed">
                학생에게 직접 알려 주세요. 로그인 후{" "}
                <b className="text-fg-strong">마이페이지 → 비밀번호 변경</b>에서
                새 비밀번호로 바꾸도록 안내해 주세요. 이 창을 닫으면 다시 볼 수
                없어요.
              </p>
            </div>
          )}
          {pwError && (
            <p className="text-xs text-cat-hum font-semibold">{pwError}</p>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={resetPassword}
              disabled={pwPending}
              className="h-9 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-bold disabled:opacity-50"
            >
              {pwPending ? "발급 중…" : "🔑 임시 비밀번호 발급"}
            </button>
            <Link
              href={`/admin/students/${row.id}`}
              className="h-9 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold flex items-center"
            >
              전체 화면으로 열기
            </Link>
          </div>
          <p className="text-[11px] text-fg-subtle">
            급수별 단어 목록·학적 수정은 전체 화면에서 할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}

/** 학생이 적은 답안. 물음 아래에 답을 그대로 보여 준다. */
function AnswerList({ qa }: { qa: QA[] }) {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-border">
      {qa.map((x, i) => (
        <div key={i} className="space-y-1">
          <p className="text-[11px] font-bold text-fg-muted leading-relaxed">
            {i + 1}. {x.prompt}
          </p>
          <p className="text-sm text-fg-strong leading-relaxed whitespace-pre-wrap bg-surface rounded-button px-3 py-2">
            {x.answer}
          </p>
        </div>
      ))}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "accent";
}) {
  return (
    <div className="rounded-button bg-surface-muted px-3 py-2.5 text-center">
      <p
        className={`font-bold ${tone === "accent" ? "text-accent-600" : "text-fg-strong"}`}
        style={{ fontSize: 22, lineHeight: 1.1 }}
      >
        {value}
      </p>
      <p className="text-[10px] text-fg-muted mt-0.5">{label}</p>
    </div>
  );
}
