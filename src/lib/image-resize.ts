/**
 * Browser-side image downscaling via Canvas.
 * Keeps aspect ratio; outputs JPEG to reduce payload size.
 *
 * Why client-side: students/teachers may upload from phones where original
 * photos can be 5+ MB. Resizing before upload saves bandwidth, Storage quota,
 * and load time on slow connections.
 */
export interface ResizeOptions {
  maxWidth?: number; // default 1600 (high-quality but not absurd)
  maxHeight?: number;
  quality?: number; // 0..1 (default 0.85)
}

export interface ResizedImage {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  newSize: number;
}

const DEFAULTS: Required<ResizeOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.85,
};

export async function resizeImage(
  file: File | Blob,
  opts: ResizeOptions = {}
): Promise<ResizedImage> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULTS, ...opts };
  const originalSize = file.size;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
      i.src = url;
    });

    const ratio = Math.min(
      1,
      maxWidth / img.naturalWidth,
      maxHeight / img.naturalHeight
    );
    const w = Math.round(img.naturalWidth * ratio);
    const h = Math.round(img.naturalHeight * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context를 만들 수 없어요.");
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("이미지 변환에 실패했어요."))),
        "image/jpeg",
        quality
      );
    });

    return { blob, width: w, height: h, originalSize, newSize: blob.size };
  } finally {
    URL.revokeObjectURL(url);
  }
}
