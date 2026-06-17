"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import sagoData from "@/data/sago-words.json";
import definitionsData from "@/data/sago-definitions.json";

type Grade = 1 | 2 | 3 | 4;
type GradeFilter = "all" | Grade;

interface WordEntry {
  grade: number;
  word: string;
  suffix: number | null;
  raw: string;
}

const STORAGE_KEY = "ondok:sago-known";

const ALL_DEFS = definitionsData.definitions as Record<
  string,
  Record<string, string>
>;
const ALL_WORDS = sagoData.words as WordEntry[];
const TOTAL_BY_GRADE: Record<Grade, number> = { 1: 43, 2: 293, 3: 585, 4: 466 };

function keyOf(w: WordEntry): string {
  return `${w.grade}.${w.raw}`;
}

function getDefOf(w: WordEntry): string {
  return (ALL_DEFS[String(w.grade)] ?? {})[w.raw] ?? "";
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizQuestion {
  correct: WordEntry;
  definition: string;
  options: WordEntry[]; // 4개 (정답 포함), 섞인 상태
}

function buildQuestion(pool: WordEntry[]): QuizQuestion | null {
  const usable = pool.filter((w) => getDefOf(w).trim().length > 0);
  if (usable.length === 0) return null;
  const correct = usable[Math.floor(Math.random() * usable.length)];
  // 같은 등급에서 distractor 3개. 부족하면 어떤 등급이든 사용.
  const sameGrade = ALL_WORDS.filter(
    (w) => w.grade === correct.grade && keyOf(w) !== keyOf(correct)
  );
  let distractors = shuffle(sameGrade).slice(0, 3);
  if (distractors.length < 3) {
    const others = ALL_WORDS.filter(
      (w) =>
        keyOf(w) !== keyOf(correct) &&
        !distractors.some((d) => keyOf(d) === keyOf(w))
    );
    distractors = [
      ...distractors,
      ...shuffle(others).slice(0, 3 - distractors.length),
    ];
  }
  return {
    correct,
    definition: getDefOf(correct),
    options: shuffle([correct, ...distractors]),
  };
}

export default function SagoLearnPage() {
  const [known, setKnown] = useState<Record<string, boolean>>({});
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [excludeKnown, setExcludeKnown] = useState(true);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<WordEntry | null>(null);
  const [streak, setStreak] = useState({ correct: 0, total: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // 진도 로드.
  //  - 로그인 사용자: DB 가 단일 소스. localStorage 를 읽지도 쓰지도 않는다.
  //    (같은 브라우저에서 계정을 바꿔도 앞 계정 기록이 섞이지 않도록)
  //  - 비로그인(게스트): localStorage 만 사용.
  useEffect(() => {
    (async () => {
      let isSignedIn = false;
      let dbKeys: string[] = [];
      try {
        const res = await fetch("/api/sago/progress", { cache: "no-store" });
        const json = await res.json();
        if (json.ok && json.signedIn) {
          isSignedIn = true;
          dbKeys = json.keys ?? [];
        }
      } catch {
        /* 오프라인/미설정 → 게스트 취급 */
      }

      if (isSignedIn) {
        setSignedIn(true);
        const m: Record<string, boolean> = {};
        for (const k of dbKeys) m[k] = true;
        setKnown(m);
      } else {
        setSignedIn(false);
        let local: Record<string, boolean> = {};
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) local = JSON.parse(raw);
        } catch {
          /* ignore */
        }
        setKnown(local);
      }
      setHydrated(true);
    })();
  }, []);

  // 게스트만 localStorage 에 캐시. 로그인 사용자는 DB 가 단일 소스라 저장 안 함.
  useEffect(() => {
    if (!hydrated || signedIn) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(known));
    } catch {
      /* ignore quota */
    }
  }, [known, hydrated, signedIn]);

  // 출제 풀
  const pool = useMemo(() => {
    let p = ALL_WORDS;
    if (gradeFilter !== "all") p = p.filter((w) => w.grade === gradeFilter);
    if (excludeKnown) p = p.filter((w) => !known[keyOf(w)]);
    return p;
  }, [gradeFilter, excludeKnown, known]);

  const nextQuestion = useCallback(() => {
    setSelected(null);
    setQuestion(buildQuestion(pool));
  }, [pool]);

  // hydration 직후 & 필터 변경 시 새 문제 생성
  useEffect(() => {
    if (!hydrated) return;
    setSelected(null);
    setQuestion(buildQuestion(pool));
    // streak 은 필터가 바뀌어도 유지 (한 세션 누적 점수 느낌)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, gradeFilter, excludeKnown]);

  function handleSelect(w: WordEntry) {
    if (selected || !question) return;
    setSelected(w);
    const right = keyOf(w) === keyOf(question.correct);
    setStreak((s) => ({
      correct: s.correct + (right ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function toggleKnown(w: WordEntry) {
    const k = keyOf(w);
    const wasKnown = !!known[k];
    setKnown((prev) => {
      const next = { ...prev };
      if (wasKnown) delete next[k];
      else next[k] = true;
      return next;
    });
    if (signedIn) {
      fetch("/api/sago/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wasKnown ? { remove: [k] } : { add: [k] }),
      }).catch(() => {});
    }
  }

  function resetAll() {
    if (
      !confirm("학습 기록 전체를 초기화할까요? 되돌릴 수 없어요.")
    )
      return;
    setKnown({});
    setStreak({ correct: 0, total: 0 });
    if (signedIn) {
      fetch("/api/sago/progress", { method: "DELETE" }).catch(() => {});
    }
  }

  // 통계
  const stats = useMemo(() => {
    const byGrade: Record<Grade, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const w of ALL_WORDS) {
      if (known[keyOf(w)]) byGrade[w.grade as Grade]++;
    }
    const total = byGrade[1] + byGrade[2] + byGrade[3] + byGrade[4];
    return { byGrade, total };
  }, [known]);

  const totalAll = ALL_WORDS.length;
  const pct = totalAll > 0 ? Math.round((stats.total / totalAll) * 100) : 0;
  const isCorrect =
    !!selected && !!question && keyOf(selected) === keyOf(question.correct);

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-5">
        <div className="text-xs font-semibold text-fg-muted space-x-2">
          <Link href="/" className="hover:text-fg-strong">
            홈
          </Link>
          <span>·</span>
          <Link href="/sago" className="hover:text-fg-strong">
            ← 사고도구어 사전
          </Link>
        </div>

        {/* Progress */}
        <Card as="section" className="px-6 py-6 space-y-3">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-accent-600">
              🎯 사고도구어 학습
            </p>
            <p className="text-xs text-fg-muted">
              학습 진행도{" "}
              <strong className="text-fg-strong">
                {stats.total} / {totalAll}
              </strong>{" "}
              ({pct}%)
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full bg-accent-500 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[11px] text-fg-muted">
            {([1, 2, 3, 4] as Grade[]).map((g) => {
              const denom = TOTAL_BY_GRADE[g];
              const num = stats.byGrade[g];
              const gp = denom > 0 ? Math.round((num / denom) * 100) : 0;
              return (
                <div key={g} className="text-center">
                  <p className="font-semibold text-fg-strong">{g}급</p>
                  <p>
                    {num} / {denom}
                  </p>
                  <p className="text-[10px] text-fg-subtle">{gp}%</p>
                </div>
              );
            })}
          </div>
          {streak.total > 0 && (
            <p className="text-xs text-fg-subtle text-center pt-1">
              이번 세션 정답률{" "}
              <strong className="text-fg-strong">
                {Math.round((streak.correct / streak.total) * 100)}%
              </strong>{" "}
              ({streak.correct} / {streak.total})
            </p>
          )}
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-fg-muted">등급</span>
          {(["all", 1, 2, 3, 4] as GradeFilter[]).map((g) => {
            const active = gradeFilter === g;
            return (
              <button
                key={String(g)}
                onClick={() => setGradeFilter(g)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-chip border transition-colors ${
                  active
                    ? "border-accent-500 bg-accent-50 text-accent-700"
                    : "border-border bg-surface text-fg-muted hover:border-accent-300"
                }`}
              >
                {g === "all" ? "전체" : `${g}급`}
              </button>
            );
          })}
          <label className="ml-auto inline-flex items-center gap-1 text-xs text-fg-muted cursor-pointer">
            <input
              type="checkbox"
              checked={excludeKnown}
              onChange={(e) => setExcludeKnown(e.target.checked)}
            />
            아는 단어 제외
          </label>
        </div>

        {/* Quiz */}
        {question ? (
          <Card as="section" className="px-6 py-7 space-y-4">
            <p className="text-xs font-bold text-accent-600">
              📖 다음 뜻에 해당하는 단어는?
            </p>
            <p
              className="text-base leading-relaxed"
              style={{ color: "#000" }}
            >
              {question.definition}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {question.options.map((opt, i) => {
                const sel = selected && keyOf(selected) === keyOf(opt);
                const isCorrectOpt =
                  keyOf(opt) === keyOf(question.correct);
                let cls =
                  "border-border bg-surface text-fg-strong hover:border-accent-300";
                if (selected !== null) {
                  if (isCorrectOpt) {
                    cls =
                      "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-[var(--color-cat-sci)]";
                  } else if (sel) {
                    cls =
                      "border-[var(--color-cat-hum)] bg-[color-mix(in_oklab,var(--color-cat-hum)_10%,white)] text-[var(--color-cat-hum)]";
                  } else {
                    cls = "border-border bg-surface text-fg-subtle";
                  }
                }
                return (
                  <button
                    key={`${opt.grade}-${opt.raw}-${i}`}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    disabled={selected !== null}
                    className={`min-h-[60px] rounded-button border-2 font-semibold px-3 py-2 transition-colors ${cls}`}
                  >
                    <span className="text-base">{opt.word}</span>
                    {opt.suffix !== null && (
                      <span className="text-xs ml-1 font-normal opacity-70">
                        ({opt.suffix})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selected !== null ? (
              <div className="space-y-3 pt-1">
                {isCorrect ? (
                  <p className="text-sm font-bold text-[var(--color-cat-sci)]">
                    ✓ 정답!
                  </p>
                ) : (
                  <p className="text-sm font-bold text-[var(--color-cat-hum)]">
                    ✕ 오답 — 정답: {question.correct.word}
                    {question.correct.suffix !== null && (
                      <span className="text-xs ml-0.5 font-normal opacity-70">
                        ({question.correct.suffix})
                      </span>
                    )}
                  </p>
                )}
                {/* 정답을 맞힌 경우에만 '아는 단어' 저장 가능 (틀린 단어 자가 체크 방지) */}
                {isCorrect ? (
                  <button
                    type="button"
                    onClick={() => toggleKnown(question.correct)}
                    className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-button border-2 font-bold text-sm transition-colors ${
                      known[keyOf(question.correct)]
                        ? "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_16%,white)] text-[var(--color-cat-sci)]"
                        : "border-accent-400 bg-accent-50 text-accent-700 hover:bg-accent-100"
                    }`}
                  >
                    {known[keyOf(question.correct)]
                      ? `✓ ‘${question.correct.word}’ 아는 단어로 저장됨 (눌러서 취소)`
                      : `⭐ ‘${question.correct.word}’를 아는 단어로 저장`}
                  </button>
                ) : (
                  <p className="text-xs text-fg-subtle text-center">
                    정답을 맞힌 단어만 ‘아는 단어’로 저장할 수 있어요.
                  </p>
                )}
                <Button onClick={nextQuestion} className="w-full">
                  다음 문제 →
                </Button>
              </div>
            ) : (
              <div className="pt-1 text-center">
                <button
                  onClick={nextQuestion}
                  className="text-xs text-fg-muted hover:text-fg-strong"
                >
                  건너뛰기 →
                </button>
              </div>
            )}
          </Card>
        ) : (
          <Card as="section" className="px-6 py-12 text-center space-y-3">
            <p className="text-4xl">🎉</p>
            <p className="text-base font-bold text-fg-strong">
              현재 조건에 맞는 단어를 다 학습했어요!
            </p>
            <p className="text-sm text-fg-muted">
              등급 필터를 바꾸거나 ‘아는 단어 제외’를 꺼서 복습해 보세요.
            </p>
            <div className="pt-2">
              <Link
                href="/sago"
                className="text-sm font-semibold text-accent-600 hover:text-accent-700"
              >
                ← 사전으로 돌아가기
              </Link>
            </div>
          </Card>
        )}

        <div className="text-center pt-2">
          <button
            onClick={resetAll}
            className="text-xs text-fg-subtle hover:text-cat-hum"
          >
            학습 기록 초기화
          </button>
        </div>

        <p className="text-xs text-fg-subtle text-center leading-relaxed">
          {signedIn
            ? "✓ 로그인된 계정에 학습 기록이 자동 저장돼요."
            : "※ 현재 브라우저에만 저장돼요. "}
          {!signedIn && (
            <Link href="/login?next=/sago/learn" className="text-accent-600 font-semibold">
              로그인
            </Link>
          )}
          {!signedIn && " 하면 모든 기기에서 진도가 동기화돼요."}
        </p>
      </div>
    </main>
  );
}
