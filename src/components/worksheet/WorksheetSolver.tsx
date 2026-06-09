"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { Book } from "@/lib/types";
import {
  QTYPE_LABEL,
  TYPE_EMOJI,
  TYPE_LABEL,
  type Question,
  type WorksheetWithQuestions,
} from "@/lib/worksheet-types";
import {
  analyzeSago,
  difficultyClass,
  difficultyLabel,
  difficultyOf,
  formatSagoStatsLine,
  parseDifficulty,
} from "@/lib/sago-analyze";
import { buildYouTubeEmbedUrl, extractYouTubeId } from "@/lib/youtube";

type FontSize = "sm" | "md" | "lg" | "xl";

// Inline px sizes — avoids any Tailwind class detection edge cases and
// guarantees the toggle visibly scales text on every browser.
const FONT_PX: Record<FontSize, number> = {
  sm: 14,
  md: 16,
  lg: 19,
  xl: 22,
};

// Indicator letters in the toggle buttons grow with the size they represent.
const FONT_BUTTON_INDICATOR_PX: Record<FontSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
};

const STORAGE_KEY = "ondok:worksheet-fontsize";

export function WorksheetSolver({
  worksheet,
  book,
}: {
  worksheet: WorksheetWithQuestions;
  book: Book | null;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [teacherMode, setTeacherMode] = useState(false); // 교사용 인쇄 시 일시적으로 true
  const [showSagoModal, setShowSagoModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as FontSize | null;
      if (saved && saved in FONT_PX) setFontSize(saved);
    } catch {
      /* ignore */
    }
  }, []);

  // 사고도구어 모달: ESC 로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!showSagoModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSagoModal(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showSagoModal]);

  function changeFontSize(s: FontSize) {
    setFontSize(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }

  function setAnswer(qIdx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [qIdx]: value }));
  }
  function toggleReveal(qIdx: number) {
    setReveal((prev) => ({ ...prev, [qIdx]: !prev[qIdx] }));
  }

  // 사고도구어 통계 — 지문이 텍스트로 있을 때만 의미 있음.
  const sagoStats = useMemo(
    () =>
      (worksheet.type === "written" || worksheet.type === "exam") &&
      worksheet.passage
        ? analyzeSago(worksheet.passage)
        : null,
    [worksheet.type, worksheet.passage]
  );
  const difficulty = useMemo(() => {
    // 관리자 수동 오버라이드가 있으면 우선 사용
    const override = parseDifficulty(worksheet.difficultyOverride);
    if (override) return override;
    if (sagoStats) return difficultyOf(sagoStats, worksheet.passage);
    return null;
  }, [worksheet.difficultyOverride, worksheet.passage, sagoStats]);


  const youtubeId = useMemo(
    () => extractYouTubeId(worksheet.youtubeUrl ?? null),
    [worksheet.youtubeUrl]
  );

  /**
   * 인쇄 시:
   *  1) document.title 을 "[타입 라벨] - [활동지 제목]" 으로 임시 교체
   *     → 브라우저의 "PDF로 저장" 기본 파일명에 그대로 반영됨
   *  2) teacherMode 인지에 따라 모범 답안/정답을 자동 노출
   *  3) 인쇄 종료(또는 인쇄 미리보기 닫힘) 후 원래 title / mode 복원
   */
  async function runPrint(mode: "student" | "teacher") {
    if (typeof window === "undefined") return;
    const suffix = mode === "teacher" ? " (교사용)" : "";
    const filename = `${TYPE_LABEL[worksheet.type]} - ${worksheet.title}${suffix}`;
    const previousTitle = document.title;
    document.title = filename;
    if (mode === "teacher") setTeacherMode(true);
    // 다음 paint 까지 기다려 변경된 상태가 인쇄에 반영되게 함
    await new Promise((r) => setTimeout(r, 80));
    window.print();
    // 인쇄 다이얼로그가 끝난 뒤 복원
    setTimeout(() => {
      document.title = previousTitle;
      if (mode === "teacher") setTeacherMode(false);
    }, 700);
  }

  return (
    <>
      <Card
        as="section"
        className="px-6 py-6 space-y-2 print:shadow-none print:rounded-none print:border print:border-fg-strong"
      >
        <p className="text-xs font-semibold text-accent-600 print:text-fg">
          {TYPE_EMOJI[worksheet.type]} {TYPE_LABEL[worksheet.type]}
        </p>
        <h1 className="text-2xl font-bold text-fg-strong leading-snug">
          {worksheet.title}
        </h1>
        {worksheet.intro && (
          <p className="text-sm text-fg-muted leading-relaxed whitespace-pre-wrap">
            {worksheet.intro}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {sagoStats && sagoStats.total > 0 && (
            <button
              type="button"
              onClick={() => setShowSagoModal(true)}
              className="text-xs font-semibold text-accent-700 bg-accent-50 px-2.5 py-1 rounded-chip hover:bg-accent-100 transition-colors print:cursor-default print:hover:bg-accent-50"
              aria-label="이 지문에 사용된 사고도구어 자세히 보기"
            >
              📊 {formatSagoStatsLine(sagoStats)}
              <span className="ml-1 text-accent-600 print:hidden">▸</span>
            </button>
          )}
          {difficulty && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-chip ${difficultyClass(difficulty)}`}
            >
              난이도 {difficultyLabel(difficulty)}
            </span>
          )}
        </div>
        {teacherMode && (
          <p className="text-xs font-bold text-cat-hum bg-[color-mix(in_oklab,var(--color-cat-hum)_10%,white)] inline-block px-2 py-1 rounded-chip">
            👨‍🏫 교사용 인쇄 모드 — 모범 답안·정답 포함
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
          <button
            onClick={() => runPrint("student")}
            className="text-xs font-semibold px-3 py-1.5 rounded-button bg-accent-50 text-accent-700 hover:bg-accent-100"
          >
            🖨 학생용 인쇄
          </button>
          <button
            onClick={() => runPrint("teacher")}
            className="text-xs font-semibold px-3 py-1.5 rounded-button bg-surface-muted text-fg-strong border border-border hover:border-accent-300"
          >
            👨‍🏫 교사용 인쇄 (정답·해설 포함)
          </button>
        </div>
      </Card>

      {worksheet.type === "books" && book && (
        <Card
          as="section"
          className="px-5 py-5 flex gap-4 print:shadow-none print:rounded-none print:border print:border-fg-strong print:break-inside-avoid"
        >
          <div className="shrink-0 w-20 sm:w-24">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-muted">
              {book.coverUrl && (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap gap-1">
              <Chip tone={book.category}>{book.category}</Chip>
              <Chip tone="neutral">온독지수 {book.ondokIndex}</Chip>
            </div>
            <p className="text-base font-bold text-fg-strong">{book.title}</p>
            <p className="text-xs text-fg-muted">
              {book.author} · {book.publisher} · {book.year}
            </p>
            <a
              href={book.naverLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-accent-600 hover:text-accent-700 inline-block print:hidden"
            >
              네이버에서 보기 →
            </a>
          </div>
        </Card>
      )}

      {worksheet.type === "exam" && worksheet.source && (
        <Card
          as="section"
          className="px-5 py-4 print:shadow-none print:rounded-none print:border print:border-fg-strong"
        >
          <p className="text-sm font-semibold text-fg-strong">
            출처: {worksheet.source}
          </p>
        </Card>
      )}

      {(worksheet.passageImageUrl ||
        ((worksheet.type === "written" || worksheet.type === "exam") &&
          worksheet.passage)) && (
        <Card
          as="section"
          className="passage-card px-6 py-5 space-y-3 print:shadow-none print:rounded-none print:border print:border-fg-strong"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-bold text-accent-600 print:text-fg-strong">
              지문
            </p>
            <div className="flex items-center gap-1 print:hidden">
              <span className="text-xs text-fg-muted mr-1">글자 크기</span>
              {(Object.keys(FONT_PX) as FontSize[]).map((key) => {
                const active = key === fontSize;
                return (
                  <button
                    key={key}
                    onClick={() => changeFontSize(key)}
                    style={{ fontSize: `${FONT_BUTTON_INDICATOR_PX[key]}px` }}
                    className={`font-bold w-8 h-8 rounded-button border leading-none ${
                      active
                        ? "border-accent-500 bg-accent-50 text-accent-700"
                        : "border-border bg-surface text-fg-muted hover:border-accent-300"
                    }`}
                    aria-label={`글자 크기 ${key}`}
                    aria-pressed={active}
                  >
                    가
                  </button>
                );
              })}
            </div>
          </div>
          {worksheet.passageImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={worksheet.passageImageUrl}
              alt="지문 이미지"
              loading="lazy"
              className="block mx-auto max-h-[480px] w-auto max-w-full object-contain rounded-button bg-surface-muted print:max-h-[140mm]"
            />
          )}
          {(worksheet.type === "written" || worksheet.type === "exam") &&
            worksheet.passage && (
              <div
                style={{ fontSize: `${FONT_PX[fontSize]}px`, color: "#000" }}
                className="leading-relaxed whitespace-pre-wrap break-words"
              >
                {worksheet.passage}
              </div>
            )}
        </Card>
      )}

      <div className="space-y-3">
        {worksheet.questions.map((q, idx) => (
          <QuestionCard
            key={q.id ?? idx}
            index={idx}
            question={q}
            answer={answers[idx]}
            onAnswer={(v) => setAnswer(idx, v)}
            revealed={!!reveal[idx]}
            onToggleReveal={() => toggleReveal(idx)}
            teacherMode={teacherMode}
          />
        ))}
      </div>

      {youtubeId && (
        <Card
          as="section"
          className="px-5 py-5 space-y-3 print:hidden"
        >
          <p className="text-xs font-bold text-accent-600">관련 영상</p>
          <div className="relative w-full aspect-video rounded-button overflow-hidden bg-fg-strong">
            <iframe
              src={buildYouTubeEmbedUrl(youtubeId)}
              title="관련 영상"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </Card>
      )}

      <p className="text-xs text-fg-subtle text-center print:hidden">
        ⌨️ 작성한 답은 페이지를 떠나면 사라져요. 인쇄해서 종이로 활용하셔도 좋아요.
      </p>

      {showSagoModal && sagoStats && (
        <div
          className="fixed inset-0 z-50 bg-fg-strong/50 flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden"
          onClick={() => setShowSagoModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sago-modal-title"
        >
          <div
            className="bg-surface rounded-t-card sm:rounded-card shadow-card-hover w-full sm:max-w-md max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p
                  id="sago-modal-title"
                  className="text-base font-bold text-fg-strong"
                >
                  이 지문에 쓰인 사고도구어
                </p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {formatSagoStatsLine(sagoStats)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSagoModal(false)}
                aria-label="닫기"
                className="shrink-0 w-9 h-9 rounded-button hover:bg-surface-muted text-fg-muted text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {([1, 2, 3, 4] as const).map((g) => {
                const words = sagoStats.matches.filter((m) => m.grade === g);
                if (words.length === 0) return null;
                return (
                  <section key={g}>
                    <p className="text-xs font-bold text-accent-600 mb-2">
                      {g}급 · {words.length}개
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {words.map((m, i) => (
                        <span
                          key={i}
                          className="text-sm bg-surface-muted text-fg-strong px-2.5 py-1 rounded-chip"
                          title={m.count > 1 ? `${m.count}회 등장` : "1회 등장"}
                        >
                          {m.word}
                          {m.count > 1 && (
                            <span className="ml-1 text-xs text-fg-muted font-semibold">
                              ×{m.count}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-border text-xs text-fg-subtle">
              표제어 기준 substring 매칭 결과예요. ‘×N’은 본문 내 등장 횟수.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function QuestionCard({
  index,
  question,
  answer,
  onAnswer,
  revealed,
  onToggleReveal,
  teacherMode,
}: {
  index: number;
  question: Question;
  answer: string | undefined;
  onAnswer: (v: string) => void;
  revealed: boolean;
  onToggleReveal: () => void;
  teacherMode: boolean;
}) {
  // 교사용 인쇄 모드에서만 정답·예시답안을 자동 노출.
  const showAnswer = revealed || teacherMode;
  // OX 는 개별 토글이 없어, 교사용 인쇄 모드에서만 정답 강조됨.
  const showOxAnswer = teacherMode;
  return (
    <Card
      as="article"
      className="px-5 py-5 space-y-3 print:shadow-none print:rounded-none print:border print:border-fg-strong print:break-inside-avoid"
    >
      {question.passage && (
        <div className="bg-surface-muted rounded-button px-4 py-3 space-y-1 print:bg-transparent print:border print:border-border-strong">
          <p className="text-[10px] font-bold text-accent-600 print:text-fg-strong">
            지문
          </p>
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{ color: "#000" }}
          >
            {question.passage}
          </div>
        </div>
      )}

      <div className="flex items-baseline gap-2">
        <span className="text-base font-bold text-accent-700 print:text-fg-strong">
          {index + 1}.
        </span>
        <p className="text-base font-semibold text-fg-strong flex-1 whitespace-pre-wrap leading-snug">
          {question.prompt}
        </p>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-surface-muted text-fg-muted print:hidden">
          {QTYPE_LABEL[question.type]}
        </span>
      </div>

      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt="문제 이미지"
          loading="lazy"
          className="block mx-auto max-h-[360px] w-auto max-w-full object-contain rounded-button bg-surface-muted print:max-h-[100mm]"
        />
      )}

      {question.type === "multiple_choice" && question.options && (
        <div className="space-y-1.5">
          {question.options.map((opt, i) => {
            const selected = answer === opt.label;
            const showCorrect = showAnswer && opt.correct;
            return (
              <label
                key={i}
                className={`flex items-start gap-2 px-3 py-2 rounded-button border cursor-pointer transition-colors ${
                  showCorrect
                    ? "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_12%,white)]"
                    : selected
                      ? "border-accent-500 bg-accent-50"
                      : "border-border bg-surface hover:border-accent-300"
                } print:bg-transparent print:border-fg-strong`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  checked={selected}
                  onChange={() => onAnswer(opt.label)}
                  className="mt-1 print:hidden"
                />
                <span className="font-semibold text-fg-strong shrink-0">
                  {opt.label}
                </span>
                <span className="flex-1 text-fg whitespace-pre-wrap">
                  {opt.text}
                </span>
                {showCorrect && (
                  <span className="text-xs font-bold text-[var(--color-cat-sci)] print:hidden">
                    정답
                  </span>
                )}
              </label>
            );
          })}
          <div className="pt-1 print:hidden">
            <button
              onClick={onToggleReveal}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              {revealed ? "정답 가리기" : "정답 보기"}
            </button>
          </div>
        </div>
      )}

      {question.type === "true_false" && question.options && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, i) => {
              const selected = answer === opt.label;
              const showCorrect = showAnswer && opt.correct;
              const isO = opt.label === "O";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAnswer(opt.label)}
                  className={`min-h-[72px] rounded-button border-2 text-3xl font-bold transition-colors ${
                    showCorrect
                      ? "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-[var(--color-cat-sci)]"
                      : selected
                        ? "border-accent-500 bg-accent-50 text-accent-700"
                        : isO
                          ? "border-border bg-surface text-fg-strong hover:border-accent-300"
                          : "border-border bg-surface text-fg-strong hover:border-accent-300"
                  } print:bg-transparent print:border-fg-strong print:text-fg-strong`}
                  aria-pressed={selected}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="pt-1 print:hidden">
            <button
              onClick={onToggleReveal}
              className="text-xs font-semibold text-accent-600 hover:text-accent-700"
            >
              {revealed ? "정답 가리기" : "정답 보기"}
            </button>
          </div>
        </div>
      )}

      {question.type === "short_answer" && (
        <div className="space-y-2">
          <input
            type="text"
            value={answer ?? ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="답을 입력해 주세요"
            className="w-full h-11 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none print:bg-transparent print:border-0 print:border-b-2 print:border-fg-strong print:rounded-none print:h-10"
          />
          {question.sampleAnswer && (
            <>
              <div className="print:hidden">
                <button
                  onClick={onToggleReveal}
                  className="text-xs font-semibold text-accent-600 hover:text-accent-700"
                >
                  {showAnswer ? "예시 답안 가리기" : "예시 답안 보기"}
                </button>
              </div>
              {showAnswer && (
                <p className="mt-1 px-3 py-2 rounded-button bg-[color-mix(in_oklab,var(--color-cat-sci)_8%,white)] text-sm text-fg whitespace-pre-wrap print:bg-transparent print:border print:border-border-strong">
                  예시 답안: {question.sampleAnswer}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {question.type === "essay" && (
        <div className="space-y-2">
          <textarea
            value={answer ?? ""}
            onChange={(e) => onAnswer(e.target.value)}
            rows={5}
            placeholder="답안을 자유롭게 작성해 주세요"
            className="w-full px-3 py-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none leading-relaxed print:bg-transparent print:border print:border-fg-strong print:h-32"
          />
          {question.rubric && (
            <>
              <div className="print:hidden">
                <button
                  onClick={onToggleReveal}
                  className="text-xs font-semibold text-accent-600 hover:text-accent-700"
                >
                  {showAnswer ? "모범 답안 가리기" : "모범 답안 보기"}
                </button>
              </div>
              {showAnswer && (
                <p className="mt-1 px-3 py-2 rounded-button bg-surface-muted text-sm text-fg leading-relaxed whitespace-pre-wrap print:bg-transparent print:border print:border-border-strong">
                  모범 답안: {question.rubric}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
