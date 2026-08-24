"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { issueStudentTempPassword } from "./actions";

/**
 * 임시 비밀번호 발급.
 * 교원도 제 학교 학생에게는 직접 발급할 수 있다 (권한 판정은 서버 액션에서).
 */
export function StudentPasswordCard({
  userId,
  displayName,
  loginId,
}: {
  userId: string;
  displayName: string;
  loginId: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (pending) return;
    if (
      !window.confirm(
        `${displayName}(${loginId ?? "?"}) 님의 비밀번호를 임시 비밀번호로 재설정할까요?\n기존 비밀번호는 더 이상 쓸 수 없게 됩니다.`
      )
    )
      return;
    setPending(true);
    setError(null);
    try {
      const res = await issueStudentTempPassword(userId);
      if (!res.ok) setError(res.message);
      else setTempPw(res.password);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card as="section" className="px-6 py-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-fg-strong">🔑 임시 비밀번호 발급</p>
          <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">
            비밀번호를 잊은 학생에게 발급해 주세요. 발급하면 기존 비밀번호는 쓸 수
            없게 됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="shrink-0 h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-bold disabled:opacity-50"
        >
          {pending ? "발급 중…" : "발급"}
        </button>
      </div>

      {error && <p className="text-sm text-cat-hum font-semibold">{error}</p>}

      {tempPw && (
        <div className="rounded-button bg-[color-mix(in_oklab,var(--color-cat-sci)_10%,white)] border border-[var(--color-cat-sci)] px-4 py-3 space-y-1">
          <p className="text-xs font-bold text-cat-sci">
            임시 비밀번호가 발급됐어요
          </p>
          <p
            className="font-mono font-bold text-fg-strong tracking-widest"
            style={{ fontSize: 24 }}
          >
            {tempPw}
          </p>
          <p className="text-[11px] text-fg-muted leading-relaxed">
            학생에게 직접 알려 주세요. 로그인 후{" "}
            <b className="text-fg-strong">마이페이지 → 비밀번호 변경</b>에서 새
            비밀번호로 바꾸도록 안내해 주세요. 이 화면을 벗어나면 다시 볼 수 없어요.
          </p>
        </div>
      )}
    </Card>
  );
}
