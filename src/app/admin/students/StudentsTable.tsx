"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export interface StudentRow {
  id: string;
  name: string;
  schoolName: string | null;
  gradeLabel: string | null;
  gradeNum: number | null; // 정렬·필터용 (1~12), 없으면 null
  mbti: string | null;
  sago: number;
  sagoG1: number;
  sagoG2: number;
  sagoG3: number;
  sagoG4: number;
  books: number;
  sheets: number;
  worksRead: number;
  worksDone: number;
  battleWins: number;
  gamePlays: number;
  lastActive: string | null;
}

/** 마지막 활동으로부터 지난 날짜 → 짧은 라벨. */
function activityLabel(iso: string | null): { text: string; tone: string } {
  if (!iso) return { text: "—", tone: "text-fg-subtle" };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return { text: "오늘", tone: "text-cat-sci font-semibold" };
  if (days === 1) return { text: "어제", tone: "text-cat-sci" };
  if (days <= 7) return { text: `${days}일 전`, tone: "text-fg-muted" };
  if (days <= 30) return { text: `${days}일 전`, tone: "text-cat-soc" };
  return { text: `${days}일 전`, tone: "text-cat-hum" };
}

const GRADE_FILTERS: { key: string; label: string; test: (g: number | null) => boolean }[] = [
  { key: "all", label: "전체", test: () => true },
  { key: "elem", label: "초등", test: (g) => g != null && g >= 1 && g <= 6 },
  { key: "mid", label: "중등", test: (g) => g != null && g >= 7 && g <= 9 },
  { key: "high", label: "고등", test: (g) => g != null && g >= 10 && g <= 12 },
];

export function StudentsTable({
  students,
  showSchool,
}: {
  students: StudentRow[];
  showSchool: boolean;
}) {
  const [query, setQuery] = useState("");
  const [gradeKey, setGradeKey] = useState("all");
  const [sortKey, setSortKey] = useState<
    "name" | "sago" | "books" | "sheets" | "worksDone" | "lastActive"
  >("name");

  const filtered = useMemo(() => {
    const q = query.trim();
    const gf = GRADE_FILTERS.find((f) => f.key === gradeKey) ?? GRADE_FILTERS[0];
    let arr = students.filter((s) => {
      if (!gf.test(s.gradeNum)) return false;
      if (q && !s.name.includes(q) && !(s.schoolName ?? "").includes(q)) return false;
      return true;
    });
    arr = arr.slice().sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "ko");
      if (sortKey === "lastActive") {
        const av = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bv = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return bv - av; // 최근 활동 순
      }
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
    return arr;
  }, [students, query, gradeKey, sortKey]);

  return (
    <div className="space-y-3">
      {/* 필터 */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={showSchool ? "이름·학교 검색" : "이름 검색"}
          className="h-10 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500 flex-1 min-w-[140px]"
        />
        <div className="flex gap-1">
          {GRADE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setGradeKey(f.key)}
              className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                gradeKey === f.key
                  ? "bg-accent-600 text-white"
                  : "bg-surface-muted text-fg-muted hover:bg-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-fg-subtle px-1">
        {filtered.length}명 표시 · 정렬:{" "}
        {(
          [
            ["name", "이름"],
            ["sago", "사고도구어"],
            ["books", "도서"],
            ["sheets", "활동지"],
            ["worksDone", "고전"],
            ["lastActive", "최근 활동"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSortKey(k)}
            className={`ml-1.5 ${sortKey === k ? "text-accent-600 font-bold" : "hover:text-fg-strong"}`}
          >
            {label}
          </button>
        ))}
      </p>

      <Card as="section" className="px-2 py-2 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="text-fg-muted text-xs border-b border-border">
              <th className="text-left font-semibold px-3 py-2">이름</th>
              {showSchool && (
                <th className="text-left font-semibold px-3 py-2">학교</th>
              )}
              <th className="text-left font-semibold px-3 py-2">학년</th>
              <th className="text-center font-semibold px-3 py-2">사고도구어</th>
              <th className="text-center font-semibold px-3 py-2">도서</th>
              <th className="text-center font-semibold px-3 py-2">활동지</th>
              <th className="text-center font-semibold px-3 py-2">고전</th>
              <th className="text-center font-semibold px-3 py-2">배틀</th>
              <th className="text-center font-semibold px-3 py-2">MBTI</th>
              <th className="text-center font-semibold px-3 py-2">최근 활동</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={showSchool ? 10 : 9} className="px-3 py-6 text-center text-fg-muted">
                  조건에 맞는 학생이 없어요.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    <Link
                      href={`/admin/students/${s.id}`}
                      className="text-accent-600 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  {showSchool && (
                    <td className="px-3 py-2.5 text-fg-muted text-xs whitespace-nowrap">
                      {s.schoolName ?? "—"}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-fg-muted text-xs whitespace-nowrap">
                    {s.gradeLabel ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-accent-600">
                    {s.sago}
                  </td>
                  <td className="px-3 py-2.5 text-center text-fg-strong">{s.books}</td>
                  <td className="px-3 py-2.5 text-center text-fg-strong">{s.sheets}</td>
                  <td className="px-3 py-2.5 text-center text-fg-strong whitespace-nowrap">
                    {s.worksDone > 0 || s.worksRead > 0 ? (
                      <>
                        {s.worksDone}
                        {s.worksRead > s.worksDone && (
                          <span className="text-[10px] text-fg-subtle">
                            {" "}(+{s.worksRead - s.worksDone})
                          </span>
                        )}
                      </>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center text-cat-soc font-semibold">
                    {s.battleWins}
                  </td>
                  <td className="px-3 py-2.5 text-center text-cat-lit font-semibold">
                    {s.mbti ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs whitespace-nowrap">
                    {(() => {
                      const a = activityLabel(s.lastActive);
                      return <span className={a.tone}>{a.text}</span>;
                    })()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
