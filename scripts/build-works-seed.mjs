// content/works/*.json + 같은 이름의 *.md 를 읽어 작품 시드 SQL 을 만든다.
//
//   content/works/heungbu.json  … 메타데이터 + 점검 문제
//   content/works/heungbu.md    … 다듬은 본문 (## 로 대목 구분)
//
// Run: node scripts/build-works-seed.mjs
//  → scripts/works-seed.sql

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dir = resolve(root, "content/works");
const OUT = resolve(root, "scripts/works-seed.sql");

const q = (v) =>
  v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;

/**
 * md 에서 파일 맨 위의 제목·작업 메모만 걷어내고 본문을 남긴다.
 * 첫 '## ' 대목이 시작된 뒤의 '> ' 는 본문 속 인용(예: 양반전의 증서)이므로 보존한다.
 */
function extractBody(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let started = false;
  for (const line of lines) {
    if (line.startsWith("## ")) started = true;
    if (line.startsWith("# ")) continue; // 작품 제목 (메타에 따로 있음)
    if (!started && line.startsWith("> ")) continue; // 파일 상단 작업 메모
    out.push(line);
  }
  return out.join("\n").trim();
}

const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("content/works 에 작품 JSON 이 없습니다.");
  process.exit(1);
}

const stmts = [];
for (const f of files) {
  const meta = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const mdPath = join(dir, f.replace(/\.json$/, ".md"));
  const body = extractBody(readFileSync(mdPath, "utf8"));

  const sections = (body.match(/^## /gm) || []).length;
  const chars = body.replace(/\s+/g, "").length;
  console.log(
    `${meta.title} — ${chars}자 / ${sections}개 대목 / 문항 ${meta.questions.length}개`
  );

  stmts.push(`-- ${meta.title} (${chars}자, ${sections}개 대목)
INSERT INTO public.works
  (slug, title, author, category, era, summary, body, commentary, cover_emoji, questions, published)
VALUES (
  ${q(meta.slug)}, ${q(meta.title)}, ${q(meta.author)}, ${q(meta.category)}, ${q(meta.era)},
  ${q(meta.summary)},
  ${q(body)},
  ${q(meta.commentary)},
  ${q(meta.cover_emoji)},
  ${q(JSON.stringify(meta.questions))}::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, author = EXCLUDED.author, category = EXCLUDED.category,
  era = EXCLUDED.era, summary = EXCLUDED.summary, body = EXCLUDED.body,
  commentary = EXCLUDED.commentary, cover_emoji = EXCLUDED.cover_emoji,
  questions = EXCLUDED.questions, updated_at = NOW();`);
}

const sql = `-- 고전 읽기 작품 시드 (자동 생성: scripts/build-works-seed.mjs)
-- 선행: scripts/migrations/2026-07-01-works.sql

${stmts.join("\n\n")}
`;
writeFileSync(OUT, sql, "utf8");
console.log(`→ ${OUT}`);
