import { readFileSync, writeFileSync } from "node:fs";

const p = "./src/data/schools.json";
const data = JSON.parse(readFileSync(p, "utf8"));
const SKIP = new Set(["부여중학교", "부여고등학교"]); // 부여 = 지역명

const changed = [];
for (const x of data.schools) {
  if (SKIP.has(x.name)) continue;
  let nn = x.name;
  if (/여중학교$/.test(nn)) nn = nn.replace(/여중학교$/, "여자중학교");
  else if (/여고등학교$/.test(nn)) nn = nn.replace(/여고등학교$/, "여자고등학교");
  if (nn !== x.name) {
    changed.push([x.code, x.name, nn]);
    x.name = nn;
  }
}
writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`변환: ${changed.length}개`);
for (const c of changed) console.log("  ", c[1], "→", c[2]);

const lines = changed.map(
  (c) => `UPDATE public.schools SET name = '${c[2]}' WHERE code = '${c[0]}';`
);
const sql =
  "-- 학교명 정정: ~여중학교 → ~여자중학교, ~여고등학교 → ~여자고등학교\n" +
  "-- (부여중학교·부여고등학교는 '부여' 지역명이라 제외)\n\n" +
  lines.join("\n") +
  "\n";
writeFileSync("./scripts/migrations/2026-06-18-girls-school-names.sql", sql, "utf8");
console.log("→ scripts/migrations/2026-06-18-girls-school-names.sql");
