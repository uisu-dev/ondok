// 사고도구어 예문 수집 — krdict OpenAPI (검색 → target_code → view 예문).
// 예문에서 표제어를 마스킹(○)하여 학습 퀴즈 힌트로 사용.
//
// Run (전체):   node scripts/fetch-examples.mjs
// Run (샘플):   node scripts/fetch-examples.mjs --limit 12

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const KEY = process.env.KRDICT_API_KEY || "9C200E2FFC6F56A1E6437B40AA37D70B";

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;

const words = JSON.parse(
  readFileSync(resolve(root, "src/data/sago-words.json"), "utf8")
).words;

const OUT = resolve(root, "src/data/sago-examples.json");

const UA = { headers: { "User-Agent": "Mozilla/5.0" } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function allMatches(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(decode(m[1]));
  return out;
}

// 검색: word 정확 일치 + 명사>형용사>동사 우선의 target_code
async function findTargetCode(word) {
  const url = `https://krdict.korean.go.kr/api/search?key=${KEY}&q=${encodeURIComponent(
    word
  )}&part=word&sort=dict&translated=n`;
  const res = await fetch(url, UA);
  const xml = await res.text();
  const items = xml.split("<item>").slice(1);
  const cands = [];
  for (const it of items) {
    const w = (it.match(/<word>([\s\S]*?)<\/word>/) || [])[1];
    const code = (it.match(/<target_code>(\d+)<\/target_code>/) || [])[1];
    const pos = (it.match(/<pos>([\s\S]*?)<\/pos>/) || [])[1] || "";
    if (!code || decode(w || "") !== word) continue;
    const rank = pos.includes("명사") ? 0 : pos.includes("형용사") ? 1 : pos.includes("동사") ? 2 : 3;
    cands.push({ code, rank });
  }
  cands.sort((a, b) => a.rank - b.rank);
  return cands.length ? cands[0].code : null;
}

// view: 예문 목록 중 표제어 포함 + 길이 적당한 것 1개 선택
async function findExample(targetCode, word) {
  const url = `https://krdict.korean.go.kr/api/view?key=${KEY}&method=target_code&q=${targetCode}`;
  const res = await fetch(url, UA);
  const xml = await res.text();
  const examples = allMatches(xml, "example");
  // 표제어를 포함하고, 문장형(마침표/길이)에 가까운 것
  const usable = examples
    .filter((e) => e.includes(word) && e.length >= 8 && e.length <= 45)
    .sort((a, b) => {
      // 마침표로 끝나는 완전한 문장 + 14자 이상을 우선, 그 안에서 긴 문장 먼저
      const aGood = /[.?!]$/.test(a) && a.length >= 14 ? 0 : 1;
      const bGood = /[.?!]$/.test(b) && b.length >= 14 ? 0 : 1;
      if (aGood !== bGood) return aGood - bGood;
      return b.length - a.length;
    });
  return usable[0] ?? null;
}

function mask(sentence, word) {
  return sentence.split(word).join("○".repeat(word.length));
}

async function main() {
  const result = {};
  let done = 0;
  let hit = 0;
  const list = words.slice(0, Number.isFinite(LIMIT) ? LIMIT : words.length);
  for (const w of list) {
    const key = `${w.grade}.${w.raw}`;
    try {
      const code = await findTargetCode(w.word);
      await sleep(120);
      if (code) {
        const ex = await findExample(code, w.word);
        await sleep(120);
        if (ex) {
          result[key] = { masked: mask(ex, w.word), word: w.word };
          hit++;
        }
      }
    } catch (e) {
      // 무시하고 계속
    }
    done++;
    if (done % 25 === 0) {
      console.log(`  ${done}/${list.length} (예문 ${hit}개)`);
      writeFileSync(OUT, JSON.stringify({ examples: result }, null, 2), "utf8");
    }
  }
  writeFileSync(OUT, JSON.stringify({ examples: result }, null, 2), "utf8");
  console.log(`완료: ${done}개 처리, 예문 ${hit}개 → ${OUT}`);
}

main();
