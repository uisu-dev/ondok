"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  QTYPE_LABEL,
  TYPE_EMOJI,
  TYPE_LABEL,
  type QuestionOption,
  type QuestionType,
  type WorksheetDraft,
  type WorksheetType,
} from "@/lib/worksheet-types";

interface BookOption {
  id: number;
  title: string;
  author: string;
  publisher: string;
  category: string;
  year: number;
  ondokIndex: number;
}

interface DraftQ {
  uid: string;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  sampleAnswer?: string;
  rubric?: string;
  imageUrl?: string;
}

const newUid = () => Math.random().toString(36).slice(2);
const LABELS = ["①", "②", "③", "④", "⑤", "⑥"];

function makeBlankQ(t: QuestionType): DraftQ {
  if (t === "multiple_choice") {
    return {
      uid: newUid(),
      type: t,
      prompt: "",
      options: [0, 1, 2, 3].map((i) => ({
        label: LABELS[i],
        text: "",
        correct: false,
      })),
    };
  }
  if (t === "true_false") {
    return {
      uid: newUid(),
      type: t,
      prompt: "",
      options: [
        { label: "O", text: "O", correct: true },
        { label: "X", text: "X", correct: false },
      ],
    };
  }
  if (t === "short_answer") {
    return { uid: newUid(), type: t, prompt: "", sampleAnswer: "" };
  }
  return { uid: newUid(), type: t, prompt: "", rubric: "" };
}

