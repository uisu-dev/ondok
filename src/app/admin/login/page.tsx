"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (!data.ok) {
        setError(data.error ?? "로그인에 실패했어요.");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/admin");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[420px] px-6 py-12 space-y-4">
        <div className="text-xs font-semibold text-fg-muted">
          <Link href="/" className="hover:text-fg-strong">
            ← 홈으로
          </Link>
        </div>
        <Card as="section" className="px-6 py-8 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-accent-600">Supabase Auth</p>
            <h1 className="text-xl font-bold text-fg-strong">관리자 로그인</h1>
          </div>
          <p className="text-sm text-fg-muted leading-relaxed">
            Supabase 계정으로 로그인하면 활동지를 작성하고 관리할 수 있어요.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              placeholder="이메일"
              className="w-full h-12 px-4 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none text-fg-strong"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="비밀번호"
              className="w-full h-12 px-4 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none text-fg-strong"
            />
            {error && (
              <p className="text-sm text-cat-hum font-semibold">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full"
            >
              {loading ? "확인 중…" : "로그인"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
