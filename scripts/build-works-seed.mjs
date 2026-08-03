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
const answerDist = [0, 0, 0, 0]; // 정답 위치가 한쪽으로 쏠리면 찍어서 맞힐 수 있다
for (const f of files) {
  const meta = JSON.parse(readFileSync(join(dir, f), "utf8"));
  const mdPath = join(dir, f.replace(/\.json$/, ".md"));
  const body = extractBody(readFileSync(mdPath, "utf8"));

  const sections = (body.match(/^## /gm) || []).length;
  // 본문 글자수에서 [[표시할 말|키]] 의 '|키]]' 부분은 제외하고 센다
  const plain = body.replace(/\[\[([^\]|]+)\|[^\]]+\]\]/g, "$1");
  const chars = plain.replace(/\s+/g, "").length;

  // 본문에 심긴 주석 키와 annotations 정의가 맞는지 검사
  const marks = [...body.matchAll(/\[\[([^\]|]+)\|([^\]]+)\]\]/g)];
  const used = new Set(marks.map((m) => m[2]));

  // 형광펜 구간이 길면 여러 줄을 통째로 덮어 지저분해진다 → 핵심 구절만
  for (const [, label, k] of marks) {
    if (label.length > 40) {
      console.log(
        `  ⚠ ${meta.title}: 주석 '${k}' 의 표시 구간이 ${label.length}자입니다 (40자 이하 권장)`
      );
    }
  }

  for (const a of Object.values(meta.annotations ?? {})) {
    if (a.type === "quiz") answerDist[a.answer] = (answerDist[a.answer] ?? 0) + 1;
  }

  const defined = new Set(Object.keys(meta.annotations ?? {}));
  for (const k of used) {
    if (!defined.has(k)) console.log(`  ⚠ ${meta.title}: 본문의 [[…|${k}]] 에 해당하는 주석 정의가 없습니다`);
  }
  for (const k of defined) {
    if (!used.has(k)) console.log(`  ⚠ ${meta.title}: 주석 '${k}' 이 본문에서 쓰이지 않았습니다`);
  }

  if (typeof meta.era_order !== "number") {
    console.log(`  ⚠ ${meta.title}: era_order(창작 추정 연도)가 없습니다`);
  }

  console.log(
    `${String(meta.era_order ?? "????").padStart(4)}  ${meta.title} — ${chars}자 / ${sections}개 대목 / 문항 ${meta.questions.length}개 / 주석 ${used.size}개`
  );

  stmts.push(`-- ${meta.era_order ?? "?"} ${meta.title} (${chars}자, ${sections}개 대목, 주석 ${used.size}개)
INSERT INTO public.works
  (slug, title, author, category, era, era_order, summary, body, commentary, cover_emoji, questions, annotations, published)
VALUES (
  ${q(meta.slug)}, ${q(meta.title)}, ${q(meta.author)}, ${q(meta.category)}, ${q(meta.era)},
  ${Number(meta.era_order ?? 9999)},
  ${q(meta.summary)},
  ${q(body)},
  ${q(meta.commentary)},
  ${q(meta.cover_emoji)},
  ${q(JSON.stringify(meta.questions))}::jsonb,
  ${q(JSON.stringify(meta.annotations ?? {}))}::jsonb,
  TRUE
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, author = EXCLUDED.author, category = EXCLUDED.category,
  era = EXCLUDED.era, era_order = EXCLUDED.era_order,
  summary = EXCLUDED.summary, body = EXCLUDED.body,
  commentary = EXCLUDED.commentary, cover_emoji = EXCLUDED.cover_emoji,
  questions = EXCLUDED.questions, annotations = EXCLUDED.annotations, updated_at = NOW();`);
}
stmts.sort();

const totalQuiz = answerDist.reduce((s, n) => s + n, 0);
if (totalQuiz > 0) {
  console.log(
    `\n주석 문항 정답 분포 (총 ${totalQuiz}개): ` +
      answerDist.map((n, i) => `${i + 1}번 ${n}`).join(" · ")
  );
  const max = Math.max(...answerDist);
  if (max / totalQuiz > 0.4) {
    console.log(
      "  ⚠ 정답이 한쪽 보기에 쏠려 있습니다. 찍어서 맞힐 수 있으니 보기 순서를 섞으세요."
    );
  }
}

const sql = `-- 고전 읽기 작품 시드 (자동 생성: scripts/build-works-seed.mjs)
-- 선행: scripts/migrations/2026-07-01-works.sql

${stmts.join("\n\n")}
`;
writeFileSync(OUT, sql, "utf8");
console.log(`→ ${OUT}`);
