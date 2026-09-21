import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
const dest = process.argv[3] ?? "lib/school-kanji-data.ts";
const raw = JSON.parse(readFileSync(src, "utf8"));
const list = raw.kanji ?? raw;

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function cleanOn(s) {
  return String(s)
    .replace(/[-‐.].*$/, "")
    .replace(/[^ァ-ンー]/g, "");
}

function cleanKun(s) {
  const raw = String(s);
  const [stem, okuri] = raw.split(".");
  const head = stem.replace(/[-‐].*$/, "").replace(/[^ぁ-ん]/g, "");
  if (!head) return "";
  const tail = (okuri ?? "").replace(/[^ぁ-ん]/g, "");
  return tail ? `${head}（${tail}）` : head;
}

function cleanReading(k) {
  const kun = unique((k.readings?.kun ?? []).map(cleanKun)).slice(0, 4);
  const on = unique((k.readings?.on ?? []).map(cleanOn)).slice(0, 4);
  return { on, kun, display: kun[0] || on[0] || "" };
}

const rows = [];
for (const k of list) {
  const ch = k.character;
  if (!ch || [...ch].length !== 1) continue;
  const grade = Number(k.grade);
  if (![1, 2, 3, 4, 5, 6, 8].includes(grade)) continue;
  const strokes = Number(k.stroke_count) || 0;
  const { on, kun, display } = cleanReading(k);
  rows.push(`${ch}\t${strokes}\t${grade}\t${display}\t${on.join("、")}\t${kun.join("、")}`);
}

rows.sort((a, b) => {
  const [ca, sa, ga] = a.split("\t");
  const [cb, sb, gb] = b.split("\t");
  return Number(ga) - Number(gb) || Number(sa) - Number(sb) || ca.localeCompare(cb, "ja");
});

const counts = Object.create(null);
for (const row of rows) {
  const g = row.split("\t")[2];
  counts[g] = (counts[g] ?? 0) + 1;
}

const body = `/** 常用漢字 ${rows.length} 字。学年は学習指導要領（小1-6・中学=8）。音訓つき。自動生成。 */
export const SCHOOL_KANJI_TSV = \`
${rows.join("\n")}
\`.trim();
`;

writeFileSync(dest, body, "utf8");
console.log(JSON.stringify({ total: rows.length, counts }, null, 2));
console.log("wrote", dest);
