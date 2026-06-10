"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { issueTempPassword } from "./actions";

interface Props {
  id: string;
  loginId: string | null;
  displayName: string;
  schoolName: string;
  roleLabel: string;
}

export function UserRow({ id, loginId, displayName, schoolName, roleLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function issue() {
    if (
      !confirm(
        `${displayName}(${loginId ?? "?"}) 님의 비밀번호를 임시 비밀번호로 재설정할까요?\n기존 비밀번호는 더 이상 사용할 수 없게 됩니다.`
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await issueTempPassword(id);
      if (!res.ok) setError(res.message);
      else setTempPw(res.password);
    });
  }

  return (
    <Card as="article" className="px-5 py-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-fg-strong">
            {displayName}
            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-chip bg-surface-muted text-fg-muted align-middle">
              {roleLabel}
            </span>
          </p>
          <p className="text-sm text-fg-muted">{schoolName}</p>
          {loginId && (
            <p className="text-xs text-fg-subtle mt-1">
              아이디 · <span className="font-mono">{loginId}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={issue}
          disabled={pending}
          className="shrink-0 h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold disabled:opacity-50"
        >
          {pending ? "발급 중…" : "임시 비번 발급"}
        </button>
      </div>

      {tempPw && (
        <div className="rounded-button bg-accent-50 border border-accent-200 px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-accent-700">
            임시 비밀번호가 발급됐어요
          </p>
          <p className="text-lg font-bold font-mono text-fg-strong tracking-wide">
            {tempPw}
          </p>
          <p className="text-[11px] text-fg-muted leading-relaxed">
            이 비밀번호를 사용자에게 직접 전달하세요. 로그인 후 <strong>마이페이지 → 비밀번호 변경</strong>에서
            새 비밀번호로 바꾸도록 안내해 주세요. (이 화면을 벗어나면 다시 볼 수 없어요)
          </p>
        </div>
      )}
      {error && <p className="text-sm text-cat-hum font-semibold">{error}</p>}
    </Card>
  );
}
