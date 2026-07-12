"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";

export interface WordStat {
  grade: number;
  label: string;
  learners: number; // 이 단어를 아는 학생 수
}

export function WordsStats({
  rows,
  studentCount,
}: {
  rows: WordStat[];
  studentCount: number;
}) {
  const [grade, setGrade] = useState<1 | 2 | 3 | 4>(1);
  const [order, setOrder] = useState<"low" | "high">("low"); // low=부족한 순
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim();
    let arr = rows.filter((r) => r.grade === grade);
    if (q) arr = arr.filter((r) => r.label.includes(q));
    arr = arr.slice().sort((a, b) => {
      if (a.learners !== b.learners)
        return order === "low" ? a.learners - b.learners : b.learners - a.learners;
      return a.label.localeCompare(b.label, "ko");
    });
    return arr;
  }, [rows, grade, order, query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {([1, 2, 3, 4] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                grade === g
                  ? "bg-accent-600 text-white"
                  : "bg-surface-muted text-fg-muted hover:bg-border"
              }`}
            >
              {g}급
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setOrder("low")}
            className={`h-8 px-3 rounded-full text-xs font-semibold ${
              order === "low" ? "bg-cat-hum text-white" : "bg-surface-muted text-fg-muted hover:bg-border"
            }`}
          >
            부족한 순
          </button>
          <button
            type="button"
            onClick={() => setOrder("high")}
            className={`h-8 px-3 rounded-full text-xs font-semibold ${
              order === "high" ? "bg-cat-sci text-white" : "bg-surface-muted text-fg-muted hover:bg-border"
            }`}
          >
            잘 아는 순
          </button>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="단어 검색"
          className="h-8 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500 flex-1 min-w-[120px]"
        />
      </div>

      <p className="text-xs text-fg-subtle px-1">
        {list.length}개 단어 · 전체 학생 {studentCount}명 기준 · 막대는 아는 학생 비율
      </p>

      <Card as="section" className="px-3 py-2">
        <ul className="divide-y divide-border">
          {list.map((r, i) => {
            const pct = studentCount > 0 ? Math.round((r.learners / studentCount) * 100) : 0;
            return (
              <li key={i} className="py-2 flex items-center gap-3">
                <span className="text-sm font-bold text-fg-strong w-20 shrink-0 truncate">
                  {r.label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background:
                        pct < 34
                          ? "var(--color-cat-hum)"
                          : pct < 67
                            ? "var(--color-cat-soc)"
                            : "var(--color-cat-sci)",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-fg-muted w-16 text-right shrink-0">
                  {r.learners}/{studentCount} ({pct}%)
                </span>
              </li>
            );
          })}
          {list.length === 0 && (
            <li className="py-6 text-center text-sm text-fg-muted">
              해당하는 단어가 없어요.
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
