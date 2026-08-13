// 충남 중·고·특수학교 명단을 NEIS 공개 API 에서 받아 기존 목록과 대조한다.
//
// 왜 필요한가: 처음 받은 xlsx 에 사립학교가 통째로 빠져 있었다.
//   (천안북일고, 공주영명중·고, 논산대건고, 서산서령고, 천안호서중·고 …)
//
// 중요 — 기존 학교의 code 는 절대 바꾸지 않는다.
//   profiles.school_code 가 schools(code) 를 FK 로 참조하므로,
//   코드를 갈아엎으면 학생·교원 소속이 전부 끊긴다.
//   따라서 이미 있는 학교는 이름으로 찾아 기존 코드를 유지하고,
//   빠져 있던 학교만 NEIS 표준학교코드로 새로 넣는다.
//
// 키 발급: https://open.neis.go.kr → 회원가입 → 인증키 신청 (무료, 즉시)
//   키가 없으면 pIndex 가 무시되어 5건만 돌아온다.
//
// Run:
//   NEIS_API_KEY=xxxx node scripts/fetch-schools-neis.mjs
//   node scripts/fetch-schools-neis.mjs --key=xxxx

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SCHOOLS_JSON = resolve(root, "src/data/schools.json");
const ADD_SQL = resolve(root, "scripts/schools-add.sql");

const arg = (n) => {
  const h = process.argv.find((a) => a.startsWith(`--${n}=`));
  return h ? h.slice(n.length + 3) : null;
};
const KEY = arg("key") ?? process.env.NEIS_API_KEY ?? "";

if (!KEY) {
  console.error(`
✕ NEIS 인증키가 필요합니다.

  1) https://open.neis.go.kr 접속 → 회원가입
  2) 마이페이지 → 인증키 신청 (무료, 바로 발급)
  3) NEIS_API_KEY=발급받은키 node scripts/fetch-schools-neis.mjs

  키가 없으면 API 가 pIndex 를 무시하고 5건만 돌려줍니다.`);
  process.exit(1);
}

const OFFICE = "N10"; // 충청남도교육청
const KINDS = ["중학교", "고등학교", "특수학교"];
const KIND_TO_TYPE = { 중학교: "middle", 고등학교: "high", 특수학교: "special" };

async function fetchKind(kind) {
  const out = [];
  const size = 1000;
  for (let page = 1; page <= 20; page++) {
    const url =
      `https://open.neis.go.kr/hub/schoolInfo?KEY=${encodeURIComponent(KEY)}` +
      `&Type=json&ATPT_OFCDC_SC_CODE=${OFFICE}` +
      `&SCHUL_KND_SC_NM=${encodeURIComponent(kind)}` +
      `&pIndex=${page}&pSize=${size}`;
    const res = await fetch(url);
    const json = await res.json();

    // 결과 없음(INFO-200) 이면 마지막 페이지
    if (json.RESULT) {
      if (json.RESULT.CODE === "INFO-200") break;
      throw new Error(`NEIS 오류 ${json.RESULT.CODE}: ${json.RESULT.MESSAGE}`);
    }
    const rows = json.schoolInfo?.[1]?.row ?? [];
    out.push(...rows);
    const total = json.schoolInfo?.[0]?.head?.[0]?.list_total_count ?? 0;
    if (out.length >= total) break;
  }
  return out;
}

/**
 * 원본 xlsx 가 약칭('천안공', '강경상')을 써서 정규화가 어긋난 것들.
 * 뒤에 '고등학교'만 붙여 '천안공고등학교' 같은 엉터리 이름이 되었다.
 * 같은 학교이므로 새로 넣지 않고 기존 행의 이름만 고친다 (코드는 유지).
 *   우리 이름 → NEIS 공식명
 */
const RENAME = {
  당진중대호지분교장: "당진중학교대호지분교장",
  강경상고등학교: "강경상업고등학교",
  금산산고등학교: "금산산업고등학교",
  대천여상: "대천여자상업고등학교",
  서산공고등학교: "서산공업고등학교",
  장항공고등학교: "장항공업고등학교",
  주산산고등학교: "주산산업고등학교",
  천안공고등학교: "천안공업고등학교",
  충남외고등학교: "충남외국어고등학교",
  충남체고등학교: "충남체육고등학교",
  홍성공고등학교: "홍성공업고등학교",
};

/** 비교용으로 이름을 눌러 준다 (괄호·공백·중점 제거). */
const key = (s) =>
  s
    .replace(/\(.*?\)/g, "")
    .replace(/[\s·・]/g, "")
    .trim();

const existing = JSON.parse(readFileSync(SCHOOLS_JSON, "utf8"));
const byName = new Map();
for (const s of existing.schools) {
  byName.set(key(s.name), s);
  // 약칭으로 들어간 학교는 NEIS 공식명으로도 찾을 수 있게 해 둔다
  const official = RENAME[key(s.name)];
  if (official) byName.set(key(official), s);
}

