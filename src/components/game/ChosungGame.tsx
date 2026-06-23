"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import sagoData from "@/data/sago-words.json";
import definitionsData from "@/data/sago-definitions.json";
import { toChosung } from "@/lib/hangul";

interface WordEntry {
  grade: number;
  word: string;
  suffix: number | null;
  raw: string;
}
interface PoolItem {
  word: string;
  def: string;
  cho: string;
  grade: number;
}

// 뜻이 있는 2~5글자 한글 단어만 (초성 퀴즈에 적당)
const POOL: PoolItem[] = (() => {
  const defs = definitionsData.definitions as Record<
    string,
    Record<string, string>
  >;
  const out: PoolItem[] = [];
  for (const w of sagoData.words as WordEntry[]) {
    const d = defs[String(w.grade)]?.[w.raw];
    if (!d || !d.trim()) continue;
    if (!/^[가-힣]{2,5}$/.test(w.word)) continue;
    out.push({ word: w.word, def: d.trim(), cho: toChosung(w.word), grade: w.grade });
  }
  return out;
})();

const START_LIVES = 3;
type Status = "idle" | "playing" | "over";

const GRADE_LABEL: Record<number, string> = {
  1: "1급 · 쉬움",
  2: "2급 · 보통",
  3: "3급 · 어려움",
  4: "4급 · 매우 어려움",
};

/** 점수가 쌓일수록 더 높은 등급까지 출제 — 쉬운 1급부터 시작. */
function maxGradeForScore(score: number): number {
  if (score < 5) return 1;
  if (score < 12) return 2;
  if (score < 22) return 3;
  return 4;
}

function pick(exclude: string, maxGrade: number): PoolItem {
  const pool = POOL.filter((p) => p.grade <= maxGrade);
  for (let i = 0; i < 10; i++) {
    const it = pool[Math.floor(Math.random() * pool.length)];
    if (it.word !== exclude) return it;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ChosungGame() {
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState<PoolItem | null>(null);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const livesRef = useRef(START_LIVES);
  const scoreRef = useRef(0);

  function start() {
    setStatus("playing");
    setScore(0);
    scoreRef.current = 0;
    setLives(START_LIVES);
    livesRef.current = START_LIVES;
    setFeedback(null);
    setBestScore(null);
    setTyped("");
    setCurrent(pick("", 1));
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function next() {
    setTyped("");
    setFeedback(null);
    const maxGrade = maxGradeForScore(scoreRef.current);
    setCurrent((c) => pick(c?.word ?? "", maxGrade));
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function endGame() {
    setStatus("over");
    setSaving(true);
    fetch("/api/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: scoreRef.current, game_type: "chosung" }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && typeof j.bestScore === "number") setBestScore(j.bestScore);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  }

  function submit() {
    if (status !== "playing" || !current) return;
    const answer = typed.trim();
    if (!answer) return;
    if (answer === current.word) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      next();
    } else {
      livesRef.current -= 1;
      setLives(livesRef.current);
      setFeedback(`정답: ${current.word}`);
      setTyped("");
      if (livesRef.current <= 0) {
        setTimeout(endGame, 900);
      } else {
        setTimeout(next, 900);
      }
    }
  }

  // 정답을 다 입력하면 자동 제출 (글자 수 일치 + 정답이면)
  function onType(v: string) {
    setTyped(v);
    if (status === "playing" && current && v.trim() === current.word) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      next();
    }
  }

  useEffect(() => {
    if (status === "idle") return;
    // status 변화 시 input 포커스 보정
    if (status === "playing") inputRef.current?.focus();
  }, [status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold text-fg-strong">
        <span>
          점수 <span className="text-accent-600">{score}</span>
        </span>
        <span>
          생명{" "}
          <span className="text-cat-hum">
            {"♥".repeat(Math.max(0, lives))}
            {"♡".repeat(Math.max(0, START_LIVES - lives))}
          </span>
        </span>
      </div>

      <Card as="section" className="px-6 py-6 space-y-4 min-h-[280px]">
        {status === "playing" && current ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-accent-600">
                  초성을 보고 뜻에 맞는 단어를 입력하세요
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-accent-100 text-accent-700">
                  {GRADE_LABEL[current.grade] ?? `${current.grade}급`}
                </span>
              </div>
              <p
                className="font-bold text-fg-strong tracking-[0.3em]"
                style={{ fontSize: 40, lineHeight: 1.1 }}
              >
                {current.cho}
              </p>
              <p className="text-sm text-fg-strong leading-relaxed">
                {current.def}
              </p>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              placeholder="단어를 입력하고 Enter"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full h-12 px-4 rounded-button border-2 border-accent-300 bg-surface text-fg-strong text-base focus:outline-none focus:border-accent-500"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-cat-hum">{feedback ?? ""}</p>
              <button
                type="button"
                onClick={submit}
                className="h-10 px-5 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold"
              >
                확인
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center space-y-3">
            {status === "idle" ? (
              <>
                <p className="text-4xl">🔤</p>
                <h2 className="text-xl font-bold text-fg-strong">초성 퀴즈</h2>
                <p className="text-sm text-fg-muted leading-relaxed max-w-[300px] mx-auto">
                  <strong>초성</strong>과 <strong>뜻</strong>을 보고 사고도구어를
                  맞혀 보세요. 3번 틀리면 끝! 많이 맞힐수록 높은 점수예요.
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
                <p className="text-4xl">🏁</p>
                <h2 className="text-xl font-bold text-fg-strong">게임 끝!</h2>
                <p className="text-sm text-fg-muted">
                  <span className="text-2xl font-bold text-accent-600">
                    {score}
                  </span>
                  개 정답
                </p>
                {saving ? (
                  <p className="text-xs text-fg-subtle">점수 저장 중…</p>
                ) : bestScore != null ? (
                  <p className="text-xs text-fg-subtle">내 최고 기록 {bestScore}개</p>
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
        예: 초성 ‘ㄷㅊ’ + 뜻 ‘양쪽이 똑같이 마주 놓임’ → 정답 ‘대칭’
      </p>
    </div>
  );
}