export function WorksheetEditor({
  type,
  books,
}: {
  type: WorksheetType;
  books: BookOption[] | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [bookId, setBookId] = useState<number | null>(null);
  const [bookFilter, setBookFilter] = useState("");
  const [source, setSource] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [passage, setPassage] = useState("");
  const [passageImageUrl, setPassageImageUrl] = useState<string | undefined>(
    undefined
  );
  const [questions, setQuestions] = useState<DraftQ[]>([
    makeBlankQ("multiple_choice"),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addQ(t: QuestionType) {
    setQuestions((qs) => [...qs, makeBlankQ(t)]);
  }
  function removeQ(uid: string) {
    setQuestions((qs) => qs.filter((q) => q.uid !== uid));
  }
  function updateQ(uid: string, patch: Partial<DraftQ>) {
    setQuestions((qs) => qs.map((q) => (q.uid === uid ? { ...q, ...patch } : q)));
  }
  function updateOption(uid: string, idx: number, patch: Partial<QuestionOption>) {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.uid !== uid || !q.options) return q;
        const opts = q.options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
        return { ...q, options: opts };
      })
    );
  }
  function addOption(uid: string) {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.uid !== uid || !q.options) return q;
        const next = q.options.length;
        if (next >= LABELS.length) return q;
        return {
          ...q,
          options: [...q.options, { label: LABELS[next], text: "", correct: false }],
        };
      })
    );
  }
  function removeOption(uid: string, idx: number) {
    setQuestions((qs) =>
      qs.map((q) => {
        if (q.uid !== uid || !q.options || q.options.length <= 2) return q;
        const filtered = q.options.filter((_, i) => i !== idx);
        // Relabel
        const relabeled = filtered.map((o, i) => ({ ...o, label: LABELS[i] }));
        return { ...q, options: relabeled };
      })
    );
  }
  function moveQ(uid: string, direction: -1 | 1) {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.uid === uid);
      if (idx < 0) return qs;
      const target = idx + direction;
      if (target < 0 || target >= qs.length) return qs;
      const next = qs.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  async function save() {
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    if (type === "books" && !bookId) {
      setError("추천도서 목록에서 책을 선택해 주세요.");
      return;
    }
    if (type === "written" && !passage.trim()) {
      setError("자체 지문 본문을 입력해 주세요.");
      return;
    }
    if (questions.length === 0) {
      setError("문제를 한 개 이상 추가해 주세요.");
      return;
    }
    for (const q of questions) {
      if (!q.prompt.trim()) {
        setError("모든 문항의 발문을 입력해 주세요.");
        return;
      }
      if (q.type === "multiple_choice") {
        const opts = q.options ?? [];
        if (opts.length < 2) {
          setError("객관식 보기는 2개 이상이어야 해요.");
          return;
        }
        if (opts.some((o) => !o.text.trim())) {
          setError("비어 있는 객관식 보기가 있어요.");
          return;
        }
        if (!opts.some((o) => o.correct)) {
          setError("객관식 문항에 정답을 한 개 이상 표시해 주세요.");
          return;
        }
      }
      if (q.type === "true_false") {
        const opts = q.options ?? [];
        if (!opts.some((o) => o.correct)) {
          setError("OX 퀴즈는 정답(O 또는 X)을 하나 선택해 주세요.");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const draft: WorksheetDraft = {
        type,
        title: title.trim(),
        intro: intro.trim() || undefined,
        bookId: type === "books" ? bookId : undefined,
        source: type === "exam" ? source.trim() || undefined : undefined,
        externalUrl: type === "exam" ? externalUrl.trim() || undefined : undefined,
        passage: type === "written" ? passage : undefined,
        passageImageUrl: type === "written" ? passageImageUrl : undefined,
        questions: questions.map((q, i) => ({
          position: i,
          type: q.type,
          prompt: q.prompt.trim(),
          options: q.options?.map((o) => ({ ...o, text: o.text.trim() })),
          sampleAnswer: q.sampleAnswer?.trim() || undefined,
          rubric: q.rubric?.trim() || undefined,
          imageUrl: q.imageUrl,
        })),
      };
      const resp = await fetch("/api/admin/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await resp.json();
      if (!data.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        setSaving(false);
        return;
      }
      router.push(`/worksheet/${type}/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류가 발생했어요.");
      setSaving(false);
    }
  }

  const filteredBooks = books?.filter((b) => {
    const q = bookFilter.trim();
    if (!q) return true;
    return (
      b.title.includes(q) ||
      b.author.includes(q) ||
      b.publisher.includes(q) ||
      b.category.includes(q)
    );
  });
  const selectedBook = books?.find((b) => b.id === bookId) ?? null;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-bold text-accent-600">
          {TYPE_EMOJI[type]} {TYPE_LABEL[type]}
        </p>
        <h1 className="text-2xl font-bold text-fg-strong">새 활동지 만들기</h1>
      </div>

      <Card as="section" className="px-5 py-5 space-y-4">
        <div>
          <label className="block text-xs font-bold text-fg-strong mb-1">
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 우주의 신비를 읽고"
            className="w-full h-11 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-fg-strong mb-1">
            안내문 (선택)
          </label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={3}
            placeholder="학생에게 안내하고 싶은 내용"
            className="w-full px-3 py-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
          />
        </div>

        {type === "books" && books && (
          <div>
            <label className="block text-xs font-bold text-fg-strong mb-1">
              추천도서 선택 *
            </label>
            <input
              type="search"
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              placeholder="제목·저자·출판사·분류로 검색"
              className="w-full h-10 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none mb-2"
            />
            <div className="max-h-[320px] overflow-y-auto border border-border rounded-button bg-surface divide-y divide-border">
              {(filteredBooks ?? []).slice(0, 300).map((b) => {
                const selected = bookId === b.id;
                return (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setBookId(b.id)}
                    className={`block w-full text-left px-4 py-2.5 ${
                      selected ? "bg-accent-50" : "hover:bg-surface-muted"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        selected ? "text-accent-700" : "text-fg-strong"
                      }`}
                    >
                      {b.title}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {b.author} · {b.publisher} · {b.category} · 온독지수{" "}
                      {b.ondokIndex} · {b.year}
                    </p>
                  </button>
                );
              })}
              {(filteredBooks ?? []).length === 0 && (
                <p className="text-sm text-fg-subtle text-center py-6">
                  일치하는 책이 없어요.
                </p>
              )}
            </div>
            {selectedBook && (
              <p className="text-xs text-accent-600 mt-2">
                ✓ 선택됨: {selectedBook.title}
              </p>
            )}
          </div>
        )}

        {type === "exam" && (
          <>
            <div>
              <label className="block text-xs font-bold text-fg-strong mb-1">
                출처 *
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="예: 2024학년도 수능 국어 비문학 16-18번"
                className="w-full h-11 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-fg-strong mb-1">
                지문 외부 링크 (평가원 PDF 등, 선택)
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full h-11 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
              />
              <p className="text-xs text-fg-subtle mt-1">
                지문 본문은 사이트에 옮기지 않고 외부 링크로 안내합니다.
              </p>
            </div>
          </>
        )}

        {type === "written" && (
          <>
            <div>
              <label className="block text-xs font-bold text-fg-strong mb-1">
                자체 지문 *
              </label>
              <textarea
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                rows={10}
                placeholder="사고도구어가 자연스럽게 등장하는 짧은 글을 작성해 주세요. (예: 100~400자)"
                className="w-full px-3 py-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none leading-relaxed"
              />
              <p className="text-xs text-fg-subtle mt-1">
                줄바꿈과 단락 앞 띄어쓰기가 그대로 학생 화면에 반영돼요.
              </p>
            </div>
            <ImageUpload
              url={passageImageUrl}
              onChange={setPassageImageUrl}
              label="지문 이미지 (선택)"
              hint="지문 위에 표시될 그림입니다. 큰 이미지는 자동으로 줄어들어요."
            />
          </>
        )}
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-fg-strong px-1">
          문항 ({questions.length})
        </h2>
        {questions.map((q, idx) => (
          <Card key={q.uid} as="article" className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold bg-accent-50 text-accent-700 px-2 py-1 rounded-chip">
                {idx + 1}번 · {QTYPE_LABEL[q.type]}
              </span>
              <div className="ml-auto flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => moveQ(q.uid, -1)}
                  disabled={idx === 0}
                  className="text-fg-muted hover:text-fg-strong disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQ(q.uid, 1)}
                  disabled={idx === questions.length - 1}
                  className="text-fg-muted hover:text-fg-strong disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeQ(q.uid)}
                  className="text-cat-hum hover:opacity-80"
                >
                  삭제
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-fg-strong mb-1">
                발문 *
              </label>
              <textarea
                value={q.prompt}
                onChange={(e) => updateQ(q.uid, { prompt: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
              />
            </div>

            <ImageUpload
              url={q.imageUrl}
              onChange={(url) => updateQ(q.uid, { imageUrl: url })}
              label="문제 이미지 (선택)"
              hint="문제 발문 아래에 표시돼요."
            />

            {q.type === "true_false" && q.options && (
              <div>
                <label className="block text-xs font-bold text-fg-strong mb-2">
                  정답
                </label>
                <div className="flex gap-2">
                  {q.options.map((o, oi) => {
                    const active = o.correct;
                    return (
                      <button
                        type="button"
                        key={oi}
                        onClick={() =>
                          updateQ(q.uid, {
                            options: q.options!.map((opt, i) => ({
                              ...opt,
                              correct: i === oi,
                            })),
                          })
                        }
                        className={`flex-1 min-h-[56px] rounded-button border-2 text-2xl font-bold transition-colors ${
                          active
                            ? "border-accent-500 bg-accent-50 text-accent-700"
                            : "border-border bg-surface text-fg-strong hover:border-accent-300"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {q.type === "multiple_choice" && q.options && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-fg-strong">
                  보기 (정답에 체크)
                </label>
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm font-semibold text-fg-muted">
                      {o.label}
                    </span>
                    <input
                      type="text"
                      value={o.text}
                      onChange={(e) =>
                        updateOption(q.uid, oi, { text: e.target.value })
                      }
                      className="flex-1 h-9 px-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={o.correct}
                        onChange={(e) =>
                          updateOption(q.uid, oi, { correct: e.target.checked })
                        }
                      />
                      정답
                    </label>
                    {q.options!.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(q.uid, oi)}
                        className="text-xs text-fg-subtle hover:text-cat-hum"
                        aria-label="보기 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < LABELS.length && (
                  <button
                    type="button"
                    onClick={() => addOption(q.uid)}
                    className="text-xs font-semibold text-accent-600 hover:text-accent-700"
                  >
                    + 보기 추가
                  </button>
                )}
              </div>
            )}

            {q.type === "short_answer" && (
              <div>
                <label className="block text-xs font-bold text-fg-strong mb-1">
                  예시 답안 (선택)
                </label>
                <input
                  type="text"
                  value={q.sampleAnswer ?? ""}
                  onChange={(e) =>
                    updateQ(q.uid, { sampleAnswer: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
                />
              </div>
            )}

            {q.type === "essay" && (
              <div>
                <label className="block text-xs font-bold text-fg-strong mb-1">
                  평가 기준 / 채점 가이드 (선택)
                </label>
                <textarea
                  value={q.rubric ?? ""}
                  onChange={(e) => updateQ(q.uid, { rubric: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-button bg-surface border border-border focus:border-accent-500 focus:outline-none"
                />
              </div>
            )}
          </Card>
        ))}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addQ("multiple_choice")}
            className="text-sm px-3 py-2 rounded-button bg-surface border border-border hover:bg-accent-50 hover:border-accent-300"
          >
            + 객관식 추가
          </button>
          <button
            type="button"
            onClick={() => addQ("true_false")}
            className="text-sm px-3 py-2 rounded-button bg-surface border border-border hover:bg-accent-50 hover:border-accent-300"
          >
            + OX 퀴즈 추가
          </button>
          <button
            type="button"
            onClick={() => addQ("short_answer")}
            className="text-sm px-3 py-2 rounded-button bg-surface border border-border hover:bg-accent-50 hover:border-accent-300"
          >
            + 단답형 추가
          </button>
          <button
            type="button"
            onClick={() => addQ("essay")}
            className="text-sm px-3 py-2 rounded-button bg-surface border border-border hover:bg-accent-50 hover:border-accent-300"
          >
            + 서술형 추가
          </button>
        </div>
      </div>

      {error && (
        <Card as="section" className="px-5 py-4 bg-surface-muted">
          <p className="text-sm font-semibold text-cat-hum">{error}</p>
        </Card>
      )}

      <div className="flex gap-2 pb-8">
        <Button onClick={save} disabled={saving} className="flex-1">
          {saving ? "저장 중…" : "활동지 저장 후 공개"}
        </Button>
      </div>
    </div>
  );
}
