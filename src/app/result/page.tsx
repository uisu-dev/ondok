"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { buttonClass } from "@/components/ui/Button";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";
import type {
  Book,
  Mood,
  Pace,
  QuizAnswer,
  Recommendation,
} from "@/lib/types";
import { recommend } from "@/lib/recommend";
import { labelForMBTI } from "@/lib/mbti";
import { topicByKey } from "@/lib/interests";
import { careerByKey } from "@/lib/careers";
import { getAllBooks, logQuiz } from "@/data/books";
import { BookCard } from "@/components/BookCard";

export default function ResultPage() {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [answer, setAnswer] = useState<QuizAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("ondok:answers");
    if (!raw) {
      setError("진단 결과가 없어요. 처음부터 다시 시작해 주세요.");
      return;
    }
    let parsed: QuizAnswer;
    try {
      parsed = JSON.parse(raw);
      // Backward compat: pre-mode answers were mbti by shape.
      if (!parsed.mode && "mbti" in parsed) {
        (parsed as QuizAnswer).mode = "mbti";
      }
    } catch {
      setError("결과를 불러오지 못했어요.");
      return;
    }
    setAnswer(parsed);

    // MBTI 진단이면 로그인 사용자의 프로필에 결과 저장 (비로그인은 무시됨)
    if (parsed.mode === "mbti" && parsed.mbti) {
      fetch("/api/me/mbti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mbti: parsed.mbti }),
      }).catch(() => {});
    }

    let cancelled = false;
    (async () => {
      const books: Book[] = await getAllBooks();
      if (cancelled) return;
      const list = recommend(books, parsed, 4);
      setRecs(list);
      logQuiz(parsed, list.map((r) => r.book.id)).catch(() => {});

      // 즐겨찾기 상태 가져오기
      try {
        const res = await fetch("/api/favorites?kind=book", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.ok) {
          setSignedIn(!!json.signedIn);
          setFavIds(new Set<string>(json.ids ?? []));
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[640px] px-6 py-12 text-center space-y-4">
          <p className="text-fg-muted">{error}</p>
          <Link href="/" className={buttonClass("primary")}>
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  if (!recs || !answer) {
    return (
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-[640px] px-6 py-12 text-center">
          <p className="text-fg-muted">결과를 준비하고 있어요...</p>
        </div>
      </main>
    );
  }

  const retryHref =
    answer.mode === "mbti"
      ? "/quiz/mbti"
      : answer.mode === "interest"
        ? "/quiz/interest"
        : "/quiz/career";

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-10 space-y-6">
        <AnswerSummary answer={answer} />

        {recs.length === 0 ? (
          <Card as="section" className="px-6 py-7 text-center space-y-3">
            <p className="text-fg-muted">
              아쉽게도 답변과 맞는 책을 찾지 못했어요.
              <br />
              다른 조합으로 다시 시도해 주세요.
            </p>
          </Card>
        ) : (
          <>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-fg-strong px-1">
                너에게 추천하는 책 {recs.length}권
              </h2>
              <p className="text-sm text-fg-muted px-1">
                온독지수 추천도서 214권 중에서 골랐어요.
              </p>
            </div>

            <div className="space-y-4">
              {recs.map((rec) => (
                <BookCard
                  key={rec.book.id}
                  book={rec.book}
                  reasons={rec.reasons}
                  favorited={favIds.has(String(rec.book.id))}
                  signedIn={signedIn}
                />
              ))}
            </div>
          </>
        )}

        <Card as="section" className="px-6 py-5 flex flex-wrap gap-3 justify-center">
          <Link href={retryHref} className={buttonClass("primary")}>
            다시 진단하기
          </Link>
          <Link href="/" className={buttonClass("secondary")}>
            다른 방법으로 찾기
          </Link>
        </Card>

        <OnthinkingBanner />
      </div>
    </main>
  );
}

function AnswerSummary({ answer }: { answer: QuizAnswer }) {
  if (answer.mode === "mbti") {
    return (
      <Card as="section" className="px-6 py-7 space-y-3 text-center">
        <p className="text-sm font-semibold text-accent-600">너의 진단 결과</p>
        <h1 className="text-3xl font-bold text-fg-strong">
          {answer.mbti}{" "}
          <span className="text-fg">· {labelForMBTI(answer.mbti)}</span>
        </h1>
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {answer.interests.map((c) => (
            <Chip key={c} tone={c}>{c}</Chip>
          ))}
          <Chip tone="accent">{moodLabel(answer.mood)}</Chip>
          <Chip tone="neutral">{paceLabel(answer.pace)}</Chip>
        </div>
      </Card>
    );
  }

  if (answer.mode === "interest") {
    const topics = answer.topics.map((k) => topicByKey(k)).filter(Boolean);
    return (
      <Card as="section" className="px-6 py-7 space-y-3 text-center">
        <p className="text-sm font-semibold text-accent-600">너의 관심사</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {topics.map((t) =>
            t ? (
              <span
                key={t.key}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-accent-50 text-accent-700 text-sm font-semibold"
              >
                <span className="text-base leading-none">{t.emoji}</span>
                {t.label}
              </span>
            ) : null
          )}
        </div>
      </Card>
    );
  }

  const career = careerByKey(answer.career);
  return (
    <Card as="section" className="px-6 py-7 space-y-3 text-center">
      <p className="text-sm font-semibold text-accent-600">너의 진로</p>
      {career && (
        <>
          <h1 className="text-2xl font-bold text-fg-strong">
            <span className="text-3xl leading-none mr-1">{career.emoji}</span>
            {career.label}
          </h1>
          <p className="text-sm text-fg-muted max-w-[420px] mx-auto">
            {career.description}
          </p>
        </>
      )}
    </Card>
  );
}

function moodLabel(m: Mood): string {
  return ({ warm: "따뜻한", exciting: "신나는", calm: "잔잔한", deep: "깊이 있는", adventurous: "모험적인" } as const)[m];
}
function paceLabel(p: Pace): string {
  return ({ story: "이야기 위주", info: "정보 위주", mixed: "균형 잡힌" } as const)[p];
}
