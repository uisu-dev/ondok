"use client";

import { useEffect, useReducer, useRef, useState } from "react";
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
  grade: number;
}

const POOL: PoolItem[] = (() => {
  const defs = definitionsData.definitions as Record<
    string,
    Record<string, string>
  >;
  const out: PoolItem[] = [];
  for (const w of sagoData.words as WordEntry[]) {
    const d = defs[String(w.grade)]?.[w.raw];
    if (d && d.trim().length > 0 && d.trim().length <= 45) {
      out.push({ word: w.word, def: d.trim(), grade: w.grade });
    }
  }
  return out;
})();

const MAX_HP = 100;
const DAMAGE: Record<number, number> = { 1: 8, 2: 12, 3: 16, 4: 20 };
const BOT_HIT = 10; // 봇 공격 데미지
const BOT_INTERVAL = 3.5; // 봇 공격 간격(초)

type Status = "idle" | "playing" | "win" | "lose";

interface Question {
  correct: PoolItem;
  options: PoolItem[];
}

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function buildQuestion(): Question {
  const correct = POOL[Math.floor(Math.random() * POOL.length)];
  const same = POOL.filter(
    (p) => p.grade === correct.grade && p.word !== correct.word
  );
  let distractors = shuffle(same).slice(0, 3);
  if (distractors.length < 3) {
    const others = POOL.filter(
      (p) => p.word !== correct.word && !distractors.includes(p)
    );
    distractors = [...distractors, ...shuffle(others).slice(0, 3 - distractors.length)];
  }
  return { correct, options: shuffle([correct, ...distractors]) };
}

