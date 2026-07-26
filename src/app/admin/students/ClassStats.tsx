"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import type { StudentRow } from "./StudentsTable";

/** 급수별 전체 단어 수 (진도율 계산 기준). */
const GRADE_TOTAL = { 1: 43, 2: 291, 3: 584, 4: 466 } as const;
const SAGO_TOTAL =
  GRADE_TOTAL[1] + GRADE_TOTAL[2] + GRADE_TOTAL[3] + GRADE_TOTAL[4];

const BUCKETS = [
  { label: "0개", test: (n: number) => n === 0 },
  { label: "1~30", test: (n: number) => n >= 1 && n <= 30 },
  { label: "31~100", test: (n: number) => n >= 31 && n <= 100 },
  { label: "101~300", test: (n: number) => n >= 101 && n <= 300 },
  { label: "301+", test: (n: number) => n >= 301 },
];

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function ClassStats({ students }: { students: StudentRow[] }) {
  const [open, setOpen] = useState(true);
  const n = students.length;

  const s = useMemo(() => {
    const sum = (f: (x: StudentRow) => number) =>
      students.reduce((a, x) => a + f(x), 0);
    const count = (f: (x: StudentRow) => boolean) =>
      students.filter(f).length;

    const active = (x: StudentRow) =>
      x.sago > 0 || x.sheets > 0 || x.worksRead > 0 || x.gamePlays > 0 || x.books > 0;

    return {
      // 참여
      doneSago: count((x) => x.sago > 0),
      doneSheets: count((x) => x.sheets > 0),
      doneWorks: count((x) => x.worksRead > 0),
      doneGames: count((x) => x.gamePlays > 0),
      inactive: count((x) => !active(x)),
      // 사고도구어
      sagoTotal: sum((x) => x.sago),
      g1: sum((x) => x.sagoG1),
      g2: sum((x) => x.sagoG2),
      g3: sum((x) => x.sagoG3),
      g4: sum((x) => x.sagoG4),
      // 기타
      booksTotal: sum((x) => x.books),
      sheetsTotal: sum((x) => x.sheets),
      worksDoneTotal: sum((x) => x.worksDone),
      battleTotal: sum((x) => x.battleWins),
      // 최근 7일 활동
      recent7: count((x) => {
        const d = daysAgo(x.lastActive);
        return d !== null && d <= 7;
      }),
      stale14: count((x) => {
        const d = daysAgo(x.lastActive);
        return d === null || d > 14;
      }),
    };
  }, [students]);

  const dist = useMemo(
    () => BUCKETS.map((b) => ({ label: b.label, n: students.filter((x) => b.test(x.sago)).length })),
    [students]
  );
  const distMax = Math.max(1, ...dist.map((d) => d.n));

  const grades = [
    { g: 1, sum: s.g1, total: GRADE_TOTAL[1] },
    { g: 2, sum: s.g2, total: GRADE_TOTAL[2] },
    { g: 3, sum: s.g3, total: GRADE_TOTAL[3] },
    { g: 4, sum: s.g4, total: GRADE_TOTAL[4] },
  ];

  if (n === 0) return null;

  return (
    <Card as="section" className="px-6 py-5 space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <span className="text-sm font-bold text-fg-strong">📈 상세 통계</span>
        <span className="text-xs font-semibold text-accent-600">
          {open ? "접기" : "펼치기"}
        </span>
      </button>

      {open && (
        <div className="space-y-6">
          {/* 참여 현황 */}
          <section className="space-y-2">
            <p className="text-xs font-bold text-fg-muted">
              참여 현황 · 학생 {n}명 중
            </p>
            <div className="space-y-1.5">
              {[
                { label: "사고도구어 학습", v: s.doneSago },
                { label: "활동지 풀이", v: s.doneSheets },
                { label: "고전 읽기", v: s.doneWorks },
                { label: "게임", v: s.doneGames },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-2">
                  <span className="text-xs text-fg-strong w-24 shrink-0">
                    {r.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                    <div
                      className="h-full bg-accent-500"
                      style={{ width: `${pct(r.v, n)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-fg-muted w-20 text-right shrink-0">
                    {r.v}명 ({pct(r.v, n)}%)
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-bold px-2 py-1 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-sci)_14%,white)] text-cat-sci">
                최근 7일 활동 {s.recent7}명
              </span>
              {s.stale14 > 0 && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-soc)_16%,white)] text-cat-soc">
                  2주 이상 활동 없음 {s.stale14}명
                </span>
              )}
              {s.inactive > 0 && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-chip bg-[color-mix(in_oklab,var(--color-cat-hum)_12%,white)] text-cat-hum">
                  아직 아무 활동 없음 {s.inactive}명
                </span>
              )}
            </div>
          </section>

          {/* 급수별 평균 습득률 */}
          <section className="space-y-2">
            <p className="text-xs font-bold text-fg-muted">
              사고도구어 급수별 평균 습득률
            </p>
            <div className="space-y-1.5">
              {grades.map((g) => {
                const avg = n > 0 ? g.sum / n : 0;
                const rate = pct(avg, g.total);
                return (
                  <div key={g.g} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-fg-strong w-10 shrink-0">
                      {g.g}급
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full"
                        style={{
                          width: `${rate}%`,
                          background:
                            rate < 20
                              ? "var(--color-cat-hum)"
                              : rate < 50
                                ? "var(--color-cat-soc)"
                                : "var(--color-cat-sci)",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-fg-muted w-28 text-right shrink-0">
                      평균 {avg.toFixed(1)} / {g.total} ({rate}%)
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-fg-subtle">
              비율이 낮은 급수가 우리 반이 함께 다뤄야 할 구간이에요.
            </p>
          </section>

          {/* 습득 분포 */}
          <section className="space-y-2">
            <p className="text-xs font-bold text-fg-muted">
              사고도구어 습득 분포 (학생 수)
            </p>
            <div className="flex items-end gap-2 h-28">
              {dist.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[11px] font-bold text-fg-strong">
                    {d.n}
                  </span>
                  <div
                    className="w-full rounded-t-button bg-accent-500 transition-all"
                    style={{ height: `${(d.n / distMax) * 72}px`, minHeight: d.n > 0 ? 4 : 0 }}
                  />
                  <span className="text-[10px] text-fg-muted">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-fg-subtle">
              왼쪽에 몰려 있으면 아직 학습을 시작하지 못한 학생이 많다는 뜻이에요.
            </p>
          </section>

          {/* 활동 총계 */}
          <section className="space-y-2">
            <p className="text-xs font-bold text-fg-muted">활동 총계</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "아는 단어", v: s.sagoTotal, unit: "개", sub: `1인 평균 ${(s.sagoTotal / n).toFixed(1)}개 · 전체 ${SAGO_TOTAL}개 중` },
                { label: "담은 도서", v: s.booksTotal, unit: "권", sub: `1인 평균 ${(s.booksTotal / n).toFixed(1)}권` },
                { label: "고전 완독", v: s.worksDoneTotal, unit: "편", sub: `1인 평균 ${(s.worksDoneTotal / n).toFixed(1)}편` },
                { label: "배틀 승수", v: s.battleTotal, unit: "승", sub: `1인 평균 ${(s.battleTotal / n).toFixed(1)}승` },
              ].map((c) => (
                <div key={c.label} className="bg-surface-muted rounded-button px-3 py-2.5">
                  <p className="text-[10px] font-bold text-fg-muted">{c.label}</p>
                  <p>
                    <span className="text-lg font-bold text-accent-600">{c.v}</span>
                    <span className="text-xs text-fg-muted ml-0.5">{c.unit}</span>
                  </p>
                  <p className="text-[10px] text-fg-subtle leading-tight">{c.sub}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </Card>
  );
}
