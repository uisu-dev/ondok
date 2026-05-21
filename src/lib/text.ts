/**
 * Split a long Korean book description into readable paragraphs.
 *
 * - Normalizes missing spaces after sentence-ending punctuation (common in
 *   네이버 책소개 source text where "...해진다.과학에는..." appears).
 * - Groups sentences into paragraphs of N sentences each (default 3).
 *
 * @param text raw description
 * @param sentencesPerPara sentences per paragraph (default 3)
 * @returns array of paragraph strings; empty string returns []
 */
export function splitIntoParagraphs(
  text: string,
  sentencesPerPara = 3
): string[] {
  if (!text || !text.trim()) return [];

  // Insert space after .!? if the next char is non-whitespace (Korean text
  // commonly lacks spaces after periods).
  const normalized = text.replace(/([.!?])(\S)/g, "$1 $2");

  // Match runs ending in sentence punctuation; fall back to the whole string.
  const matches = normalized.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  const sentences = (matches ?? [normalized])
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [normalized.trim()];

  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerPara) {
    out.push(sentences.slice(i, i + sentencesPerPara).join(" "));
  }
  return out;
}
