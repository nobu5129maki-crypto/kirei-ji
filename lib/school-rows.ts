import { SCHOOL_KANJI_TSV } from "./school-kanji-data";

export type SchoolRow = {
  char: string;
  strokeCount: number;
  year: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  reading: string;
};

export const SCHOOL_ROWS: SchoolRow[] = SCHOOL_KANJI_TSV.split("\n").map((line) => {
  const [char, strokes, year, reading] = line.split("\t");
  return {
    char,
    strokeCount: Number(strokes) || 0,
    year: Number(year) as SchoolRow["year"],
    reading,
  };
});

export const SCHOOL_BY_CHAR: Record<string, SchoolRow> = Object.fromEntries(
  SCHOOL_ROWS.map((r) => [r.char, r]),
);

export function rawSchoolId(ch: string): string {
  return `sk-${(ch.codePointAt(0) ?? 0).toString(16)}`;
}
