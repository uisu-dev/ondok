"use client";

import { useRef, useState } from "react";
import { resizeImage } from "@/lib/image-resize";

interface Props {
  url: string | undefined;
  onChange: (url: string | undefined) => void;
  label?: string;
  hint?: string;
}

export function ImageUpload({
  url,
  onChange,
  label = "이미지",
  hint = "큰 이미지는 자동으로 작게 줄여서 올라가요. (JPG/PNG/WEBP)",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-uploading the same file
    if (!file) return;
    setError(null);
    setUploading(true);
    setStatus("이미지 크기 조정 중…");
    try {
      const resized = await resizeImage(file);
      setStatus(
        `업로드 중… (${Math.round(resized.newSize / 1024)}KB, ${resized.width}×${resized.height})`
      );
      const form = new FormData();
      form.append("file", resized.blob, "upload.jpg");
      const resp = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });
      const data = await resp.json();
      if (!data.ok) {
        setError(data.error ?? "업로드에 실패했어요.");
        return;
      }
      onChange(data.url);
      setStatus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 중 오류");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-fg-strong">{label}</label>
        {url && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-cat-hum hover:opacity-80"
          >
            이미지 제거
          </button>
        )}
      </div>

      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="업로드된 이미지"
          className="max-w-full max-h-[280px] rounded-button border border-border bg-surface-muted object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full min-h-[80px] rounded-button border-2 border-dashed border-border bg-surface hover:border-accent-300 hover:bg-accent-50 text-sm text-fg-muted px-4 py-3 disabled:opacity-50"
        >
          {uploading ? status ?? "처리 중…" : "🖼 이미지 선택"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handlePick}
        className="hidden"
      />

      <p className="text-xs text-fg-subtle">{hint}</p>
      {error && <p className="text-xs text-cat-hum font-semibold">{error}</p>}
      {uploading && status && (
        <p className="text-xs text-fg-muted">{status}</p>
      )}
    </div>
  );
}
