"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { applyForTeacher, cancelTeacherApplication } from "./actions";

interface Props {
  status: "none" | "pending" | "approved" | "rejected";
  note: string | null;
}

const STATUS_TONE: Record<string, string> = {
  none: "bg-surface-muted text-fg-muted",
  pending: "bg-accent-100 text-accent-700",
  approved: "bg-cat-sci/15 text-cat-sci",
  rejected: "bg-cat-hum/15 text-cat-hum",
};

const STATUS_LABEL: Record<string, string> = {
  none: "미신청",
  pending: "심사 중",
  approved: "승인됨",
  rejected: "반려됨",
};

export function TeacherApplicationCard({ status, note }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setError(null);
    startTransition(async () => {
      const res = await applyForTeacher();
      if (!res.ok) setError(res.message);
    });
  }

  function cancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelTeacherApplication();
      if (!res.ok) setError(res.message);
    });
  }

  return (
    <Card as="section" className="px-6 py-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-fg-muted">교원 승인 신청</p>
          <p className="text-base font-bold text-fg-strong mt-1">
            교사이신 경우 권한 승급을 신청해 주세요
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-chip text-xs font-bold ${
            STATUS_TONE[status] ?? STATUS_TONE.none
          }`}
        >
          {STATUS_LABEL[status] ?? STATUS_LABEL.none}
        </span>
      </div>

      {status === "none" && (
        <>
          <p className="text-sm text-fg-muted leading-relaxed">
            등록된 이름과 학교를 관리자가 확인한 뒤 교원으로 승급해 드립니다. 신청 후 보통 1~2일
            이내에 처리됩니다.
          </p>
          <button
            type="button"
            onClick={apply}
            disabled={pending}
            className="h-10 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "신청 중…" : "교원 승인 신청"}
          </button>
        </>
      )}

      {status === "pending" && (
        <>
          <p className="text-sm text-fg-muted leading-relaxed">
            신청이 접수되었습니다. 관리자가 확인 후 권한을 변경해 드립니다. 잘못 신청한 경우 아래에서
            취소할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="h-10 px-4 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "취소 중…" : "신청 취소"}
          </button>
        </>
      )}

      {status === "rejected" && (
        <>
          <p className="text-sm text-cat-hum font-semibold">
            신청이 반려되었습니다. {note ? `사유: ${note}` : ""}
          </p>
          <p className="text-sm text-fg-muted leading-relaxed">
            이름이나 학교 정보를 다시 확인하고 재신청해 주세요.
          </p>
          <button
            type="button"
            onClick={apply}
            disabled={pending}
            className="h-10 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "신청 중…" : "다시 신청"}
          </button>
        </>
      )}

      {error && (
        <p className="text-sm text-cat-hum font-semibold">{error}</p>
      )}
    </Card>
  );
}
