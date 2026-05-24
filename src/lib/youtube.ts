/**
 * Extract a YouTube video ID from common URL formats.
 * Returns null if not a recognizable YouTube URL.
 *
 * Supported:
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *   https://m.youtube.com/watch?v=ID
 */
const PATTERNS: RegExp[] = [
  /[?&]v=([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  for (const p of PATTERNS) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Last resort: pure 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}
