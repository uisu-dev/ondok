"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import sagoData from "@/data/sago-words.json";
import definitionsData from "@/data/sago-definitions.json";

interface WordEntry {
  grade: number;
  word: string;
  suffix: number | null;
  raw: string;
}
interface PoolItem {
  word: string;
  def: string;
}

// 뜻이 있고 카드에 담기 적당한 길이의 단어만 사용
const POOL: PoolItem[] = (() => {
  const defs = definitionsData.definitions as Record<
    string,
    Record<string, string>
  >;
  const out: PoolItem[] = [];
  for (const w of sagoData.words as WordEntry[]) {
    const d = defs[String(w.grade)]?.[w.raw];
    if (d && d.trim().length > 0 && d.trim().length <= 45) {
      out.push({ word: w.word, def: d.trim() });
    }
  }
  return out;
})();

const PAIRS = 6; // 6쌍 = 12장 (3열 × 4행)

type Status = "idle" | "playing" | "over";

interface CardT {
  uid: string;
  pairId: number;
  type: "word" | "def";
  content: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBoard(): CardT[] {
  const picks = shuffle(POOL).slice(0, PAIRS);
  const cards: CardT[] = [];
  picks.forEach((p, i) => {
    cards.push({ uid: `w${i}`, pairId: i, type: "word", content: p.word });
    cards.push({ uid: `d${i}`, pairId: i, type: "def", content: p.def });
  });
  return shuffle(cards);
}

export function SagoMatchGame() {
  const [board, setBoard] = useState<CardT[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [fails, setFails] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const startRef = useRef(0);
  const failsRef = useRef(0);
  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    setBoard(buildBoard());
    setFlipped([]);
    setMatched(new Set());
    setFails(0);
    failsRef.current = 0;
    setElapsed(0);
    setFinalScore(0);
    setBestScore(null);
    setStatus("playing");
    startRef.current = Date.now();
  }

  // 경과 시간 표시
  useEffect(() => {
    if (status !== "playing") return;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  function endGame(matchedSet: Set<number>) {
    const t = Math.floor((Date.now() - startRef.current) / 1000);
    const score = Math.max(50, 1000 - t * 3 - failsRef.current * 25);
    setFinalScore(score);
    setStatus("over");
    setSaving(true);
    fetch("/api/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && typeof j.bestScore === "number") setBestScore(j.bestScore);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  }

  function flipCard(card: CardT) {
    if (lockRef.current || status !== "playing") return;
    if (flipped.includes(card.uid) || matched.has(card.pairId)) return;

    if (flipped.length === 0) {
      setFlipped([card.uid]);
      return;
    }
    if (flipped.length === 1) {
      const first = board.find((c) => c.uid === flipped[0]);
      if (!first) return;
      setFlipped([flipped[0], card.uid]);
      if (first.pairId === card.pairId && first.uid !== card.uid) {
        // 매칭 성공
        lockRef.current = true;
        setTimeout(() => {
          const nm = new Set(matched);
          nm.add(card.pairId);
          setMatched(nm);
          setFlipped([]);
          lockRef.current = false;
          if (nm.size === PAIRS) endGame(nm);
        }, 350);
      } else {
        // 실패 — 잠시 보여주고 다시 뒤집기
        setFails((f) => f + 1);
        failsRef.current += 1;
        lockRef.current = true;
        setTimeout(() => {
          setFlipped([]);
          lockRef.current = false;
        }, 800);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold text-fg-strong">
        <span>
          맞춘 짝 <span className="text-accent-600">{matched.size}</span> / {PAIRS}
        </span>
        <span className="flex items-center gap-3">
          <span>⏱ {elapsed}초</span>
          <span>
            실패 <span className="text-cat-hum">{fails}</span>
          </span>
        </span>
      </div>

      <Card as="section" className="relative px-4 py-4">
        {status === "playing" ? (
          <div className="grid grid-cols-3 gap-2.5">
            {board.map((c) => {
              const isUp = flipped.includes(c.uid) || matched.has(c.pairId);
              const isMatched = matched.has(c.pairId);
              return (
                <button
                  key={c.uid}
                  type="button"
                  onClick={() => flipCard(c)}
                  className={`h-24 rounded-button border-2 px-1.5 flex items-center justify-center text-center transition-all ${
                    isMatched
                      ? "bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] border-[var(--color-cat-sci)] opacity-70"
                      : isUp
                        ? "bg-surface border-accent-400"
                        : "bg-accent-600 border-accent-700 active:scale-95"
                  }`}
                >
                  {isUp ? (
                    c.type === "word" ? (
                      <span className="text-base font-bold text-fg-strong">
                        {c.content}
                      </span>
                    ) : (
                      <span className="text-[11px] leading-tight text-fg-strong line-clamp-4">
                        {c.content}
                      </span>
                    )
                  ) : (
                    <span className="text-2xl text-white/90">📘</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            {status === "idle" ? (
              <>
                <p className="text-4xl">🃏</p>
                <h2 className="text-xl font-bold text-fg-strong">
                  사고도구어 짝 맞추기
                </h2>
                <p className="text-sm text-fg-muted leading-relaxed max-w-[300px] mx-auto">
                  카드를 뒤집어 <strong>단어</strong>와 그 <strong>뜻</strong>을 짝지어
                  보세요. 빠르고 실수 없이 맞출수록 높은 점수예요!
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold"
                >
                  게임 시작
                </button>
              </>
            ) : (
              <>
                <p className="text-4xl">🎉</p>
                <h2 className="text-xl font-bold text-fg-strong">모두 맞췄어요!</h2>
                <p className="text-sm text-fg-muted">
                  {elapsed}초 · 실패 {fails}회 ·{" "}
                  <span className="text-2xl font-bold text-accent-600">
                    {finalScore}
                  </span>
                  점
                </p>
                {saving ? (
                  <p className="text-xs text-fg-subtle">점수 저장 중…</p>
                ) : bestScore != null ? (
                  <p className="text-xs text-fg-subtle">내 최고 기록 {bestScore}점</p>
                ) : (
                  <p className="text-xs text-fg-subtle">로그인하면 랭킹에 기록돼요.</p>
                )}
                <button
                  type="button"
                  onClick={start}
                  className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold"
                >
                  다시 도전
                </button>
              </>
            )}
          </div>
        )}
      </Card>

      <p className="text-xs text-fg-subtle text-center">
        단어 카드와 뜻 카드를 짝지으면 사라져요. 적은 실패·빠른 시간이 높은 점수!
      </p>
    </div>
  );
}
