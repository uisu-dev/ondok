"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import {
  CLASS_OPTIONS,
  MAX_STUDENT_NO,
  MIN_BIRTH_YEAR,
  gradeOptions,
  maxBirthYear,
} from "@/lib/grade";
import { updateStudentProfile } from "./actions";

interface School {
  code: string;
  name: string;
  type: string;
}

/**
 * 슈퍼관리자 전용 학적 수정.
 * 전학·반 편성 변경·번호 배정처럼 학생이 직접 고치기 어려운 것을 바로잡는다.
 */
export function StudentEditCard({
  userId,
  schools,
  initial,
}: {
  userId: string;
  schools: School[];
  initial: {
    displayName: string;
    schoolCode: string | null;
    birthYear: number | null;
    grade: number | null;
    classNo: number | null;
    studentNo: number | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.displayName);
  const [schoolCode, setSchoolCode] = useState<string | null>(initial.schoolCode);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [birthYear, setBirthYear] = useState(
    initial.birthYear != null ? String(initial.birthYear) : ""
  );
  const [grade, setGrade] = useState<number | null>(initial.grade);
  const [classNo, setClassNo] = useState<number | null>(initial.classNo);
  const [studentNo, setStudentNo] = useState(
    initial.studentNo != null ? String(initial.studentNo) : ""
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.code === schoolCode) ?? null,
    [schools, schoolCode]
  );

  const schoolMatches = useMemo(() => {
    const q = schoolQuery.trim();
    if (!q) return [];
    return schools.filter((s) => s.name.includes(q)).slice(0, 30);
  }, [schools, schoolQuery]);

  // 학교가 바뀌면 학년 선택지가 달라진다 (특수학교는 6학년까지)
  const grades = gradeOptions(selectedSchool?.type);

  function submit() {
    setError(null);
    setSaved(false);
    if (!schoolCode) {
      setError("학교를 선택해 주세요.");
      return;
    }
    const by = birthYear.trim() ? Number(birthYear) : null;
    if (birthYear.trim() && !Number.isFinite(by)) {
      setError("출생연도를 숫자로 입력해 주세요.");
      return;
    }
    const sn = studentNo.trim() ? Number(studentNo) : null;
    if (studentNo.trim() && !Number.isFinite(sn)) {
      setError("번호를 숫자로 입력해 주세요.");
      return;
    }
    startTransition(async () => {
      const res = await updateStudentProfile({
        userId,
        displayName: name,
        schoolCode,
        birthYear: by,
        grade,
        classNo,
        studentNo: sn,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSaved(true);
      setOpen(false);
      setSchoolQuery("");
      router.refresh();
    });
  }

  function reset() {
    setName(initial.displayName);
    setSchoolCode(initial.schoolCode);
    setBirthYear(initial.birthYear != null ? String(initial.birthYear) : "");
    setGrade(initial.grade);
    setClassNo(initial.classNo);
    setStudentNo(initial.studentNo != null ? String(initial.studentNo) : "");
    setSchoolQuery("");
    setError(null);
  }

  return (
    <Card as="section" className="px-6 py-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-fg-strong">🗂️ 학적 수정</p>
          <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">
            이름·학교·학년·반·번호를 고칠 수 있어요. 전학이나 반 편성이 바뀌었을
            때 쓰세요.
          </p>
          {saved && !open && (
            <p className="text-xs font-semibold text-cat-sci mt-1">저장했어요.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (open) reset();
            setOpen(!open);
          }}
          className="shrink-0 h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-bold"
        >
          {open ? "취소" : "수정"}
        </button>
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t border-border">
          {/* 이름 */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-bold text-fg-strong"
              htmlFor="edit-name"
            >
              이름
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            />
          </div>

          {/* 학교 */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-fg-strong">학교</span>
            <div className="rounded-button bg-surface-muted px-3 py-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-fg-strong truncate">
                {selectedSchool?.name ?? "학교 미지정"}
              </span>
              <span className="text-[10px] text-fg-subtle shrink-0 font-mono">
                {schoolCode ?? "—"}
              </span>
            </div>
            <input
              type="text"
              value={schoolQuery}
              onChange={(e) => setSchoolQuery(e.target.value)}
              placeholder="바꾸려면 학교명 검색 (예: 천안중앙)"
              className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            />
            {schoolQuery.trim() && (
              <div className="rounded-card border border-border overflow-hidden">
                {schoolMatches.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-fg-muted">
                    검색 결과가 없어요.
                  </p>
                ) : (
                  <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                    {schoolMatches.map((s) => (
                      <li key={s.code}>
                        <button
                          type="button"
                          onClick={() => {
                            setSchoolCode(s.code);
                            setSchoolQuery("");
                            // 학년 상한이 바뀔 수 있으므로 범위를 벗어나면 비운다
                            if (
                              grade != null &&
                              !gradeOptions(s.type).includes(grade)
                            ) {
                              setGrade(null);
                            }
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                            schoolCode === s.code
                              ? "bg-accent-100 text-accent-700 font-semibold"
                              : "text-fg-strong hover:bg-surface-muted"
                          }`}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* 학년 */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-fg-strong">학년</span>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(grade === g ? null : g)}
                  aria-pressed={grade === g}
                  className={`h-11 min-w-[68px] px-3 rounded-button border-2 text-sm font-bold transition-colors ${
                    grade === g
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-border bg-surface text-fg-strong hover:border-accent-300"
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          {/* 반 */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-fg-strong">반</span>
            <div className="grid grid-cols-10 gap-1.5">
              {CLASS_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClassNo(classNo === c ? null : c)}
                  aria-pressed={classNo === c}
                  className={`h-10 rounded-button border-2 text-xs font-bold transition-colors ${
                    classNo === c
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-border bg-surface text-fg-strong hover:border-accent-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-fg-subtle">
              선택된 것을 한 번 더 누르면 해제돼요. 학년·반을 비우면 학생이 다음
              로그인 때 다시 입력하게 됩니다.
            </p>
          </div>

          {/* 번호 · 출생연도 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                className="text-xs font-bold text-fg-strong"
                htmlFor="edit-student-no"
              >
                번호
              </label>
              <input
                id="edit-student-no"
                type="number"
                inputMode="numeric"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                min={1}
                max={MAX_STUDENT_NO}
                placeholder="예: 15"
                className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-xs font-bold text-fg-strong"
                htmlFor="edit-birth-year"
              >
                출생연도
              </label>
              <input
                id="edit-birth-year"
                type="number"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min={MIN_BIRTH_YEAR}
                max={maxBirthYear()}
                placeholder="예: 2011"
                className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-cat-hum font-semibold">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="h-11 px-5 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold disabled:opacity-50"
            >
              {pending ? "저장 중…" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setOpen(false);
              }}
              disabled={pending}
              className="h-11 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-bold disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
