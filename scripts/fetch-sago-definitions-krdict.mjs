// Fetch 한국어 기초사전(krdict.korean.go.kr) 풀이로 sago-definitions.json 재구성.
//
// 기초사전은 학습자용이라 풀이가 평이하고 짧음. 표제어가 약 5만 개로
// 표준국어대사전(50만)보다 적기 때문에 일부 단어(특히 추상어·신조어)는
// 미수록일 수 있음. 그 경우 *현재 sago-definitions.json* 의 풀이(표준국어
// 대사전 또는 직접 정리분)를 그대로 유지하여 빈 항목이 생기지 않게 함.
//
// 실행:
//   node --env-file=.env.local scripts/fetch-sago-definitions-krdict.mjs
//   node --env-file=.env.local scripts/fetch-sago-definitions-krdict.mjs --force
//   node --env-file=.env.local scripts/fetch-sago-definitions-krdict.mjs --grade 2
//
// 결과:
//   src/data/sago-definitions.json — 풀이 교체 (krdict 우선, fallback 보존)
//   src/data/sago-def-sources.json — 단어별 출처 추적

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const KEY = process.env.KRDICT_API_KEY;
if (!KEY) {
  console.error(
    "KRDICT_API_KEY 가 비어 있어요. `node --env-file=.env.local …` 으로 실행하세요."
  );
  process.exit(2);
}

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const gi = args.indexOf("--grade");
const ONLY_GRADE = gi >= 0 ? Number(args[gi + 1]) : null;

const WORDS_PATH = resolve(root, "src/data/sago-words.json");
const DEFS_PATH = resolve(root, "src/data/sago-definitions.json");
const SOURCES_PATH = resolve(root, "src/data/sago-def-sources.json");

const wordsBundle = JSON.parse(readFileSync(WORDS_PATH, "utf8"));
const defsBundle = JSON.parse(readFileSync(DEFS_PATH, "utf8"));
const defs = defsBundle.definitions ?? { 1: {}, 2: {}, 3: {}, 4: {} };
for (const g of ["1", "2", "3", "4"]) defs[g] ??= {};

let sources = { 1: {}, 2: {}, 3: {}, 4: {} };
if (existsSync(SOURCES_PATH)) {
  try {
    const loaded = JSON.parse(readFileSync(SOURCES_PATH, "utf8"));
    sources = loaded.sources ?? sources;
    for (const g of ["1", "2", "3", "4"]) sources[g] ??= {};
  } catch {
    /* ignore parse errors, start fresh */
  }
}

const THROTTLE_MS = 150;
const SAVE_EVERY = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** XML 응답을 정규식으로 파싱 (item 단위). */
function parseItems(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
      const mm = block.match(r);
      return mm ? mm[1].trim() : null;
    };
    const word = get("word");
    const sup_no = get("sup_no");
    const pos = get("pos");
    const word_grade = get("word_grade");
    const origin = get("origin");
    // 첫 sense 의 definition
    const senseRe = /<sense>([\s\S]*?)<\/sense>/;
    const sm = block.match(senseRe);
    let definition = null;
    if (sm) {
      const dm = sm[1].match(/<definition>([\s\S]*?)<\/definition>/);
      if (dm) definition = dm[1].trim();
    }
    if (word && definition) {
      items.push({ word, sup_no, pos, word_grade, origin, definition });
    }
  }
  return items;
}

async function fetchKrdict(word, suffix) {
  const url =
    "https://krdict.korean.go.kr/api/search" +
    `?key=${KEY}` +
    `&q=${encodeURIComponent(word)}` +
    `&num=30` +
    `&translated=n`;
  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const xml = await resp.text();
  const items = parseItems(xml);
  if (items.length === 0) return null;

  // 1) sup_no 정확 매칭
  if (suffix !== null) {
    const m = items.find((it) => Number(it.sup_no) === suffix);
    if (m) return m.definition;
  }
  // 2) 명사 우선
  const noun = items.find((it) => it.pos === "명사");
  if (noun) return noun.definition;
  // 3) 어떤 품사든 첫 항목
  return items[0].definition;
}

