import { SCHOOL_KANJI_TSV } from "./school-kanji-data";

export type SchoolRow = {
  char: string;
  strokeCount: number;
  year: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  reading: string;
  onYomi: string[];
  kunYomi: string[];
};

function splitReadings(raw?: string): string[] {
  return (raw ?? "")
    .split("、")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const SCHOOL_ROWS: SchoolRow[] = SCHOOL_KANJI_TSV.split("\n").map((line) => {
  const [char, strokes, year, reading, on, kun] = line.split("\t");
  return {
    char,
    strokeCount: Number(strokes) || 0,
    year: Number(year) as SchoolRow["year"],
    reading,
    onYomi: splitReadings(on),
    kunYomi: splitReadings(kun),
  };
});

export const SCHOOL_BY_CHAR: Record<string, SchoolRow> = Object.fromEntries(
  SCHOOL_ROWS.map((r) => [r.char, r]),
);

export function rawSchoolId(ch: string): string {
  return `sk-${(ch.codePointAt(0) ?? 0).toString(16)}`;
}

export function readingsOf(glyph: string): { on: string[]; kun: string[] } {
  const row = SCHOOL_BY_CHAR[glyph];
  return { on: row?.onYomi ?? [], kun: row?.kunYomi ?? [] };
}

export function readingTip(row: SchoolRow): string {
  const bits: string[] = [];
  if (row.onYomi.length) bits.push(`音 ${row.onYomi.join("・")}`);
  if (row.kunYomi.length) bits.push(`訓 ${row.kunYomi.join("・")}`);
  return bits.length ? bits.join("。") : `読みは「${row.reading}」`;
}
