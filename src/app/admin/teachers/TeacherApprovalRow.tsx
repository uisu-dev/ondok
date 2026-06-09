"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { approveTeacher, rejectTeacher } from "./actions";

interface Props {
  id: string;
  displayName: string;
  schoolName: string;
  loginId: string | null;
  appliedAt: string | null;
}

export function TeacherApprovalRow({
  id,
  displayName,
  schoolName,
  loginId,
  appliedAt,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  function onApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveTeacher(id);
      if (!res.ok) setError(res.message);
      else setDone("approved");
    });
  }

  function onReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectTeacher(id, rejectNote.trim() || null);
      if (!res.ok) setError(res.message);
      else setDone("rejected");
    });
  }

  if (done) {
    return (
      <Card as="article" className="px-5 py-4 bg-surface-muted">
        <p className="text-sm font-semibold text-fg-muted">
          {displayName} · {schoolName} — {done === "approved" ? "교원으로 승인됨 ✓" : "반려됨 ✕"}
        </p>
      </Card>
    );
  }

  return (
    <Card as="article" className="px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-fg-strong">{displayName}</p>
          <p className="text-sm text-fg-muted">{schoolName}</p>
          {loginId && (
            <p className="text-xs text-fg-subtle mt-1 truncate">
              아이디 · <span className="font-mono">{loginId}</span>
            </p>
          )}
        </div>
        <p className="text-xs text-fg-subtle shrink-0">
          {appliedAt
            ? new Date(appliedAt).toLocaleString("ko-KR")
            : "신청일 없음"}
        </p>
      </div>
      {showReject ? (
        <div className="space-y-2">
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="반려 사유 (선택, 신청자에게 보입니다)"
            className="w-full min-h-[68px] px-3 py-2 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            maxLength={200}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReject}
              disabled={pending}
              className="h-9 px-3 rounded-button bg-cat-hum hover:brightness-95 text-white text-xs font-semibold disabled:opacity-50"
            >
              {pending ? "반려 중…" : "반려 확정"}
            </button>
            <button
              type="button"
              onClick={() => setShowReject(false)}
              disabled={pending}
              className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold disabled:opacity-50"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="h-9 px-3 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold disabled:opacity-50"
          >
            {pending ? "승인 중…" : "교원으로 승인"}
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold disabled:opacity-50"
          >
            반려
          </button>
        </div>
      )}
      {error && (
        <p className="text-sm text-cat-hum font-semibold">{error}</p>
      )}
    </Card>
  );
}
