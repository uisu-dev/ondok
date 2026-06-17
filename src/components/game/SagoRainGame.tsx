"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
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
interface FallingWord {
  id: number;
  word: string;
  def: string;
  x: number; // 0~92 (%)
  y: number; // px
  speed: number; // px/s
}

// 뜻이 있는 단어만 게임 풀로 사용
const POOL: PoolItem[] = (() => {
  const defs = definitionsData.definitions as Record<
    string,
    Record<string, string>
  >;
  const out: PoolItem[] = [];
  for (const w of sagoData.words as WordEntry[]) {
    const d = defs[String(w.grade)]?.[w.raw];
    if (d && d.trim().length > 0) out.push({ word: w.word, def: d.trim() });
  }
  return out;
})();

const FIELD_HEIGHT = 440;
const MAX_WORDS = 7;
const START_LIVES = 3;

type Status = "idle" | "playing" | "over";

function pickPoolItem(exclude: Set<string>): PoolItem {
  for (let i = 0; i < 12; i++) {
    const it = POOL[Math.floor(Math.random() * POOL.length)];
    if (!exclude.has(it.word)) return it;
  }
  return POOL[Math.floor(Math.random() * POOL.length)];
}

export function SagoRainGame() {
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const stateRef = useRef({
    words: [] as FallingWord[],
    targetId: null as number | null,
    score: 0,
    lives: START_LIVES,
    elapsed: 0,
    spawnTimer: 0,
    nextId: 1,
    status: "idle" as Status,
  });
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  // 게임 루프
  useEffect(() => {
    function spawn(s: typeof stateRef.current, fallSpeed: number) {
      const exclude = new Set(s.words.map((w) => w.word));
      const it = pickPoolItem(exclude);
      s.words.push({
        id: s.nextId++,
        word: it.word,
        def: it.def,
        x: 4 + Math.random() * 84,
        y: 0,
        speed: fallSpeed * (0.85 + Math.random() * 0.3),
      });
    }

    function endGame(s: typeof stateRef.current) {
      s.status = "over";
      const finalScore = s.score;
      forceRender();
      // 점수 저장 (로그인 사용자만 서버에 기록됨)
      setSaving(true);
      fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: finalScore }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && typeof j.bestScore === "number") setBestScore(j.bestScore);
        })
        .catch(() => {})
        .finally(() => setSaving(false));
    }

    function loop(now: number) {
      const s = stateRef.current;
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;

      if (s.status === "playing") {
        s.elapsed += dt;
        const fallSpeed = 42 + s.elapsed * 2.6;
        const spawnInterval = Math.max(0.7, 2.2 - s.elapsed * 0.045);

        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0 && s.words.length < MAX_WORDS) {
          s.spawnTimer = spawnInterval;
          spawn(s, fallSpeed);
        }

        for (const w of s.words) w.y += w.speed * dt;

        const survivors: FallingWord[] = [];
        for (const w of s.words) {
          if (w.y >= FIELD_HEIGHT - 28) {
            s.lives -= 1;
            if (s.targetId === w.id) s.targetId = null;
          } else {
            survivors.push(w);
          }
        }
        s.words = survivors;

        if (s.targetId == null && s.words.length > 0) {
          s.targetId = s.words[Math.floor(Math.random() * s.words.length)].id;
        }
        if (s.lives <= 0) {
          endGame(s);
        }
        forceRender();
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startGame() {
    const s = stateRef.current;
    s.words = [];
    s.targetId = null;
    s.score = 0;
    s.lives = START_LIVES;
    s.elapsed = 0;
    s.spawnTimer = 0;
    s.status = "playing";
    setBestScore(null);
    lastRef.current = performance.now();
    forceRender();
  }

  function clickWord(id: number) {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    if (id === s.targetId) {
      s.words = s.words.filter((w) => w.id !== id);
      s.score += 1;
      s.targetId = s.words.length
        ? s.words[Math.floor(Math.random() * s.words.length)].id
        : null;
      forceRender();
    }
    // 오답 클릭은 무시 (제거되지 않음)
  }

  const s = stateRef.current;
  const target = s.words.find((w) => w.id === s.targetId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-fg-strong">
            제거 <span className="text-accent-600">{s.score}</span>
          </span>
          <span className="text-sm font-bold text-fg-strong">
            생명{" "}
            <span className="text-cat-hum">
              {"♥".repeat(Math.max(0, s.lives))}
              {"♡".repeat(Math.max(0, START_LIVES - s.lives))}
            </span>
          </span>
        </div>
        <Link
          href="/sago/learn"
          className="text-xs font-semibold text-fg-muted hover:text-fg-strong"
        >
          학습 모드 →
        </Link>
      </div>

      {/* 게임 필드 */}
      <Card
        as="section"
        className="relative overflow-hidden p-0"
        style={{
          height: FIELD_HEIGHT,
          background:
            "linear-gradient(to bottom, #dbeafe 0%, #eff6ff 60%, #dcfce7 100%)",
        }}
      >
        {/* 떨어지는 단어 */}
        {s.status === "playing" &&
          s.words.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => clickWord(w.id)}
              style={{ position: "absolute", left: `${w.x}%`, top: w.y }}
              className="px-3 py-1.5 rounded-button bg-white border-2 border-accent-200 text-fg-strong font-bold text-sm shadow-sm hover:border-accent-400 active:scale-95 transition-transform"
            >
              {w.word}
            </button>
          ))}

        {/* 바닥선 */}
        <div className="absolute left-0 right-0 bottom-0 h-7 bg-[color-mix(in_oklab,var(--color-cat-sci)_22%,white)] border-t-2 border-[var(--color-cat-sci)]" />

        {/* 시작 / 게임오버 오버레이 */}
        {s.status !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="text-center space-y-3 px-6">
              {s.status === "idle" ? (
                <>
                  <p className="text-4xl">🌧️</p>
                  <h2 className="text-xl font-bold text-fg-strong">
                    사고도구어 산성비
                  </h2>
                  <p className="text-sm text-fg-muted leading-relaxed max-w-[280px] mx-auto">
                    아래에 나오는 <strong>뜻</strong>을 보고, 하늘에서 떨어지는 단어
                    중 맞는 것을 클릭해 없애세요. 단어가 땅에 닿으면 생명이 줄어요!
                  </p>
                  <button
                    type="button"
                    onClick={startGame}
                    className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold"
                  >
                    게임 시작
                  </button>
                </>
              ) : (
                <>
                  <p className="text-4xl">🏁</p>
                  <h2 className="text-xl font-bold text-fg-strong">게임 끝!</h2>
                  <p className="text-sm text-fg-muted">
                    이번 점수{" "}
                    <span className="text-2xl font-bold text-accent-600">
                      {s.score}
                    </span>{" "}
                    개 제거
                  </p>
                  {saving ? (
                    <p className="text-xs text-fg-subtle">점수 저장 중…</p>
                  ) : bestScore != null ? (
                    <p className="text-xs text-fg-subtle">
                      내 최고 기록 {bestScore}개
                    </p>
                  ) : (
                    <p className="text-xs text-fg-subtle">
                      로그인하면 랭킹에 기록돼요.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={startGame}
                    className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold"
                  >
                    다시 도전
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* 목표 뜻 */}
      <Card as="section" className="px-5 py-4 min-h-[72px] flex items-center">
        {s.status === "playing" && target ? (
          <div>
            <p className="text-[11px] font-bold text-accent-600 mb-0.5">
              이 뜻의 단어를 찾아 클릭하세요
            </p>
            <p className="text-sm text-fg-strong leading-snug">{target.def}</p>
          </div>
        ) : (
          <p className="text-sm text-fg-subtle">
            게임을 시작하면 여기에 단어의 뜻이 표시돼요.
          </p>
        )}
      </Card>
    </div>
  );
}
