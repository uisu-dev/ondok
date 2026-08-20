"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MAX_STUDENT_NO } from "@/lib/grade";
import { saveClassInfo } from "@/app/mypage/actions";

/**
 * 로그인한 학생에게 학년·반을 묻는 안내창.
 *
 * 닫을 수 없다. 배경을 눌러도, ESC 를 눌러도 닫히지 않는다.
 * 학년·반이 비어 있으면 통계가 반 단위로 잡히지 않기 때문에
 * 한 번은 반드시 받고 시작한다.
 *
 * 언제 뜨는지는 needsClassInfo() 가 판정한다 (SiteHeader 에서 호출).
 * 학년도가 바뀌면 자동으로 다시 뜬다.
 */
export function ClassGate({
  name,
  schoolName,
  gradeOptions,
  classOptions,
  schoolYear,
  /** 지난 학년도 값이 남아 있으면 새 학년을 기본값으로 미리 골라 준다 */
  previousGrade,
}: {
  name: string;
  schoolName: string | null;
  gradeOptions: number[];
  classOptions: number[];
  schoolYear: number;
  previousGrade: number | null;
}) {
  const router = useRouter();
  const [grade, setGrade] = useState<number | null>(null);
  const [classNo, setClassNo] = useState<number | null>(null);
  const [studentNo, setStudentNo] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isNewYear = previousGrade != null;

  function submit() {
    if (grade == null || classNo == null) return;
    setError(null);
    startTransition(async () => {
      const sn = studentNo.trim() ? Number(studentNo) : null;
      if (sn != null && !Number.isFinite(sn)) {
        setError("번호는 숫자로 적어 주세요.");
        return;
      }
      const res = await saveClassInfo({ grade, classNo, studentNo: sn });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-fg-strong/60 flex items-end sm:items-center justify-center p-0 sm:p-6 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="classgate-title"
    >
      <div className="bg-surface rounded-t-card sm:rounded-card shadow-card-hover w-full sm:max-w-md max-h-[92vh] flex flex-col">
        <div className="px-6 pt-7 pb-4 space-y-1.5">
          <p className="text-xs font-bold text-accent-600">
            {schoolYear}학년도 · 처음 한 번만
          </p>
          <h2
            id="classgate-title"
            className="text-xl font-bold text-fg-strong leading-snug"
          >
            {name} 님, {isNewYear ? "새 학년을 알려 주세요" : "몇 학년 몇 반인가요?"}
          </h2>
          <p className="text-sm text-fg-muted leading-relaxed">
            {isNewYear
              ? "새 학년도가 시작되었어요. 올해 학년과 반을 다시 골라 주세요."
              : "선생님이 우리 반 학습 현황을 볼 때 쓰여요."}
            {schoolName && (
              <>
                <br />
                <span className="text-fg-subtle text-xs">
                  소속 학교: {schoolName}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-fg-strong mb-2">학년</legend>
            <div className="flex flex-wrap gap-2">
              {gradeOptions.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  aria-pressed={grade === g}
                  className={`h-12 min-w-[76px] px-4 rounded-button border-2 text-sm font-bold transition-colors ${
                    grade === g
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-border bg-surface text-fg-strong hover:border-accent-300"
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-fg-strong mb-2">반</legend>
            <div className="grid grid-cols-5 gap-2">
              {classOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClassNo(c)}
                  aria-pressed={classNo === c}
                  className={`h-12 rounded-button border-2 text-sm font-bold transition-colors ${
                    classNo === c
                      ? "border-accent-600 bg-accent-600 text-white"
                      : "border-border bg-surface text-fg-strong hover:border-accent-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </fieldset>


          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-fg-strong mb-2">
              번호 <span className="text-fg-subtle font-semibold">(선택)</span>
            </legend>
            <input
              type="number"
              inputMode="numeric"
              value={studentNo}
              onChange={(e) => setStudentNo(e.target.value)}
              min={1}
              max={MAX_STUDENT_NO}
              placeholder="출석번호를 알면 적어 주세요"
              className="w-full h-12 px-3 rounded-button border-2 border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            />
            <p className="text-[11px] text-fg-subtle">
              몰라도 괜찮아요. 나중에 선생님이 채워 주실 수 있어요.
            </p>
          </fieldset>

          {error && (
            <p className="text-sm text-cat-hum font-semibold">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border space-y-2">
          <button
            type="button"
            onClick={submit}
            disabled={grade == null || classNo == null || pending}
            className="w-full h-12 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm disabled:opacity-40 transition-colors"
          >
            {pending
              ? "저장 중…"
              : grade != null && classNo != null
                ? `${grade}학년 ${classNo}반으로 시작하기`
                : "학년과 반을 골라 주세요"}
          </button>
          <p className="text-[11px] text-fg-subtle text-center leading-relaxed">
            잘못 골랐다면 마이페이지에서 언제든 바꿀 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
