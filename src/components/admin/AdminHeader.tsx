"use client";

import Link from "next/link";

export function AdminHeader() {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/";
  }
  return (
    <div className="bg-surface-muted border-b border-border print:hidden">
      <div className="mx-auto max-w-[820px] px-6 py-3 flex items-center justify-between">
        <Link href="/admin" className="text-sm font-bold text-accent-600">
          🔐 관리자 모드
        </Link>
        <div className="flex items-center gap-4 text-xs text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            사이트로
          </Link>
          <button onClick={logout} className="hover:text-fg-strong">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