export function BattleGame() {
  const [, forceRender] = useReducer((x) => x + 1, 0);
  const [status, setStatus] = useState<Status>("idle");
  const [myHp, setMyHp] = useState(MAX_HP);
  const [botHp, setBotHp] = useState(MAX_HP);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<PoolItem | null>(null);
  const [flash, setFlash] = useState<"me" | "bot" | null>(null);
  const [saving, setSaving] = useState(false);
  const [myWins, setMyWins] = useState<number | null>(null);

  // 내 누적 승수 불러오기
  useEffect(() => {
    fetch("/api/game/score?game_type=battle", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.signedIn) setMyWins(j.wins ?? 0);
      })
      .catch(() => {});
  }, []);

  const myHpRef = useRef(MAX_HP);
  const botHpRef = useRef(MAX_HP);
  const statusRef = useRef<Status>("idle");
  const botTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopBot() {
    if (botTimerRef.current) {
      clearInterval(botTimerRef.current);
      botTimerRef.current = null;
    }
  }

  function endGame(result: "win" | "lose") {
    stopBot();
    statusRef.current = result;
    setStatus(result);
    if (result === "win") {
      setSaving(true);
      setMyWins((w) => (w ?? 0) + 1); // 낙관적 반영
      fetch("/api/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: 1, game_type: "battle" }),
      })
        .catch(() => {})
        .finally(() => setSaving(false));
    }
  }

  function start() {
    myHpRef.current = MAX_HP;
    botHpRef.current = MAX_HP;
    statusRef.current = "playing";
    setMyHp(MAX_HP);
    setBotHp(MAX_HP);
    setStatus("playing");
    setPicked(null);
    setQuestion(buildQuestion());
    stopBot();
    botTimerRef.current = setInterval(() => {
      if (statusRef.current !== "playing") return;
      myHpRef.current = Math.max(0, myHpRef.current - BOT_HIT);
      setMyHp(myHpRef.current);
      setFlash("me");
      setTimeout(() => setFlash(null), 250);
      if (myHpRef.current <= 0) endGame("lose");
    }, BOT_INTERVAL * 1000);
  }

  useEffect(() => () => stopBot(), []);

  function pick(opt: PoolItem) {
    if (statusRef.current !== "playing" || picked) return;
    setPicked(opt);
    const q = question!;
    const right = opt.word === q.correct.word;
    if (right) {
      const dmg = DAMAGE[q.correct.grade] ?? 10;
      botHpRef.current = Math.max(0, botHpRef.current - dmg);
      setBotHp(botHpRef.current);
      setFlash("bot");
      setTimeout(() => setFlash(null), 250);
      if (botHpRef.current <= 0) {
        endGame("win");
        return;
      }
    }
    // 정답이든 오답이든 다음 문제로
    setTimeout(() => {
      if (statusRef.current !== "playing") return;
      setPicked(null);
      setQuestion(buildQuestion());
      forceRender();
    }, 500);
  }

  const hpBar = (hp: number, color: string) => (
    <div className="h-2.5 w-full rounded-full bg-surface-muted overflow-hidden">
      <div
        className="h-full transition-all duration-300"
        style={{ width: `${hp}%`, background: color }}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 내 누적 승수 */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-chip bg-cat-soc/15 text-cat-soc text-sm font-bold">
          🏆 내 승수 {myWins ?? 0}승
        </span>
      </div>

      {/* 캐릭터 + 체력 */}
      <Card as="section" className="px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-3xl ${flash === "me" ? "animate-pulse" : ""}`}
                style={flash === "me" ? { filter: "drop-shadow(0 0 6px #ef4444)" } : {}}
              >
                🐰
              </span>
              <span className="text-xs font-bold text-fg-strong">나</span>
            </div>
            {hpBar(myHp, "var(--color-cat-sci)")}
            <p className="text-[11px] font-bold text-fg-muted">{myHp} / {MAX_HP}</p>
          </div>
          <span className="text-lg font-black text-fg-subtle pb-6">VS</span>
          <div className="flex-1 space-y-1.5 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs font-bold text-fg-strong">사고몬</span>
              <span
                className={`text-3xl ${flash === "bot" ? "animate-pulse" : ""}`}
                style={flash === "bot" ? { filter: "drop-shadow(0 0 6px #f59e0b)" } : {}}
              >
                👾
              </span>
            </div>
            {hpBar(botHp, "var(--color-cat-soc)")}
            <p className="text-[11px] font-bold text-fg-muted">{botHp} / {MAX_HP}</p>
          </div>
        </div>
      </Card>

      {/* 퀴즈 / 결과 */}
      <Card as="section" className="px-5 py-5 min-h-[260px]">
        {status === "playing" && question ? (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-accent-600 mb-1">
                뜻에 맞는 단어를 골라 공격!{" "}
                <span className="text-cat-soc">
                  ({question.correct.grade}급 · {DAMAGE[question.correct.grade]}뎀)
                </span>
              </p>
              <p className="text-sm text-fg-strong leading-relaxed" style={{ color: "#000" }}>
                {question.correct.def}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {question.options.map((opt, i) => {
                const isPicked = picked?.word === opt.word;
                const isCorrect = opt.word === question.correct.word;
                let cls = "border-border bg-surface text-fg-strong hover:border-accent-300";
                if (picked) {
                  if (isCorrect) cls = "border-[var(--color-cat-sci)] bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-[var(--color-cat-sci)]";
                  else if (isPicked) cls = "border-[var(--color-cat-hum)] bg-[color-mix(in_oklab,var(--color-cat-hum)_10%,white)] text-[var(--color-cat-hum)]";
                  else cls = "border-border bg-surface text-fg-subtle";
                }
                return (
                  <button
                    key={`${opt.word}-${i}`}
                    type="button"
                    onClick={() => pick(opt)}
                    disabled={!!picked}
                    className={`min-h-[52px] rounded-button border-2 font-bold px-2 py-2 text-base transition-colors ${cls}`}
                  >
                    {opt.word}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            {status === "idle" && (
              <>
                <p className="text-4xl">⚔️</p>
                <h2 className="text-xl font-bold text-fg-strong">사고도구어 배틀</h2>
                <p className="text-sm text-fg-muted leading-relaxed max-w-[300px] mx-auto">
                  뜻에 맞는 단어를 맞히면 <strong>사고몬</strong>을 공격해요! 높은 급수일수록
                  데미지가 커요. 사고몬도 계속 공격하니 서두르세요. 이기면 <strong>승수</strong>가
                  쌓입니다.
                </p>
                <button type="button" onClick={start} className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold">
                  대결 시작
                </button>
              </>
            )}
            {status === "win" && (
              <>
                <p className="text-4xl">🎉</p>
                <h2 className="text-xl font-bold text-cat-sci">승리!</h2>
                <p className="text-sm text-fg-muted">
                  사고몬을 물리쳤어요. {saving ? "승수 저장 중…" : "승수 +1 기록됨"}
                </p>
                <p className="text-sm font-bold text-cat-soc">
                  🏆 현재 {myWins ?? 0}승
                </p>
                <button type="button" onClick={start} className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold">
                  다시 도전
                </button>
              </>
            )}
            {status === "lose" && (
              <>
                <p className="text-4xl">💥</p>
                <h2 className="text-xl font-bold text-cat-hum">패배…</h2>
                <p className="text-sm text-fg-muted">
                  아쉽지만 다음엔 이길 수 있어요! (패배는 기록되지 않아요)
                </p>
                <button type="button" onClick={start} className="h-11 px-6 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold">
                  다시 도전
                </button>
              </>
            )}
          </div>
        )}
      </Card>

      <p className="text-xs text-fg-subtle text-center">
        급수별 데미지 — 1급 8 · 2급 12 · 3급 16 · 4급 20 · 사고몬은 {BOT_INTERVAL}초마다 {BOT_HIT} 공격
      </p>
    </div>
  );
}
