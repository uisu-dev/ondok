"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { Work, WorkRecord, WorkSection, NoteAnswer } from "@/lib/work-types";
import {
  firstTryCount,
  quizKeysOf,
  solvedCount,
  unsolvedQuizKeys,
} from "@/lib/work-types";
import { QTYPE_LABEL } from "@/lib/worksheet-types";
import { AnnotationSheet } from "./AnnotationSheet";
import { BadgeCard, BadgeCelebration, ResetConfirm } from "./Badge";

type FontSize = "sm" | "md" | "lg" | "xl";
const FONT_PX: Record<FontSize, number> = { sm: 15, md: 17, lg: 20, xl: 24 };
const FONT_STORAGE = "ondok:work-fontsize";

/** 연속된 '> ' 줄을 하나의 인용 블록으로 묶는다 (예: 양반전의 증서). */
function groupBlocks(paragraphs: string[]) {
  const blocks: { quote: boolean; lines: string[] }[] = [];
  for (const p of paragraphs) {
    const isQuote = p.startsWith("> ");
    const text = isQuote ? p.slice(2) : p;
    const last = blocks[blocks.length - 1];
    if (last && last.quote && isQuote) last.lines.push(text);
    else blocks.push({ quote: isQuote, lines: [text] });
  }
  return blocks;
}

/**
 * **강조** 와 [[형광펜|주석키]] 만 지원하는 최소 인라인 렌더러.
 * 외부 마크다운 라이브러리 없이 처리한다.
 */
function renderInline(
  text: string,
  key: number,
  onNote?: (annKey: string) => void,
  visited?: Set<string>
) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={`${key}-${i}`} className="text-accent-700">
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (p.startsWith("[[") && p.endsWith("]]")) {
          const inner = p.slice(2, -2);
          const bar = inner.lastIndexOf("|");
          const label = bar >= 0 ? inner.slice(0, bar) : inner;
          const annKey = bar >= 0 ? inner.slice(bar + 1) : inner;
          const done = visited?.has(annKey);
          // button 이 아니라 span — button 의 기본 스타일(가운데 정렬 등)이
          // 본문 줄바꿈을 망가뜨린다.
          return (
            <span
              key={`${key}-${i}`}
              role="button"
              tabIndex={0}
              data-done={done ? "true" : "false"}
              onClick={() => onNote?.(annKey)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onNote?.(annKey);
                }
              }}
              className="hl-note"
              title={done ? "다시 보기" : "눌러서 확인하기"}
            >
              {label}
              <span className="hl-note__mark">{done ? "✓" : "?"}</span>
            </span>
          );
        }
        return <span key={`${key}-${i}`}>{p}</span>;
      })}
    </>
  );
}

