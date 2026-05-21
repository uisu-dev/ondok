"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { buttonClass } from "@/components/ui/Button";
import { OnthinkingBanner } from "@/components/OnthinkingBanner";
import type { Book, QuizAnswer, Recommendation } from "@/lib/types";
import { recommend } from "@/lib/recommend";
import { labelForMBTI } from "@/lib/mbti";
import { getAllBooks, logQuiz } from "@/data/books";

export default function ResultPage() {
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [answer, setAnswer] = useState<QuizAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("ondok:answers");
    if (!raw) {
      setError("진단 결과가 없어요. 처음부터 다시 시작해 주세요.");
      return;
    }
    let parsed: QuizAnswer;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError("결과를 불러오지 못했어요.");
      return;
    }
    setAnswer(parsed);

    let cancelled = false;
    (async () => {
      const books: Book[] = await getAllBooks();
      if (cancelled) return;
      const list = recommend(books, parsed, 4);
      setRecs(list);
      logQuiz({
        mbti: parsed.mbti,
        interests: parsed.interests,
        mood: parsed.mood,
        pace: parsed.pace,
        recommendedBookIds: list.map((r) => r.book.id),
      }).catch(() => {});
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

  return (
    <main className="flex-1 w-full">
      <div className="mx-auto max-w-[720px] px-6 py-10 space-y-6">
        <Card as="section" className="px-6 py-7 space-y-3 text-center">
          <p className="text-sm font-semibold text-accent-600">
            너의 진단 결과
          </p>
          <h1 className="text-3xl font-bold text-fg-strong">
            {answer.mbti}{" "}
            <span className="text-fg">· {labelForMBTI(answer.mbti)}</span>
          </h1>
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {answer.interests.map((c) => (
              <Chip key={c} tone={c}>
                {c}
              </Chip>
            ))}
            <Chip tone="accent">{moodLabel(answer.mood)}</Chip>
            <Chip tone="neutral">{paceLabel(answer.pace)}</Chip>
          </div>
        </Card>

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
            <BookCard key={rec.book.id} rec={rec} />
          ))}
        </div>

        <Card as="section" className="px-6 py-5 flex flex-wrap gap-3 justify-center">
          <Link href="/quiz" className={buttonClass("primary")}>
            다시 진단하기
          </Link>
          <Link href="/" className={buttonClass("secondary")}>
            홈으로
          </Link>
        </Card>

        <OnthinkingBanner />
      </div>
    </main>
  );
}

function BookCard({ rec }: { rec: Recommendation }) {
  const { book } = rec;
  const [expanded, setExpanded] = useState(false);
  const desc = book.description;
  const isLong = desc.length > 180;
  const shown = expanded || !isLong ? desc : desc.slice(0, 180) + "…";

  return (
    <Card as="article" interactive className="p-5 flex gap-4">
      <div className="shrink-0 w-24 sm:w-28">
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-muted">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={`${book.title} 표지`}
              fill
              sizes="112px"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip tone={book.category}>{book.category}</Chip>
          <Chip tone="neutral">온독지수 {book.ondokIndex}</Chip>
        </div>
        <h3 className="text-lg font-bold text-fg-strong leading-snug">
          {book.title}
        </h3>
        <p className="text-sm text-fg-muted">
          {book.author} · {book.publisher} · {book.year}
        </p>
        <p className="text-sm text-fg leading-relaxed whitespace-pre-line">
          {shown}{" "}
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-accent-600 font-semibold hover:text-accent-700"
            >
              {expanded ? "접기" : "더보기"}
            </button>
          )}
        </p>
        {rec.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rec.reasons.slice(0, 3).map((r, i) => (
              <Chip key={i} tone="accent">
                {r}
              </Chip>
            ))}
          </div>
        )}
        <div className="pt-1">
          <a
            href={book.naverLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            네이버에서 보기 →
          </a>
        </div>
      </div>
    </Card>
  );
}

function moodLabel(m: QuizAnswer["mood"]): string {
  return (
    { warm: "따뜻한", exciting: "신나는", calm: "잔잔한", deep: "깊이 있는", adventurous: "모험적인" } as const
  )[m];
}
function paceLabel(p: QuizAnswer["pace"]): string {
  return ({ story: "이야기 위주", info: "정보 위주", mixed: "균형 잡힌" } as const)[p];
}
