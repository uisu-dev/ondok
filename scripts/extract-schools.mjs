// 충남 학교 명단 xlsx → src/data/schools.json
// 행정기관(교육지원청, 본청 부서, 직속기관)은 제외하고 학교만 수록.
//
// Run: node scripts/extract-schools.mjs <xlsx-path>

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { read as xlsxRead, utils as xlsxUtils } from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SRC =
  process.argv[2] ||
  "C:\\Users\\User\\Downloads\\학교 명단.xlsx";
const OUT = resolve(root, "src/data/schools.json");

const buf = readFileSync(SRC);
const wb = xlsxRead(buf, { type: "buffer" });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsxUtils.sheet_to_json(sheet, { header: 1, blankrows: false });

// 컬럼 (code, name) × 5 묶음. 첫 행도 데이터.
const pairs = [];
const colCount = rows[0]?.length ?? 0;
for (const row of rows) {
  for (let c = 0; c < colCount; c += 2) {
    const code = row[c];
    const name = row[c + 1];
    if (code == null || name == null) continue;
    const codeS = String(code).trim();
    const nameS = String(name).trim();
    if (!codeS || !nameS) continue;
    pairs.push({ code: codeS, raw: nameS });
  }
}

/** "~중", "~고" 로 끝나는 학교는 "~중학교", "~고등학교" 로 정규화.
 *  "~여중"/"~여고" 는 "~여자중학교"/"~여자고등학교" (단 '부여'는 지역명이라 예외). */
function normalizeName(name) {
  const n = name.trim();
  if (/(학교|대학교)$/.test(n)) return n;
  if (n.endsWith("여중") && n !== "부여중") return n.slice(0, -2) + "여자중학교";
  if (n.endsWith("여고") && n !== "부여고") return n.slice(0, -2) + "여자고등학교";
  if (n.endsWith("중")) return n + "학교";
  if (n.endsWith("고")) return n + "등학교";
  return n;
}

/** code prefix 로 학교급 판정. */
function classifyByCode(code) {
  if (code.startsWith("중")) return "middle";
  if (code.startsWith("고")) return "high";
  if (code.startsWith("특")) return "special";
  // 지역(교육지원청), 본(본청 부서), 직(직속기관) 등은 학교 아님
  return null;
}

const seen = new Set();
const schools = [];
for (const { code, raw } of pairs) {
  if (seen.has(code)) continue;
  const type = classifyByCode(code);
  if (!type) continue; // 학교가 아닌 항목 제외
  seen.add(code);
  schools.push({
    code,
    name: normalizeName(raw),
    nameRaw: raw,
    type,
  });
}

// 정렬: type 별, 이름 가나다순
const TYPE_ORDER = { middle: 1, high: 2, special: 3 };
schools.sort((a, b) => {
  const t = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
  if (t !== 0) return t;
  return a.name.localeCompare(b.name, "ko");
});

// 통계
const stats = { middle: 0, high: 0, special: 0 };
for (const s of schools) stats[s.type]++;
console.log(`Total schools: ${schools.length}`);
console.log(`By type:`, stats);

const out = {
  source: "충청남도교육청 학교 명단 (~중/~고 → ~중학교/~고등학교 정규화)",
  generated_at: new Date().toISOString(),
  counts: { ...stats, total: schools.length },
  schools,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
console.log(`→ ${OUT}`);

// Supabase 시드용 SQL 도 함께 생성
const SQL_OUT = resolve(root, "scripts/schools-seed.sql");
const sqlEscape = (s) => s.replace(/'/g, "''");
const lines = schools.map(
  (s) => `('${sqlEscape(s.code)}', '${sqlEscape(s.name)}', '${s.type}')`
);
const sql = `-- 충남 학교 명단 시드 (${schools.length}개)
-- 자동 생성: scripts/extract-schools.mjs
-- 실행 전 scripts/migrations/2026-06-05-auth-profiles.sql 가 적용되어 있어야 함.

INSERT INTO public.schools (code, name, type) VALUES
${lines.join(",\n")}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type;
`;
writeFileSync(SQL_OUT, sql, "utf8");
console.log(`→ ${SQL_OUT}`);
