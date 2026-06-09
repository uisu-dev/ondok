"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="h-9 px-3 rounded-button bg-surface-muted hover:bg-border text-fg-strong text-xs font-semibold disabled:opacity-50"
    >
      {pending ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
