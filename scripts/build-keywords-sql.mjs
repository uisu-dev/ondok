// content/works/*.json 의 questions 만 뽑아 UPDATE 문을 만든다.
//
// 전체 시드(works-seed.sql)는 본문까지 들어 있어 1MB 가 넘는다.
// 핵심 낱말(keywords)만 반영하면 될 때는 questions 만 갈아 끼우면 되므로
// 이 스크립트로 가벼운 SQL 을 만들어 쓴다.
//
// Run: node scripts/build-keywords-sql.mjs
//  → scripts/works-questions.sql

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dir = resolve(root, "content/works");
const OUT = resolve(root, "scripts/works-questions.sql");

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const lines = [
  "-- 점검 문제 갱신 (핵심 낱말 keywords 포함)",
  "-- 자동 생성: scripts/build-keywords-sql.mjs",
  "--",
  "-- works.questions 만 갈아 끼운다. 본문·주석·해설은 건드리지 않으므로",
  "-- 이미 올려 둔 작품에 낱말만 얹고 싶을 때 이 파일을 쓰면 된다.",
  "",
];

let withKeywords = 0;
let totalQuestions = 0;

for (const f of files) {
  const meta = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const questions = meta.questions ?? [];
  totalQuestions += questions.length;
  withKeywords += questions.filter((x) => (x.keywords ?? []).length > 0).length;
  lines.push(
    `-- ${meta.title}`,
    `UPDATE public.works SET questions = ${q(JSON.stringify(questions))}::jsonb`,
    `  WHERE slug = ${q(meta.slug)};`,
    ""
  );
}

lines.push(
  "-- 확인: 낱말이 들어간 문항 수",
  "SELECT COUNT(*) AS 낱말있는문항",
  "FROM public.works w, jsonb_array_elements(w.questions) AS x",
  "WHERE jsonb_array_length(COALESCE(x->'keywords', '[]'::jsonb)) > 0;",
  ""
);

writeFileSync(OUT, lines.join("\n"), "utf8");
console.log(
  `${files.length}편 / 문항 ${totalQuestions}개 (낱말 있는 문항 ${withKeywords}개)`
);
console.log(`→ ${OUT}`);
