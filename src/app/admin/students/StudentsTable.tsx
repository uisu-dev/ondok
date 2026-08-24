"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { StudentModal } from "./StudentModal";

export interface StudentRow {
  id: string;
  name: string;
  loginId: string | null;
  schoolName: string | null;
  gradeLabel: string | null;
  gradeNum: number | null; // 출생연도 기반 추정 학령 (1~12), 없으면 null
  /** 학생이 직접 고른 학년·반. 아직 안 골랐으면 null */
  grade: number | null;
  classNo: number | null;
  studentNo: number | null;
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

/** 검색·학년·반 필터는 StudentsView 가 맡고, 여기서는 정렬과 표시만 한다. */
export function StudentsTable({
  students,
  showSchool,
}: {
  students: StudentRow[];
  showSchool: boolean;
}) {
  const [sortKey, setSortKey] = useState<
    "name" | "class" | "sago" | "books" | "sheets" | "worksDone" | "lastActive"
  >("class");
  // 이름을 누르면 페이지를 옮기지 않고 모달로 띄운다 (여러 명을 견주어 보기 쉽게)
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const arr = students.slice().sort((a, b) => {
      if (sortKey === "class") {
        // 학년 → 반 → 이름. 아직 안 고른 학생은 맨 뒤로
        const ag = a.grade ?? 99;
        const bg = b.grade ?? 99;
        if (ag !== bg) return ag - bg;
        const ac = a.classNo ?? 99;
        const bc = b.classNo ?? 99;
        if (ac !== bc) return ac - bc;
        const an = a.studentNo ?? 999;
        const bn = b.studentNo ?? 999;
        if (an !== bn) return an - bn;
        return a.name.localeCompare(b.name, "ko");
      }
      if (sortKey === "name") return a.name.localeCompare(b.name, "ko");
      if (sortKey === "lastActive") {
        const av = a.lastActive ? new Date(a.lastActive).getTime() : 0;
        const bv = b.lastActive ? new Date(b.lastActive).getTime() : 0;
        return bv - av; // 최근 활동 순
      }
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
    return arr;
  }, [students, sortKey]);

  // 필터·정렬된 목록 안에서의 위치 (모달의 이전/다음에 쓴다).
  // 필터가 바뀌어 열린 학생이 목록에서 빠지면 -1 이 되어 모달이 닫힌다.
  const openIndex = openId ? filtered.findIndex((s) => s.id === openId) : -1;

  return (
    <div className="space-y-3">
      <p className="text-xs text-fg-subtle px-1">
        {filtered.length}명 표시 · 정렬:{" "}
        {(
          [
            ["class", "학년·반·번호"],
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
              <th className="text-left font-semibold px-3 py-2">학년·반·번호</th>
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
                    <button
                      type="button"
                      onClick={() => setOpenId(s.id)}
                      className="text-accent-600 hover:underline"
                    >
                      {s.name}
                    </button>
                    {s.loginId && (
                      <span className="ml-1.5 text-[11px] font-mono font-normal text-fg-subtle">
                        {s.loginId}
                      </span>
                    )}
                  </td>
                  {showSchool && (
                    <td className="px-3 py-2.5 text-fg-muted text-xs whitespace-nowrap">
                      {s.schoolName ?? "—"}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {s.grade != null && s.classNo != null ? (
                      <span className="font-semibold text-fg-strong">
                        {s.grade}학년 {s.classNo}반
                        {s.studentNo != null && (
                          <span className="text-accent-600"> {s.studentNo}번</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-fg-subtle">
                        미입력
                        {s.gradeLabel && (
                          <span className="ml-1">({s.gradeLabel})</span>
                        )}
                      </span>
                    )}
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

      {openIndex >= 0 && (
        <StudentModal
          key={filtered[openIndex].id}
          row={filtered[openIndex]}
          onClose={() => setOpenId(null)}
          onPrev={
            openIndex > 0
              ? () => setOpenId(filtered[openIndex - 1].id)
              : undefined
          }
          onNext={
            openIndex < filtered.length - 1
              ? () => setOpenId(filtered[openIndex + 1].id)
              : undefined
          }
        />
      )}
    </div>
  );
}
