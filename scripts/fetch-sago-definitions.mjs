// Fetch 표준국어대사전 정의 for every sago word and (re)build sago-definitions.json.
//
// Pipeline:
//   1. Read sago-words.json (1,384 entries: { grade, word, suffix, raw })
//   2. For each entry, GET https://stdict.korean.go.kr/api/search.do
//      - filter response items by item.sup_no === String(suffix) when suffix !== null
//      - fall back to first item otherwise
//   3. Write sago-definitions.json with grade → { raw → definition }
//
// Resumable: existing non-empty definitions are kept; only missing ones are
// fetched, so re-running just fills in gaps (and lets you abort/retry safely).
//
// Run:
//   node --env-file=.env.local scripts/fetch-sago-definitions.mjs
//   node --env-file=.env.local scripts/fetch-sago-definitions.mjs --force        (refetch all)
//   node --env-file=.env.local scripts/fetch-sago-definitions.mjs --grade 2      (only one grade)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const KEY = process.env.STDICT_API_KEY;
if (!KEY) {
  console.error("STDICT_API_KEY is missing. Run with `node --env-file=.env.local …`.");
  process.exit(2);
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const gradeIdx = args.indexOf("--grade");
const ONLY_GRADE = gradeIdx >= 0 ? Number(args[gradeIdx + 1]) : null;

const WORDS_PATH = resolve(root, "src/data/sago-words.json");
const DEFS_PATH = resolve(root, "src/data/sago-definitions.json");

const wordsBundle = JSON.parse(readFileSync(WORDS_PATH, "utf8"));
const defsBundle = JSON.parse(readFileSync(DEFS_PATH, "utf8"));
const defs = defsBundle.definitions ?? { 1: {}, 2: {}, 3: {}, 4: {} };
for (const g of ["1", "2", "3", "4"]) defs[g] ??= {};

const THROTTLE_MS = 150;
const SAVE_EVERY = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchDefinition(word, suffix) {
  const url =
    "https://stdict.korean.go.kr/api/search.do" +
    `?key=${KEY}` +
    `&q=${encodeURIComponent(word)}` +
    `&req_type=json` +
    `&num=30`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  const items = data?.channel?.item;
  if (!items || items.length === 0) return null;
  const arr = Array.isArray(items) ? items : [items]; // API may collapse single
  if (suffix !== null) {
    const m = arr.find((it) => Number(it.sup_no) === suffix);
    if (m) return m.sense?.definition ?? null;
  }
  return arr[0].sense?.definition ?? null;
}

function save() {
  const updated = {
    source: "출처: 국립국어원 표준국어대사전 (https://stdict.korean.go.kr) Open API",
    fetched_at: new Date().toISOString(),
    note: "key는 충청남도교육청 사고도구어 목록 원본 표(homonym 번호 포함). 값이 빈 문자열이면 표준국어대사전에서 찾지 못한 항목.",
    definitions: defs,
  };
  writeFileSync(DEFS_PATH, JSON.stringify(updated, null, 2), "utf8");
}

const words = wordsBundle.words;
const target = ONLY_GRADE
  ? words.filter((w) => w.grade === ONLY_GRADE)
  : words;

console.log(`Total candidates: ${target.length}` + (ONLY_GRADE ? ` (grade ${ONLY_GRADE} only)` : ""));

let processed = 0;
let fetched = 0;
let missed = 0;
let skipped = 0;
const failures = [];

for (const w of target) {
  const g = String(w.grade);
  const existing = defs[g][w.raw];
  if (!FORCE && existing && existing.trim()) {
    skipped++;
    processed++;
    continue;
  }
  try {
    const def = await fetchDefinition(w.word, w.suffix);
    if (def) {
      defs[g][w.raw] = def;
      fetched++;
    } else {
      defs[g][w.raw] = "";
      missed++;
      failures.push({ ...w, reason: "no item or no sup_no match" });
    }
  } catch (e) {
    failures.push({ ...w, reason: e.message });
    defs[g][w.raw] = defs[g][w.raw] ?? "";
  }
  processed++;
  if (processed % SAVE_EVERY === 0) {
    save();
    console.log(`  …${processed}/${target.length} (fetched=${fetched}, missed=${missed}, skipped=${skipped})`);
  }
  await sleep(THROTTLE_MS);
}

save();
console.log(
  `\nDone. processed=${processed} fetched=${fetched} missed=${missed} skipped=${skipped}`
);
if (failures.length) {
  console.log(`\nSample failures (first 10):`);
  for (const f of failures.slice(0, 10)) {
    console.log(`  ${f.raw} (grade ${f.grade}) — ${f.reason}`);
  }
  console.log(`Total failures: ${failures.length}`);
}
