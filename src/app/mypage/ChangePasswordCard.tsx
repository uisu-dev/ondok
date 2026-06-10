"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw1.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 해요.");
      return;
    }
    if (pw1 !== pw2) {
      setError("비밀번호 확인이 일치하지 않아요.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
      setPw1("");
      setPw2("");
    });
  }

  return (
    <Card as="section" className="px-6 py-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-fg-muted">보안</p>
          <p className="text-base font-bold text-fg-strong mt-1">비밀번호 변경</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setDone(false);
            }}
            className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold"
          >
            변경하기
          </button>
        )}
      </div>

      {done && (
        <p className="text-sm text-cat-sci font-semibold">
          ✓ 비밀번호가 변경됐어요.
        </p>
      )}

      {open && !done && (
        <form onSubmit={submit} className="space-y-2">
          <input
            type="password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            placeholder="새 비밀번호 (8자 이상)"
            autoComplete="new-password"
            className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            minLength={8}
            required
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="새 비밀번호 확인"
            autoComplete="new-password"
            className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            minLength={8}
            required
          />
          {error && <p className="text-sm text-cat-hum font-semibold">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="h-10 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "변경 중…" : "비밀번호 저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
                setPw1("");
                setPw2("");
              }}
              disabled={pending}
              className="h-10 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-semibold disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
