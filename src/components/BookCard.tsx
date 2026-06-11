"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { splitIntoParagraphs } from "@/lib/text";
import { bookSearchUrl } from "@/lib/book-link";
import { HeartButton } from "@/components/HeartButton";
import type { Book } from "@/lib/types";

/**
 * 책 정보 카드 — 퀴즈 결과·책 상세 페이지에서 공용으로 사용.
 * reasons 가 있으면 추천 이유 칩을 함께 보여줌(퀴즈 결과용).
 */
export function BookCard({
  book,
  favorited,
  signedIn,
  reasons,
}: {
  book: Book;
  favorited: boolean;
  signedIn: boolean;
  reasons?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const paragraphs = splitIntoParagraphs(book.description, 3);
  const hasMore = paragraphs.length > 1;
  const visible = expanded || !hasMore ? paragraphs : [paragraphs[0]];

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
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 flex-1">
            <Chip tone={book.category}>{book.category}</Chip>
            <Chip tone="neutral">온독지수 {book.ondokIndex}</Chip>
          </div>
          <HeartButton
            kind="book"
            targetId={book.id}
            initialFavorited={favorited}
            enabled={signedIn}
            size="sm"
          />
        </div>
        <h3 className="text-lg font-bold text-fg-strong leading-snug">
          {book.title}
        </h3>
        <p className="text-sm text-fg-muted">
          {book.author} · {book.publisher} · {book.year}
        </p>

        {/* Paragraph-separated description */}
        <div className="space-y-2.5 text-sm text-fg leading-relaxed">
          {visible.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-accent-600 font-semibold hover:text-accent-700"
            >
              {expanded ? "접기" : "더보기"}
            </button>
          )}
        </div>

        {reasons && reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {reasons.slice(0, 3).map((r, i) => (
              <Chip key={i} tone="accent">
                {r}
              </Chip>
            ))}
          </div>
        )}
        <div className="pt-1">
          <a
            href={bookSearchUrl(book)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            네이버 도서 검색 →
          </a>
        </div>
      </div>
    </Card>
  );
}