const fetched = [];
for (const kind of KINDS) {
  const rows = await fetchKind(kind);
  console.log(`${kind}: ${rows.length}개`);
  for (const r of rows) {
    fetched.push({
      neisCode: String(r.SD_SCHUL_CODE).trim(),
      name: String(r.SCHUL_NM).trim(),
      type: KIND_TO_TYPE[kind],
      founded: String(r.FOND_SC_NM ?? "").trim(), // 공립 / 사립 / 국립
      district: String(r.JU_ORG_NM ?? "").trim(),
    });
  }
}

const added = [];
const matched = [];
const renamed = []; // 같은 학교인데 우리 이름이 잘못된 것 → UPDATE
for (const f of fetched) {
  const hit = byName.get(key(f.name));
  if (hit) {
    hit._seen = true;
    if (key(hit.name) !== key(f.name)) {
      renamed.push({ code: hit.code, from: hit.name, to: f.name });
      hit.name = f.name;
      hit.nameRaw = f.name;
    }
    matched.push({ ...f, code: hit.code });
  } else {
    added.push({ ...f, code: f.neisCode });
  }
}
const orphans = existing.schools.filter((s) => !s._seen && s.type !== "office");

console.log(`\n기존 ${existing.schools.length}개 / NEIS ${fetched.length}개`);
console.log(`  이름 일치 : ${matched.length}개 (코드 그대로 유지)`);
console.log(`  이름 정정 : ${renamed.length}개 (약칭 → 공식명, 코드 유지)`);
console.log(`  신규 추가 : ${added.length}개`);
const byFond = {};
for (const a of added) byFond[a.founded] = (byFond[a.founded] ?? 0) + 1;
console.log(`             설립별 ${JSON.stringify(byFond)}`);

if (orphans.length) {
  console.log(
    `\n⚠ NEIS 에 없는 기존 항목 ${orphans.length}개 (폐교/이름 변경 가능성 — 지우지 않고 남겨 둠):`
  );
  for (const o of orphans) console.log(`    ${o.code} ${o.name}`);
}

if (renamed.length) {
  console.log(`\n이름 정정 ${renamed.length}개:`);
  for (const r of renamed) console.log(`  ${r.code}  ${r.from} → ${r.to}`);
}

if (added.length === 0 && renamed.length === 0) {
  console.log("\n바꿀 것이 없습니다.");
  process.exit(0);
}

console.log(`\n신규 ${added.length}개:`);
for (const a of added) {
  console.log(`  ${a.code}  ${a.name}  (${a.founded}, ${a.district})`);
}

// schools.json 갱신 — 기존 항목은 그대로 두고 신규만 덧붙인다
const TYPE_ORDER = { middle: 1, high: 2, special: 3, office: 4 };
const merged = [
  ...existing.schools.map(({ _seen, ...rest }) => rest),
  ...added.map((a) => ({
    code: a.code,
    name: a.name,
    nameRaw: a.name,
    type: a.type,
    founded: a.founded,
  })),
];
merged.sort((a, b) => {
  const t = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
  return t !== 0 ? t : a.name.localeCompare(b.name, "ko");
});

const counts = {};
for (const s of merged) counts[s.type] = (counts[s.type] ?? 0) + 1;
writeFileSync(
  SCHOOLS_JSON,
  JSON.stringify(
    {
      source:
        "충청남도교육청 학교 명단 (초기: xlsx / 사립 등 누락분: NEIS 학교기본정보 API)",
      generated_at: new Date().toISOString(),
      counts: { ...counts, total: merged.length },
      schools: merged,
    },
    null,
    2
  ) + "\n",
  "utf8"
);
console.log(`\n→ ${SCHOOLS_JSON} (${merged.length}개)`);

// 신규분만 담은 SQL — 기존 행은 건드리지 않는다
const esc = (s) => s.replace(/'/g, "''");
const sql = `-- 학교 명단 보정 — 자동 생성: scripts/fetch-schools-neis.mjs
-- 출처: NEIS 학교기본정보 API (충청남도교육청 N10)
--
-- 기존 학교의 code 는 건드리지 않는다. profiles.school_code 가 이를 FK 로
-- 참조하므로 코드를 바꾸면 학생·교원 소속이 끊긴다.
-- 신규 학교의 code 는 NEIS 표준학교코드를 그대로 쓴다.

${
  renamed.length
    ? `-- ① 약칭으로 잘못 들어간 이름 ${renamed.length}개 정정 (같은 학교이므로 코드 유지)
${renamed
  .map(
    (r) =>
      `UPDATE public.schools SET name = '${esc(r.to)}' WHERE code = '${esc(r.code)}';  -- ${r.from}`
  )
  .join("\n")}
`
    : ""
}
-- ② 빠져 있던 학교 ${added.length}개 추가 (사립 ${added.filter((a) => a.founded === "사립").length}개 포함)
INSERT INTO public.schools (code, name, type) VALUES
${added.map((a) => `  ('${esc(a.code)}', '${esc(a.name)}', '${a.type}')`).join(",\n")}
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type;
`;
writeFileSync(ADD_SQL, sql, "utf8");
console.log(`→ ${ADD_SQL}`);
