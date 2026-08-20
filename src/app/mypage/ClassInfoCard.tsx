"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { CLASS_OPTIONS, MAX_STUDENT_NO, classLabel } from "@/lib/grade";
import { saveClassInfo } from "./actions";

/** 학년·반 확인/변경. 반이 바뀌었을 때 학생이 스스로 고칠 수 있게 한다. */
export function ClassInfoCard({
  grade,
  classNo,
  studentNo,
  gradeOptions,
  schoolYear,
}: {
  grade: number | null;
  classNo: number | null;
  studentNo: number | null;
  gradeOptions: number[];
  schoolYear: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(grade == null || classNo == null);
  const [g, setG] = useState<number | null>(grade);
  const [c, setC] = useState<number | null>(classNo);
  const [sn, setSn] = useState(studentNo != null ? String(studentNo) : "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit() {
    if (g == null || c == null) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const num = sn.trim() ? Number(sn) : null;
      if (num != null && !Number.isFinite(num)) {
        setError("번호는 숫자로 적어 주세요.");
        return;
      }
      const res = await saveClassInfo({ grade: g, classNo: c, studentNo: num });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setSaved(true);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <Card as="section" className="px-6 py-6 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-fg-muted">
            {schoolYear}학년도 학년 · 반
          </p>
          <p className="text-base font-bold text-fg-strong mt-1">
            {classLabel(grade, classNo, studentNo) ?? "아직 입력하지 않았어요"}
          </p>
          <p className="text-xs text-fg-subtle mt-1 leading-relaxed">
            선생님이 우리 반 학습 현황을 볼 때 쓰여요.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-bold"
          >
            바꾸기
          </button>
        )}
      </div>

      {saved && !editing && (
        <p className="text-xs font-semibold text-cat-sci">저장했어요.</p>
      )}

      {editing && (
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap gap-2">
            {gradeOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setG(n)}
                aria-pressed={g === n}
                className={`h-11 min-w-[72px] px-4 rounded-button border-2 text-sm font-bold transition-colors ${
                  g === n
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-border bg-surface text-fg-strong hover:border-accent-300"
                }`}
              >
                {n}학년
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {CLASS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setC(n)}
                aria-pressed={c === n}
                className={`h-11 rounded-button border-2 text-sm font-bold transition-colors ${
                  c === n
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-border bg-surface text-fg-strong hover:border-accent-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-fg-strong" htmlFor="my-student-no">
              번호 <span className="text-fg-subtle">(선택)</span>
            </label>
            <input
              id="my-student-no"
              type="number"
              inputMode="numeric"
              value={sn}
              onChange={(e) => setSn(e.target.value)}
              min={1}
              max={MAX_STUDENT_NO}
              placeholder="출석번호"
              className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            />
          </div>

          {error && <p className="text-sm text-cat-hum font-semibold">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={g == null || c == null || pending}
              className="h-11 px-5 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold disabled:opacity-40"
            >
              {pending ? "저장 중…" : "저장"}
            </button>
            {grade != null && classNo != null && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setG(grade);
                  setC(classNo);
                  setSn(studentNo != null ? String(studentNo) : "");
                  setError(null);
                }}
                disabled={pending}
                className="h-11 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-bold disabled:opacity-50"
              >
                취소
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
