"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { removeStudentAccount } from "./actions";

export function RemoveAccountCard({
  userId,
  displayName,
  loginId,
}: {
  userId: string;
  displayName: string;
  loginId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("부적절한 아이디 사용");
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const needed = loginId ?? displayName;
  const canSubmit = confirmText.trim() === needed && !pending;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await removeStudentAccount(userId, reason);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/admin/students"), 1200);
    });
  }

  if (done) {
    return (
      <Card as="section" className="px-6 py-5 bg-surface-muted">
        <p className="text-sm font-bold text-fg-strong">
          ✓ 계정이 탈퇴 처리되었습니다.
        </p>
        <p className="text-xs text-fg-muted mt-1">
          학생 현황으로 돌아갑니다…
        </p>
      </Card>
    );
  }

  return (
    <Card
      as="section"
      className="px-6 py-5 space-y-3 border border-cat-hum/40 bg-[color-mix(in_oklab,var(--color-cat-hum)_5%,white)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cat-hum">⚠️ 계정 탈퇴 처리</p>
          <p className="text-xs text-fg-muted mt-0.5">
            부적절한 아이디·이름을 사용하는 계정을 삭제합니다.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 h-9 px-3 rounded-button bg-cat-hum hover:brightness-95 text-white text-xs font-bold"
          >
            탈퇴 처리
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-3">
          <div className="rounded-button bg-surface border border-border px-4 py-3 space-y-1">
            <p className="text-xs text-fg-strong leading-relaxed">
              이 계정의 <strong>학습 기록·답안·즐겨찾기가 모두 삭제</strong>되며 되돌릴 수
              없습니다. 해당 아이디로는 다시 가입할 수 없고, 로그인 시도 시 탈퇴
              사유가 안내됩니다.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg-strong">
              탈퇴 사유 (학생에게 표시됩니다)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
              className="w-full h-10 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-fg-strong">
              확인을 위해 <span className="font-mono text-cat-hum">{needed}</span> 를
              그대로 입력하세요
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={needed}
              autoComplete="off"
              className="w-full h-10 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong font-mono focus:outline-none focus:border-cat-hum"
            />
          </div>

          {error && <p className="text-sm text-cat-hum font-semibold">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="h-10 px-4 rounded-button bg-cat-hum hover:brightness-95 text-white text-sm font-bold disabled:opacity-40"
            >
              {pending ? "처리 중…" : "탈퇴 처리 확정"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText("");
                setError(null);
              }}
              disabled={pending}
              className="h-10 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-semibold disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
