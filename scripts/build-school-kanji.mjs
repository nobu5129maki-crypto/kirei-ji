import { readFileSync, writeFileSync } from "node:fs";

const src = process.argv[2];
const dest = process.argv[3] ?? "lib/school-kanji-data.ts";
const raw = JSON.parse(readFileSync(src, "utf8"));
const list = raw.kanji ?? raw;

function kataToHira(s) {
  return [...s]
    .map((ch) => {
      const c = ch.codePointAt(0);
      return c >= 0x30a1 && c <= 0x30f6 ? String.fromCodePoint(c - 0x60) : ch;
    })
    .join("");
}

function cleanReading(k) {
  const kun = k.readings?.kun?.[0];
  if (kun) {
    return kun.split(/[.\-‐]/)[0].replace(/[^ぁ-んァ-ン一-龯]/g, "");
  }
  const on = k.readings?.on?.[0];
  if (on) return kataToHira(on);
  return "";
}

const rows = [];
for (const k of list) {
  const ch = k.character;
  if (!ch || [...ch].length !== 1) continue;
  const grade = Number(k.grade);
  if (![1, 2, 3, 4, 5, 6, 8].includes(grade)) continue;
  const strokes = Number(k.stroke_count) || 0;
  const reading = cleanReading(k) || ch;
  rows.push(`${ch}\t${strokes}\t${grade}\t${reading}`);
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

const body = `/** 常用漢字 ${rows.length} 字。学年は学習指導要領（小1-6・中学=8）。自動生成。 */
export const SCHOOL_KANJI_TSV = \`
${rows.join("\n")}
\`.trim();
`;

writeFileSync(dest, body, "utf8");
console.log(JSON.stringify({ total: rows.length, counts }, null, 2));
console.log("wrote", dest);