function save() {
  const stats = { krdict: 0, stdict: 0, manual: 0, missing: 0 };
  for (const g of ["1", "2", "3", "4"]) {
    for (const k in sources[g]) {
      const s = sources[g][k];
      if (s === "krdict") stats.krdict++;
      else if (s === "manual") stats.manual++;
      else if (s === "stdict") stats.stdict++;
      else stats.missing++;
    }
  }
  const out = {
    source:
      "국립국어원 한국어 기초사전 (https://krdict.korean.go.kr) 우선, " +
      "미수록 시 표준국어대사전 + 수동 정리 7건 보완",
    fetched_at: new Date().toISOString(),
    note: defsBundle.note ?? "",
    stats,
    definitions: defs,
  };
  writeFileSync(DEFS_PATH, JSON.stringify(out, null, 2), "utf8");
  writeFileSync(
    SOURCES_PATH,
    JSON.stringify(
      {
        note: "단어별 풀이 출처. krdict=한국어 기초사전, stdict=표준국어대사전, manual=직접 정리.",
        sources,
      },
      null,
      2
    ),
    "utf8"
  );
}

// 직접 정리한 7개(빅데이터/-적 형용사 등): 기초사전에서도 시도하되,
// 실패해도 manual 풀이 유지.
const MANUAL_OVERRIDES = new Set([
  "3.빅데이터",
  "4.격식적",
  "4.다차원",
  "4.이분법적",
  "4.일방향적",
  "4.포용적",
  "4.학제적",
]);

const words = wordsBundle.words;
const target = ONLY_GRADE
  ? words.filter((w) => w.grade === ONLY_GRADE)
  : words;

console.log(
  `Total candidates: ${target.length}` +
    (ONLY_GRADE ? ` (grade ${ONLY_GRADE} only)` : "")
);

let processed = 0;
let krdictHits = 0;
let krdictMiss = 0;
let skipped = 0;
const failures = [];

for (const w of target) {
  const g = String(w.grade);
  const key = `${g}.${w.raw}`;
  const currentSource = sources[g][w.raw];

  if (!FORCE && currentSource === "krdict") {
    skipped++;
    processed++;
    continue;
  }

  try {
    const def = await fetchKrdict(w.word, w.suffix);
    if (def) {
      defs[g][w.raw] = def;
      sources[g][w.raw] = "krdict";
      krdictHits++;
    } else {
      // 기초사전 미수록 — 기존 풀이 그대로
      krdictMiss++;
      if (MANUAL_OVERRIDES.has(key)) sources[g][w.raw] = "manual";
      else if (defs[g][w.raw]?.trim()) sources[g][w.raw] = "stdict";
      else sources[g][w.raw] = "";
    }
  } catch (e) {
    failures.push({ ...w, reason: e instanceof Error ? e.message : String(e) });
    // 실패 시 기존 풀이 유지
    if (!sources[g][w.raw]) {
      if (MANUAL_OVERRIDES.has(key)) sources[g][w.raw] = "manual";
      else if (defs[g][w.raw]?.trim()) sources[g][w.raw] = "stdict";
    }
  }
  processed++;
  if (processed % SAVE_EVERY === 0) {
    save();
    console.log(
      `  …${processed}/${target.length} (krdict=${krdictHits}, miss=${krdictMiss}, skip=${skipped})`
    );
  }
  await sleep(THROTTLE_MS);
}

save();
console.log(
  `\nDone. processed=${processed} krdict=${krdictHits} miss=${krdictMiss} skipped=${skipped}`
);
if (failures.length) {
  console.log(`\nFailures (first 10):`);
  for (const f of failures.slice(0, 10)) {
    console.log(`  ${f.raw} (grade ${f.grade}) — ${f.reason}`);
  }
  console.log(`Total failures: ${failures.length}`);
}
