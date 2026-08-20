"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ClassStats } from "./ClassStats";
import { StudentsTable, type StudentRow } from "./StudentsTable";

/**
 * 학생 현황 화면 전체. 검색·학년·반 필터를 여기서 쥐고,
 * 요약 카드 · 반 분석 · 학생 표가 모두 같은 필터를 따르게 한다.
 * (필터를 표 안에만 두면 위쪽 통계와 숫자가 어긋난다)
 */
export function StudentsView({
  students,
  showSchool,
}: {
  students: StudentRow[];
  showSchool: boolean;
}) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<number | "all">("all");
  const [classNo, setClassNo] = useState<number | "all">("all");

  // 실제로 학생이 들어 있는 학년·반만 선택지로 보여 준다
  const grades = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((s) => s.grade)
            .filter((g): g is number => g != null)
        )
      ).sort((a, b) => a - b),
    [students]
  );

  const classes = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .filter((s) => grade === "all" || s.grade === grade)
            .map((s) => s.classNo)
            .filter((c): c is number => c != null)
        )
      ).sort((a, b) => a - b),
    [students, grade]
  );

  const noClassInfo = useMemo(
    () => students.filter((s) => s.grade == null || s.classNo == null).length,
    [students]
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    return students.filter((s) => {
      if (grade !== "all" && s.grade !== grade) return false;
      if (classNo !== "all" && s.classNo !== classNo) return false;
      if (
        q &&
        !s.name.includes(q) &&
        !(s.loginId ?? "").includes(q.toLowerCase()) &&
        !(s.schoolName ?? "").includes(q)
      )
        return false;
      return true;
    });
  }, [students, query, grade, classNo]);

  const n = filtered.length;
  const sum = (k: "sago" | "books" | "sheets") =>
    filtered.reduce((a, s) => a + s[k], 0);
  const avg = (total: number) => (n > 0 ? Math.round((total / n) * 10) / 10 : 0);

  const isFiltered = grade !== "all" || classNo !== "all" || query.trim() !== "";
  const scopeLabel =
    grade === "all"
      ? "전체 학년"
      : classNo === "all"
        ? `${grade}학년 전체`
        : `${grade}학년 ${classNo}반`;

  function pickGrade(g: number | "all") {
    setGrade(g);
    setClassNo("all"); // 학년이 바뀌면 반 선택은 초기화
  }

  return (
    <div className="space-y-5">
      {/* 필터 */}
      <Card as="section" className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs font-bold text-fg-strong">학년 · 반으로 보기</p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setGrade("all");
                setClassNo("all");
                setQuery("");
              }}
              className="text-xs font-semibold text-accent-600 hover:underline"
            >
              필터 초기화
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-fg-muted w-8">학년</span>
            <FilterChip
              label="전체"
              active={grade === "all"}
              onClick={() => pickGrade("all")}
            />
            {grades.map((g) => (
              <FilterChip
                key={g}
                label={`${g}학년`}
                active={grade === g}
                onClick={() => pickGrade(g)}
              />
            ))}
            {grades.length === 0 && (
              <span className="text-[11px] text-fg-subtle">
                아직 학년을 입력한 학생이 없어요
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-fg-muted w-8">반</span>
            <FilterChip
              label="전체"
              active={classNo === "all"}
              onClick={() => setClassNo("all")}
            />
            {classes.map((c) => (
              <FilterChip
                key={c}
                label={`${c}반`}
                active={classNo === c}
                onClick={() => setClassNo(c)}
              />
            ))}
          </div>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={showSchool ? "이름·아이디·학교 검색" : "이름·아이디 검색"}
          className="w-full h-10 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
        />

        {noClassInfo > 0 && (
          <p className="text-[11px] text-fg-subtle leading-relaxed">
            학년·반을 아직 입력하지 않은 학생이 {noClassInfo}명 있어요. 다음 로그인
            때 입력 화면이 뜹니다.
          </p>
        )}
      </Card>

      <div className="space-y-1">
        <p className="text-xs font-bold text-accent-600 px-1">
          {scopeLabel} · {n}명
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="학생 수" value={n} unit="명" />
          <StatCard
            label="평균 아는 단어"
            value={avg(sum("sago"))}
            unit="개"
            hint={`총 ${sum("sago")}개`}
          />
          <StatCard
            label="도서 선택"
            value={sum("books")}
            unit="권"
            hint={`평균 ${avg(sum("books"))}권`}
          />
          <StatCard
            label="활동지 풀이"
            value={sum("sheets")}
            unit="건"
            hint={`평균 ${avg(sum("sheets"))}건`}
          />
        </div>
      </div>

      <ClassStats students={filtered} />
      <StudentsTable students={filtered} showSchool={showSchool} />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
        active
          ? "bg-accent-600 text-white"
          : "bg-surface-muted text-fg-muted hover:bg-border"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  hint?: string;
}) {
  return (
    <Card as="section" className="px-4 py-4">
      <p className="text-xs font-semibold text-fg-muted">{label}</p>
      <p className="mt-1">
        <span
          className="font-bold text-accent-600"
          style={{ fontSize: 28, lineHeight: 1 }}
        >
          {value}
        </span>
        <span className="text-fg-muted text-sm ml-0.5">{unit}</span>
      </p>
      {hint && <p className="text-[10px] text-fg-subtle mt-0.5">{hint}</p>}
    </Card>
  );
}
