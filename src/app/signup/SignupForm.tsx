"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "./actions";
import { LOGIN_ID_RE } from "@/lib/login-id";
import { MIN_BIRTH_YEAR, maxBirthYear, estimateGradeLabel } from "@/lib/grade";

interface School {
  code: string;
  name: string;
  type: string;
}

const TYPE_LABEL: Record<string, string> = {
  middle: "중학교",
  high: "고등학교",
  special: "특수학교",
};

export function SignupForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [filter, setFilter] = useState("");
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "middle" | "high" | "special">("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim();
    return schools
      .filter((s) => (typeFilter === "all" ? true : s.type === typeFilter))
      .filter((s) => (q ? s.name.includes(q) : true))
      .slice(0, 60);
  }, [schools, filter, typeFilter]);

  const selected = useMemo(
    () => schools.find((s) => s.code === schoolCode) ?? null,
    [schools, schoolCode]
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = loginId.trim().toLowerCase();
    const nm = name.trim();
    if (!LOGIN_ID_RE.test(id)) {
      setError("아이디는 영문 소문자로 시작하는 4~20자입니다. (영문/숫자/_/. 허용)");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상 입력해 주세요.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (nm.length < 2) {
      setError("이름은 2자 이상 입력해 주세요.");
      return;
    }
    const by = Number(birthYear);
    if (!Number.isInteger(by) || by < MIN_BIRTH_YEAR || by > maxBirthYear()) {
      setError(`출생연도를 ${MIN_BIRTH_YEAR}~${maxBirthYear()} 사이로 입력해 주세요.`);
      return;
    }
    if (!schoolCode) {
      setError("소속 학교를 선택해 주세요.");
      return;
    }
    startTransition(async () => {
      const res = await signUp({
        loginId: id,
        password,
        displayName: nm,
        birthYear: by,
        schoolCode,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.replace("/mypage");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-fg-strong" htmlFor="login_id">
          아이디
        </label>
        <input
          id="login_id"
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="영문 소문자로 시작 (4~20자)"
          autoComplete="username"
          className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
          maxLength={20}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-fg-strong" htmlFor="pw1">
            비밀번호
          </label>
          <input
            id="pw1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상"
            autoComplete="new-password"
            className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-fg-strong" htmlFor="pw2">
            비밀번호 확인
          </label>
          <input
            id="pw2"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="다시 한번"
            autoComplete="new-password"
            className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            minLength={8}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-fg-strong" htmlFor="name">
            이름
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="실명을 입력해 주세요"
            className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            maxLength={40}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-fg-strong" htmlFor="birthYear">
            출생연도
          </label>
          <input
            id="birthYear"
            type="number"
            inputMode="numeric"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="예: 2011"
            min={MIN_BIRTH_YEAR}
            max={maxBirthYear()}
            className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
            required
          />
          {birthYear && estimateGradeLabel(Number(birthYear)) && (
            <p className="text-xs text-accent-600 font-semibold">
              {estimateGradeLabel(Number(birthYear))}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-fg-strong">
          소속 학교{" "}
          {selected ? <span className="text-accent-600">· {selected.name}</span> : null}
        </label>
        <div className="flex gap-1">
          {(["all", "middle", "high", "special"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`h-8 px-3 rounded-full text-xs font-semibold transition-all ${
                typeFilter === t
                  ? "bg-accent-600 text-white"
                  : "bg-surface-muted text-fg-muted hover:bg-border"
              }`}
            >
              {t === "all" ? "전체" : TYPE_LABEL[t]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="학교명 검색 (예: 천안중앙)"
          className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
        />
        <div className="rounded-card border border-border overflow-hidden">
          <ul className="max-h-64 overflow-y-auto divide-y divide-border">
            {visible.length === 0 ? (
              <li className="px-3 py-4 text-xs text-fg-muted text-center">
                일치하는 학교가 없습니다.
              </li>
            ) : (
              visible.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setSchoolCode(s.code)}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                      schoolCode === s.code
                        ? "bg-accent-100 text-accent-700 font-semibold"
                        : "text-fg-strong hover:bg-surface-muted"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-fg-subtle">
                      {TYPE_LABEL[s.type] ?? s.type}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {error && (
        <p className="text-sm text-cat-hum font-semibold">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-semibold disabled:opacity-50 transition-colors"
      >
        {pending ? "가입 중…" : "가입 완료"}
      </button>
    </form>
  );
}