export function WorkReader({
  work,
  sections,
  initialRecord,
  signedIn,
}: {
  work: Work;
  sections: WorkSection[];
  initialRecord: WorkRecord | null;
  signedIn: boolean;
}) {
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState(!!initialRecord?.completedAt);
  const [answers, setAnswers] = useState<Record<string, string>>(
    initialRecord?.answers ?? {}
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  // 형광펜 주석
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [readNotes, setReadNotes] = useState<Set<string>>(new Set());
  const [noteAnswers, setNoteAnswers] = useState<Record<string, NoteAnswer>>(
    initialRecord?.noteAnswers ?? {}
  );
  // 배지
  const [badgeAt, setBadgeAt] = useState<string | null>(
    initialRecord?.badgeAt ?? null
  );
  const [celebrate, setCelebrate] = useState(false);
  // 기록 초기화 (첫 시도에 틀린 문제를 다시 풀기 위한 재도전)
  const [askReset, setAskReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resumeTo, setResumeTo] = useState<number | null>(
    initialRecord && initialRecord.lastSection > 0 && !initialRecord.completedAt
      ? initialRecord.lastSection
      : null
  );

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  // 배지 카드에서 '안 쓴 점검 문제'를 눌렀을 때 그 칸으로 데려가기 위한 ref
  const questionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const afterRef = useRef<HTMLDivElement | null>(null);
  const answersDirty = useRef(false);
  const savedSection = useRef(initialRecord?.lastSection ?? 0);

  useEffect(() => {
    try {
      const s = localStorage.getItem(FONT_STORAGE) as FontSize | null;
      if (s && s in FONT_PX) setFontSize(s);
    } catch {
      /* ignore */
    }
  }, []);

  function changeFont(s: FontSize) {
    setFontSize(s);
    try {
      localStorage.setItem(FONT_STORAGE, s);
    } catch {
      /* ignore */
    }
  }

  const saveRecord = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!signedIn) return null;
      try {
        const res = await fetch("/api/works/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ work_id: work.id, ...payload }),
        });
        const json = (await res.json()) as {
          badgeAt?: string | null;
          badgeJustEarned?: boolean;
        };
        if (json.badgeJustEarned) {
          setBadgeAt(json.badgeAt ?? new Date().toISOString());
          setCelebrate(true);
        } else if (json.badgeAt) {
          setBadgeAt(json.badgeAt);
        }
        return json;
      } catch {
        return null;
      }
    },
    [signedIn, work.id]
  );

  // 형광펜 문제를 골랐을 때 — 정답 판정은 서버가 하지만 화면은 즉시 반영한다
  const pickNote = useCallback(
    (key: string, picked: number) => {
      const ann = work.annotations?.[key];
      if (!ann || ann.type !== "quiz") return;
      const ok = ann.answer === picked;
      setNoteAnswers((prev) => {
        const before = prev[key];
        return {
          ...prev,
          [key]: {
            picked,
            ok: before?.ok === true || ok,
            first: before ? before.first : ok,
          },
        };
      });
      void saveRecord({ note: { key, picked } });
    },
    [work.annotations, saveRecord]
  );

  const markRead = useCallback((key: string) => {
    setReadNotes((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  /** 안 쓴 점검 문제로 데려가고 입력칸에 커서를 둔다. */
  const goToQuestion = useCallback((index: number) => {
    const el = questionRefs.current[index];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // 스크롤이 끝난 뒤 포커스해야 화면이 튀지 않는다
    setTimeout(() => el.focus({ preventScroll: true }), 400);
  }, []);

  /** 아직 다 안 읽었을 때 본문 끝(완독 버튼)으로 데려간다. */
  const goToEnd = useCallback(() => {
    const last = sectionRefs.current[sectionRefs.current.length - 1];
    (last ?? afterRef.current)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // 기록을 지우고 처음부터 다시 읽고 싶을 때를 위한 길 (배지 조건과는 무관)
  const resetRecord = useCallback(async () => {
    if (!signedIn || resetting) return;
    setResetting(true);
    try {
      const res = await fetch("/api/works/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_id: work.id }),
      });
      if (!res.ok) return;
      setNoteAnswers({});
      setReadNotes(new Set());
      setAnswers({});
      setCompleted(false);
      setCurrent(0);
      setResumeTo(null);
      savedSection.current = 0;
      answersDirty.current = false;
      setSaveState("idle");
      setAskReset(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setResetting(false);
    }
  }, [signedIn, resetting, work.id]);

  // 어느 대목을 보고 있는지 추적 → 진도 저장
  useEffect(() => {
    const els = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = Number((e.target as HTMLElement).dataset.idx);
          if (Number.isFinite(idx)) setCurrent(idx);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections.length]);

  // 진도는 값이 올라갔을 때만, 1.5초 디바운스로 저장
  useEffect(() => {
    if (!signedIn || current <= savedSection.current) return;
    const t = setTimeout(() => {
      savedSection.current = current;
      void saveRecord({ last_section: current });
    }, 1500);
    return () => clearTimeout(t);
  }, [current, signedIn, saveRecord]);

  // 답안 자동 저장
  useEffect(() => {
    if (!signedIn || !answersDirty.current) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      const res = await saveRecord({ answers });
      setSaveState(res ? "saved" : "idle");
    }, 1000);
    return () => clearTimeout(t);
  }, [answers, signedIn, saveRecord]);

  function jumpTo(idx: number) {
    setResumeTo(null);
    const el = sectionRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finishReading() {
    setCompleted(true);
    savedSection.current = sections.length - 1;
    void saveRecord({ last_section: sections.length - 1, completed: true });
    setTimeout(() => {
      document
        .getElementById("work-after")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const px = FONT_PX[fontSize];
  const annotations = work.annotations ?? {};
  const noteCount = Object.keys(annotations).length;
  const quizKeys = quizKeysOf(annotations);
  const quizSolved = solvedCount(quizKeys, noteAnswers);
  // 한 번에 맞힌 수는 조건이 아니라 표시용 (배지는 다시 풀어 맞혀도 인정)
  const quizFirstTry = firstTryCount(quizKeys, noteAnswers);

  // 아직 남은 것 — 배지 카드에서 눌러 바로 갈 수 있게 넘긴다
  const unsolvedNotes = unsolvedQuizKeys(quizKeys, noteAnswers).map((k) => ({
    key: k,
    title: annotations[k]?.title ?? k,
    tried: !!noteAnswers[k],
  }));
  const unansweredQuestions = work.questions
    .map((q, i) => ({ index: i, key: String(q.position ?? i), prompt: q.prompt }))
    .filter(({ key }) => !(answers[key] ?? "").trim())
    .map(({ index, prompt }) => ({ index, prompt }));
  // 형광펜에 ✓ 를 붙일 대상 — 맞힌 문제 + 읽어 본 배경지식
  const resolved = new Set<string>(readNotes);
  for (const k of quizKeys) if (noteAnswers[k]?.ok) resolved.add(k);

  const pct = sections.length
    ? Math.round(((current + 1) / sections.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* 표지 */}
      <Card as="section" className="px-6 py-6 space-y-3">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-accent-50 flex items-center justify-center text-4xl">
            {work.coverEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <Chip tone="accent">{work.category}</Chip>
              {work.era && <Chip tone="neutral">{work.era}</Chip>}
            </div>
            <h1 className="text-2xl font-bold text-fg-strong leading-snug">
              {work.title}
            </h1>
            {work.author && (
              <p className="text-sm text-fg-muted mt-0.5">{work.author}</p>
            )}
          </div>
        </div>
        {work.summary && (
          <p className="text-sm text-fg leading-relaxed">{work.summary}</p>
        )}

        {noteCount > 0 && (
          <div className="rounded-button bg-surface-muted px-4 py-3 space-y-1">
            <p className="text-xs font-bold text-fg-strong">
              <span className="hl-note" style={{ cursor: "default" }}>
                형광펜
              </span>
              으로 표시된 말을 눌러 보세요
            </p>
            <p className="text-[11px] text-fg-muted leading-relaxed">
              짧은 문제를 풀거나 배경지식을 볼 수 있어요. 이 작품에는 {noteCount}곳이
              있고, 그중 {quizKeys.length}곳이 문제예요.
              {quizKeys.length > 0 && (
                <>
                  {" "}
                  틀려도 <b className="text-fg-strong">다시 풀어 맞히면</b> 인정돼요.
                </>
              )}
            </p>
            {quizKeys.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-cat-sci)] transition-all duration-500"
                    style={{
                      width: `${Math.round((quizSolved / quizKeys.length) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-fg-muted shrink-0">
                  문제 {quizSolved}/{quizKeys.length}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 글자 크기 */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-fg-muted">글자 크기</span>
          {(["sm", "md", "lg", "xl"] as FontSize[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeFont(s)}
              className={`w-9 h-9 rounded-button border-2 font-bold transition-colors ${
                fontSize === s
                  ? "border-accent-500 bg-accent-50 text-accent-700"
                  : "border-border bg-surface text-fg-muted hover:border-accent-300"
              }`}
              style={{ fontSize: FONT_PX[s] - 5 }}
              aria-label={`글자 크기 ${s}`}
            >
              가
            </button>
          ))}
        </div>
      </Card>

      {/* 이어 읽기 */}
      {resumeTo !== null && resumeTo > 0 && (
        <Card as="section" className="px-5 py-4 flex items-center gap-3 bg-accent-50 border border-accent-200">
          <span className="text-2xl">🔖</span>
          <p className="flex-1 text-sm text-fg-strong">
            지난번에 <strong>{sections[resumeTo]?.title ?? `${resumeTo + 1}번째 대목`}</strong>까지
            읽었어요.
          </p>
          <button
            type="button"
            onClick={() => jumpTo(resumeTo)}
            className="h-9 px-3 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold shrink-0"
          >
            이어 읽기
          </button>
        </Card>
      )}

      {/* 진도 표시 */}
      <div className="sticky top-12 z-30 -mx-1 px-1">
        <div className="rounded-full bg-surface/90 backdrop-blur border border-border px-3 py-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-fg-muted shrink-0">
            {current + 1} / {sections.length}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <Card as="article" className="px-6 py-7 space-y-8">
        {sections.map((sec, i) => (
          <section
            key={i}
            data-idx={i}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            className="space-y-3 scroll-mt-24"
          >
            {sec.title && (
              <h2 className="text-base font-bold text-accent-700 border-b border-border pb-2">
                {sec.title}
              </h2>
            )}
            {groupBlocks(sec.paragraphs).map((b, j) =>
              b.quote ? (
                <blockquote
                  key={j}
                  className="border-l-4 border-accent-400 bg-surface-muted rounded-r-button pl-4 pr-3 py-3 space-y-1.5"
                >
                  {b.lines.map((line, k) => (
                    <p
                      key={k}
                      className="leading-[1.8] text-fg-strong"
                      style={{ fontSize: Math.max(13, px - 2) }}
                    >
                      {renderInline(line, k, setOpenNote, resolved)}
                    </p>
                  ))}
                </blockquote>
              ) : (
                <p
                  key={j}
                  className="leading-[1.9] text-fg-strong"
                  style={{ fontSize: px }}
                >
                  {renderInline(b.lines[0], j, setOpenNote, resolved)}
                </p>
              )
            )}
          </section>
        ))}

        {!completed && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={finishReading}
              className="h-12 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold"
            >
              📖 다 읽었어요
            </button>
            <p className="text-xs text-fg-subtle mt-2">
              다 읽으면 작품 해설과 점검 문제가 열려요.
            </p>
          </div>
        )}
      </Card>

      {/* 완독 후: 해설 + 점검 문제 */}
      <div id="work-after" ref={afterRef} className="space-y-5">
        {completed && (
          <>
            <Card as="section" className="px-6 py-5 space-y-2 bg-[color-mix(in_oklab,var(--color-cat-sci)_8%,white)] border border-[var(--color-cat-sci)]">
              <p className="text-sm font-bold text-cat-sci">✓ 완독했어요!</p>
              <p className="text-xs text-fg-muted">
                {signedIn
                  ? "읽기 기록이 저장됐어요. 마이페이지에서 다시 볼 수 있어요."
                  : "로그인하면 읽기 기록이 저장돼요."}
              </p>
            </Card>

            <BadgeCard
              title={work.title}
              emoji={work.coverEmoji}
              earned={!!badgeAt}
              badgeAt={badgeAt}
              quizSolved={quizSolved}
              quizFirstTry={quizFirstTry}
              quizTotal={quizKeys.length}
              answered={Object.values(answers).filter((v) => v.trim()).length}
              questionTotal={work.questions.length}
              completed={completed}
              signedIn={signedIn}
              unsolvedNotes={unsolvedNotes}
              unansweredQuestions={unansweredQuestions}
              onGoNote={(k) => setOpenNote(k)}
              onGoQuestion={goToQuestion}
              onGoEnd={goToEnd}
              onReset={() => setAskReset(true)}
            />

            {work.commentary && (
              <Card as="section" className="px-6 py-6 space-y-3">
                <p className="text-sm font-bold text-fg-strong">📝 작품 해설</p>
                {work.commentary.split(/\n\n+/).map((p, i) => (
                  <p key={i} className="text-sm text-fg leading-relaxed">
                    {p}
                  </p>
                ))}
              </Card>
            )}

            {work.questions.length > 0 && (
              <Card as="section" className="px-6 py-6 space-y-4">
                <div>
                  <p className="text-sm font-bold text-fg-strong">
                    ✍️ 점검 문제 {work.questions.length}개
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    정답을 맞히는 것보다, 읽으며 생각한 것을 적어 보는 게 중요해요.
                  </p>
                </div>
                {work.questions.map((q, i) => {
                  const key = String(q.position ?? i);
                  return (
                    <div key={key} className="space-y-2 pt-2 border-t border-border first:border-0 first:pt-0">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-bold text-accent-600 shrink-0">
                          {i + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-fg-strong leading-relaxed">
                            {q.prompt}
                          </p>
                          <span className="text-[10px] font-bold text-fg-subtle">
                            {QTYPE_LABEL[q.type] ?? ""}
                          </span>
                        </div>
                      </div>
                      <textarea
                        ref={(el) => {
                          questionRefs.current[i] = el;
                        }}
                        value={answers[key] ?? ""}
                        onChange={(e) => {
                          answersDirty.current = true;
                          setAnswers((prev) => ({ ...prev, [key]: e.target.value }));
                        }}
                        placeholder="여기에 답을 적어 보세요"
                        rows={q.type === "essay" ? 5 : 2}
                        className="w-full px-3 py-2 rounded-button border border-border bg-surface text-sm text-fg-strong leading-relaxed focus:outline-none focus:border-accent-500"
                      />
                      {q.sampleAnswer && (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-semibold text-accent-600">
                            예시 답안 보기
                          </summary>
                          <p className="mt-1.5 p-3 rounded-button bg-surface-muted text-fg leading-relaxed">
                            {q.sampleAnswer}
                          </p>
                        </details>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs text-center">
                  {!signedIn ? (
                    <span className="text-fg-subtle">
                      <Link href="/login" className="text-accent-600 font-semibold">
                        로그인
                      </Link>
                      하면 답안이 자동 저장돼요.
                    </span>
                  ) : saveState === "saving" ? (
                    <span className="text-fg-muted">💾 저장 중…</span>
                  ) : saveState === "saved" ? (
                    <span className="text-cat-sci font-semibold">✓ 답안이 저장됐어요</span>
                  ) : (
                    <span className="text-fg-subtle">답을 적으면 자동으로 저장돼요.</span>
                  )}
                </p>
              </Card>
            )}
          </>
        )}
      </div>

      <div className="text-center pb-4">
        <Link
          href="/works"
          className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
        >
          ← 다른 작품 보기
        </Link>
      </div>

      {/* 형광펜 주석 시트 */}
      {openNote && annotations[openNote] && (
        <AnnotationSheet
          annotation={annotations[openNote]}
          label={openNote}
          prior={noteAnswers[openNote]}
          onClose={() => setOpenNote(null)}
          onPick={(picked) => pickNote(openNote, picked)}
          onRead={() => markRead(openNote)}
        />
      )}

      {celebrate && (
        <BadgeCelebration
          title={work.title}
          emoji={work.coverEmoji}
          onClose={() => setCelebrate(false)}
        />
      )}

      {askReset && (
        <ResetConfirm
          title={work.title}
          pending={resetting}
          onCancel={() => setAskReset(false)}
          onConfirm={() => void resetRecord()}
        />
      )}
    </div>
  );
}
