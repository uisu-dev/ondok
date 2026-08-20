"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "./actions";
import { LOGIN_ID_RE } from "@/lib/login-id";
import {
  MIN_BIRTH_YEAR,
  maxBirthYear,
  estimateGradeLabel,
  gradeOptions,
  CLASS_OPTIONS,
} from "@/lib/grade";
import type { AccountType } from "./actions";

interface School {
  code: string;
  name: string;
  type: string;
}

/** 목록에 없는 학교라면 여기로 가입하도록 안내한다. */
const FALLBACK_SCHOOL_NAME = "충남교육청";

export function SignupForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [filter, setFilter] = useState("");
  const [schoolCode, setSchoolCode] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [grade, setGrade] = useState<number | null>(null);
  const [classNo, setClassNo] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim();
    return schools.filter((s) => (q ? s.name.includes(q) : true)).slice(0, 60);
  }, [schools, filter]);

  const selected = useMemo(
    () => schools.find((s) => s.code === schoolCode) ?? null,
    [schools, schoolCode]
  );

  const fallback = useMemo(
    () => schools.find((s) => s.name === FALLBACK_SCHOOL_NAME) ?? null,
    [schools]
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
    if (accountType === "student") {
      if (grade == null) {
        setError("학년을 선택해 주세요.");
        return;
      }
      if (classNo == null) {
        setError("반을 선택해 주세요.");
        return;
      }
    }
    startTransition(async () => {
      const res = await signUp({
        loginId: id,
        password,
        displayName: nm,
        birthYear: by,
        schoolCode,
        accountType,
        grade: accountType === "student" ? grade : null,
        classNo: accountType === "student" ? classNo : null,
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
      {/* 계정 유형 — 교사는 관리자 승인을 거쳐야 권한이 올라간다 */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-fg-strong">가입 유형</span>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { key: "student", emoji: "🎒", label: "학생", hint: "바로 이용" },
              { key: "teacher", emoji: "🧑‍🏫", label: "교사", hint: "승인 후 이용" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setAccountType(t.key)}
              aria-pressed={accountType === t.key}
              className={`h-[72px] rounded-button border-2 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                accountType === t.key
                  ? "border-accent-600 bg-accent-50"
                  : "border-border bg-surface hover:border-accent-300"
              }`}
            >
              <span aria-hidden className="text-xl leading-none">
                {t.emoji}
              </span>
              <span
                className={`text-sm font-bold ${
                  accountType === t.key ? "text-accent-700" : "text-fg-strong"
                }`}
              >
                {t.label}
              </span>
              <span className="text-[10px] text-fg-subtle">{t.hint}</span>
            </button>
          ))}
        </div>
        {accountType === "teacher" && (
          <div className="rounded-button bg-surface-muted px-4 py-3 space-y-1">
            <p className="text-xs font-bold text-fg-strong">
              교사 계정은 관리자 승인이 필요해요
            </p>
            <p className="text-[11px] text-fg-muted leading-relaxed">
              가입은 바로 되지만, 승인 전까지는 학생과 같은 화면만 보입니다.
              등록하신 이름과 학교를 관리자가 확인한 뒤 교원으로 올려 드려요.
              보통 1~2일 이내에 처리됩니다.
            </p>
          </div>
        )}
      </div>

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
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="학교명 검색 (예: 천안중앙, 북일, 영명)"
          className="w-full h-11 px-3 rounded-button border border-border bg-surface text-sm text-fg-strong focus:outline-none focus:border-accent-500"
        />
        {visible.length === 0 ? (
          // 목록에 없는 학교일 수 있으므로 대신 고를 곳을 알려 준다
          <div className="rounded-card border border-border bg-surface-muted px-4 py-4 space-y-2">
            <p className="text-sm font-bold text-fg-strong">
              찾으시는 학교가 없나요?
            </p>
            <p className="text-xs text-fg-muted leading-relaxed">
              아직 목록에 없는 학교일 수 있어요. 그럴 때는{" "}
              <b className="text-fg-strong">{FALLBACK_SCHOOL_NAME}</b>으로 가입하시고,
              선생님께 학교 이름을 알려 주세요.
            </p>
            {fallback && (
              <button
                type="button"
                onClick={() => {
                  setSchoolCode(fallback.code);
                  setFilter("");
                }}
                className="h-10 px-4 rounded-button bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold"
              >
                {FALLBACK_SCHOOL_NAME}으로 선택
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-card border border-border overflow-hidden">
            <ul className="max-h-64 overflow-y-auto divide-y divide-border">
              {visible.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    onClick={() => setSchoolCode(s.code)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      schoolCode === s.code
                        ? "bg-accent-100 text-accent-700 font-semibold"
                        : "text-fg-strong hover:bg-surface-muted"
                    }`}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 학년·반 — 학생만. 통계를 반 단위로 묶는 데 쓴다 */}
      {accountType === "student" && (
        <div className="space-y-3">
          <div>
            <span className="text-sm font-semibold text-fg-strong">학년 · 반</span>
            <p className="text-[11px] text-fg-subtle mt-0.5">
              선생님이 우리 반 학습 현황을 볼 때 쓰여요. 나중에 바꿀 수 있어요.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {gradeOptions(selected?.type).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                aria-pressed={grade === g}
                className={`h-11 min-w-[72px] px-4 rounded-button border-2 text-sm font-bold transition-colors ${
                  grade === g
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-border bg-surface text-fg-strong hover:border-accent-300"
                }`}
              >
                {g}학년
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {CLASS_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setClassNo(c)}
                aria-pressed={classNo === c}
                className={`h-11 rounded-button border-2 text-sm font-bold transition-colors ${
                  classNo === c
                    ? "border-accent-600 bg-accent-600 text-white"
                    : "border-border bg-surface text-fg-strong hover:border-accent-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-cat-hum font-semibold">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full h-12 rounded-button bg-accent-600 hover:bg-accent-700 text-white font-semibold disabled:opacity-50 transition-colors"
      >
        {pending
          ? "가입 중…"
          : accountType === "teacher"
            ? "가입하고 교원 승인 신청"
            : "가입 완료"}
      </button>
    </form>
  );
}
