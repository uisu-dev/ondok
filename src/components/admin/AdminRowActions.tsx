"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminRowActions({
  id,
  published,
}: {
  id: number;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function togglePublished() {
    setBusy(true);
    try {
      await fetch(`/api/admin/worksheets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("정말 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusy(true);
    try {
      await fetch(`/api/admin/worksheets/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={togglePublished}
        disabled={busy}
        className="font-semibold text-fg-muted hover:text-fg-strong disabled:opacity-50"
      >
        {published ? "비공개로" : "공개로"}
      </button>
      <button
        onClick={remove}
        disabled={busy}
        className="font-semibold text-cat-hum hover:opacity-80 disabled:opacity-50"
      >
        삭제
      </button>
    </>
  );
}
