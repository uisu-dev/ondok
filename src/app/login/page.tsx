"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { loginIdToEmail, LOGIN_ID_RE } from "@/lib/login-id";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/mypage";

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = loginId.trim().toLowerCase();
    if (!LOGIN_ID_RE.test(id)) {
      setError("아이디 형식이 올바르지 않습니다.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상입니다.");
      return;
    }
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: loginIdToEmail(id),
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            setError("아이디 또는 비밀번호가 올바르지 않습니다.");
          } else {
            setError(error.message);
          }
          return;
        }
        router.replace(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "로그인 시도 중 오류가 발생했어요.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-[420px] px-6 py-12 space-y-4">
      <div className="text-xs font-semibold text-fg-muted">
        <Link href="/" className="hover:text-fg-strong">
          ← 홈으로
        </Link>
      </div>
      <Card as="section" className="px-6 py-8 space-y-5">
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-accent-600">온독 플러스</p>
          <h1 className="text-xl font-bold text-fg-strong">로그인</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-fg-strong" htmlFor="login_id">
              아이디
            </label>
            <input
              id="login_id"
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username"
              className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-fg-strong" htmlFor="pw">
              비밀번호
            </label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-cat-hum font-semibold">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full h-12 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {pending ? "로그인 중…" : "로그인"}
          </button>
        </form>
        <div className="text-center text-xs text-fg-subtle">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-accent-600 font-semibold">
            회원가입
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 w-full">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[420px] px-6 py-12">
            <Card as="section" className="px-6 py-8 text-center text-sm text-fg-muted">
              로그인 화면을 불러오는 중…
            </Card>
          </div>
        }
      >
        <LoginInner />
      </Suspense>
    </main>
  );
}
