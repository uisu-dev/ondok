"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";
import sagoData from "@/data/sago-words.json";
import definitionsData from "@/data/sago-definitions.json";

type Grade = 1 | 2 | 3 | 4;

interface WordEntry {
  grade: number;
  word: string;
  suffix: number | null;
  raw: string;
}

const GRADE_INFO: Record<Grade, { label: string; subtitle: string; description: string }> = {
  1: {
    label: "1급",
    subtitle: "초등 1~4학년군",
    description: "구체적 사고를 표상하는 어휘 중심. 가장 기본이 되는 사고도구어들.",
  },
  2: {
    label: "2급",
    subtitle: "초등 5~6학년군",
    description: "추상적 어휘 비중이 늘어나는 단계. 구체적 조작기 후반.",
  },
  3: {
    label: "3급",
    subtitle: "중학교",
    description: "추상적 사고도구어가 급증. 추상적 조작기 초반.",
  },
  4: {
    label: "4급",
    subtitle: "고등학교군",
    description: "매우 추상적인 사고도구어 중심. 추상적 조작기 안정기.",
  },
};

export default function SagoPage() {
  const [grade, setGrade] = useState<Grade>(1);
  const [query, setQuery] = useState("");

  const allWords = sagoData.words as WordEntry[];
  const definitions = (
    definitionsData.definitions as Record<string, Record<string, string>>
  )[String(grade)] ?? {};

  const wordsOfGrade = useMemo(
    () => allWords.filter((w) => w.grade === grade),
    [allWords, grade]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return wordsOfGrade;
    return wordsOfGrade.filter(
      (w) =>
        w.word.includes(q) ||
        (definitions[w.raw] ?? "").includes(q)
    );
  }, [wordsOfGrade, query, definitions]);

  const definedCount = useMemo(
    () =>
      wordsOfGrade.filter((w) => (definitions[w.raw] ?? "").trim()).length,
    [wordsOfGrade, definitions]
  );

  const info = GRADE_INFO[grade];

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-8 space-y-6">
        {/* Back link */}
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>

        {/* Intro */}
        <Card as="section" className="px-6 py-7 space-y-3">
          <p className="text-sm font-semibold text-accent-600">
            한국어 사고도구어 1,387개
          </p>
          <h1 className="text-2xl font-bold text-fg-strong leading-snug">
            사고도구어란?
          </h1>
          <p className="text-sm text-fg leading-relaxed">
            사고 및 논리 전개 과정을 담당하는 단어로, 주요 내용을 파악하고
            이해하는 <span className="font-semibold">언어 능력(의사소통)</span>
            의 기반이 되는 단어들을 말해요.
          </p>
          <p className="text-sm text-fg-muted leading-relaxed">
            충청남도교육청은 초·중·고 교과서 361권의 어휘를 빅데이터로 분석해
            사고도구어 1,387개를 추출하고, 학년 발달 단계에 따라 4개 등급으로
            나누었어요. 등급 탭을 눌러 단어를 살펴보세요.
          </p>
        </Card>

        {/* Grade tabs */}
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 4] as Grade[]).map((g) => {
            const active = g === grade;
            return (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`min-h-[56px] rounded-button border-2 font-bold transition-colors ${
                  active
                    ? "border-accent-500 bg-accent-50 text-accent-700"
                    : "border-border bg-surface text-fg-strong hover:border-accent-300"
                }`}
              >
                <div className="text-base">{g}급</div>
                <div className="text-[10px] font-medium text-fg-muted">
                  {sagoData.totals[String(g) as "1" | "2" | "3" | "4"]}개
                </div>
              </button>
            );
          })}
        </div>

        {/* Grade meta */}
        <Card as="section" className="px-6 py-5 space-y-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-bold text-fg-strong">{info.label}</h2>
            <span className="text-sm text-fg-muted">· {info.subtitle}</span>
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">
            {info.description}
          </p>
          {definedCount < wordsOfGrade.length && (
            <p className="text-xs text-fg-subtle pt-2">
              뜻 정리 진행도: {definedCount} / {wordsOfGrade.length}
            </p>
          )}
        </Card>

        {/* Search */}
        <div>
          <label className="block">
            <span className="sr-only">단어 검색</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="단어로 검색 (예: 비교, 분석)"
              className="w-full h-12 px-4 rounded-button bg-surface border border-border text-fg-strong placeholder:text-fg-subtle focus:border-accent-500 focus:outline-none"
            />
          </label>
        </div>

        {/* Word list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <Card as="section" className="px-6 py-8 text-center">
              <p className="text-fg-muted text-sm">
                {query
                  ? `‘${query}’와(과) 일치하는 단어가 없어요.`
                  : "단어가 없어요."}
              </p>
            </Card>
          ) : (
            filtered.map((w) => {
              const def = definitions[w.raw] ?? "";
              const dictUrl = `https://stdict.korean.go.kr/search/searchResult.do?pageSize=10&searchKeyword=${encodeURIComponent(w.word)}`;
              return (
                <Card
                  key={w.raw}
                  as="article"
                  className="px-5 py-4 space-y-1.5"
                >
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-fg-strong">
                      {w.word}
                    </h3>
                    {w.suffix !== null && (
                      <span className="text-xs text-fg-subtle font-semibold">
                        ({w.suffix})
                      </span>
                    )}
                    <Chip tone="accent" className="ml-auto">
                      {info.label}
                    </Chip>
                  </div>
                  {def ? (
                    <p className="text-sm text-fg leading-relaxed">{def}</p>
                  ) : (
                    <p className="text-sm text-fg-subtle">
                      뜻 준비 중이에요.
                    </p>
                  )}
                  <div className="pt-0.5">
                    <a
                      href={dictUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-fg-subtle hover:text-accent-600 inline-flex items-center gap-0.5"
                    >
                      표준국어대사전에서 모든 뜻 보기 →
                    </a>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-fg-subtle text-center pt-2 leading-relaxed">
          단어 출처: 충청남도교육청 ‘한국어 사고도구어 목록(1,387개)’
          <br />
          뜻 출처:{" "}
          <a
            href="https://stdict.korean.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-fg-muted"
          >
            국립국어원 표준국어대사전
          </a>
          {" "}(Open API)
        </p>

        <OnthinkingBanner />
      </div>
    </main>
  );
}
