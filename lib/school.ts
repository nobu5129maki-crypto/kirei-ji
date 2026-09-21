import {
  CHARACTERS,
  type PracticeChar,
  type StrokeFocus,
  practicePath,
} from "./characters";
import { SCHOOL_BY_CHAR, SCHOOL_ROWS, rawSchoolId, type SchoolRow } from "./school-rows";
import { type AppState, todayStamp } from "./storage";

export { SCHOOL_BY_CHAR, SCHOOL_ROWS };

export const REMEMBER_SCORE = 70;

export type SchoolGradeId = "g1" | "g2" | "g3" | "g4" | "g5" | "g6" | "jh" | "hs";

export type { SchoolRow };

export type PackKind = "kotoba" | "story" | "pair" | "trap" | "dictation" | "pickup";

export type SchoolPack = {
  id: string;
  grade: SchoolGradeId;
  kind: PackKind;
  title: string;
  line: string;
  glyphs: string[];
};

export const SCHOOL_GRADES: {
  id: SchoolGradeId;
  year: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9;
  name: string;
  kicker: string;
  hint: string;
}[] = [
  { id: "g1", year: 1, name: "小学1年", kicker: "80字", hint: "線と、マスの中心。" },
  { id: "g2", year: 2, name: "小学2年", kicker: "160字", hint: "ことばにして書く。" },
  { id: "g3", year: 3, name: "小学3年", kicker: "200字", hint: "左右と、終わり方。" },
  { id: "g4", year: 4, name: "小学4年", kicker: "202字", hint: "漢の骨組み。" },
  { id: "g5", year: 5, name: "小学5年", kicker: "193字", hint: "画が多くても、外の形。" },
  { id: "g6", year: 6, name: "小学6年", kicker: "191字", hint: "大人の字の入口。" },
  { id: "jh", year: 8, name: "中学", kicker: "1110字", hint: "常用の残りを、領土にする。" },
  { id: "hs", year: 9, name: "高校", kicker: "書き取り", hint: "新しい字より、見ないで書けるか。" },
];

const EXISTING_BY_GLYPH: Record<string, PracticeChar> = Object.fromEntries(
  CHARACTERS.filter((c) => c.kind === "kanji").map((c) => [c.char, c]),
);

export function schoolId(ch: string): string {
  return EXISTING_BY_GLYPH[ch]?.id ?? rawSchoolId(ch);
}

function guessFocus(strokes: number): StrokeFocus {
  if (strokes <= 1) return "line";
  if (strokes <= 3) return "center";
  if (strokes <= 7) return "balance";
  return "center";
}

export function toSchoolChar(row: SchoolRow): PracticeChar {
  const existing = EXISTING_BY_GLYPH[row.char];
  if (existing) return existing;
  const grade = row.year === 8 ? "中学" : `小学${row.year}年`;
  return {
    id: schoolId(row.char),
    char: row.char,
    reading: row.reading,
    kind: "kanji",
    strokeCount: row.strokeCount,
    focus: guessFocus(row.strokeCount),
    tips: [
      `${grade}で習う字。マスの七〜八割、十字の交点に心臓を。`,
      `読みは「${row.reading}」。細部より、外の形を先に。`,
    ],
    mistakes: ["小さくなる", "中心が寄る"],
  };
}

export function getSchoolChar(id: string): PracticeChar | undefined {
  if (id.startsWith("sk-")) {
    const cp = Number.parseInt(id.slice(3), 16);
    if (!Number.isFinite(cp)) return undefined;
    const ch = String.fromCodePoint(cp);
    const existing = EXISTING_BY_GLYPH[ch];
    if (existing) return existing;
    const row = SCHOOL_BY_CHAR[ch];
    return row ? toSchoolChar(row) : undefined;
  }
  if ([...id].length === 1 && SCHOOL_BY_CHAR[id]) return toSchoolChar(SCHOOL_BY_CHAR[id]);
  return undefined;
}

export function charsInGrade(grade: SchoolGradeId): SchoolRow[] {
  if (grade === "hs") return SCHOOL_ROWS.filter((r) => r.year === 8);
  const year = SCHOOL_GRADES.find((g) => g.id === grade)?.year;
  if (!year || year === 9) return [];
  return SCHOOL_ROWS.filter((r) => r.year === year);
}

function pack(
  id: string,
  grade: SchoolGradeId,
  kind: PackKind,
  title: string,
  line: string,
  glyphs: string,
): SchoolPack {
  return {
    id,
    grade,
    kind,
    title,
    line,
    glyphs: [...glyphs].filter((ch) => SCHOOL_BY_CHAR[ch] || EXISTING_BY_GLYPH[ch]),
  };
}

/** ことば・物語・対・罠で先に出す。残りは拾い書き。 */
const CURATED: SchoolPack[] = [
  pack("g1-kazu", "g1", "kotoba", "数の列", "一二三四五。長さを揃えて。", "一二三四五"),
  pack("g1-hou", "g1", "pair", "上下左右", "十字の四方向。", "上下左右"),
  pack("g1-ooki", "g1", "pair", "大と小", "同じマスで、差をつける。", "大小中"),
  pack("g1-week", "g1", "kotoba", "曜日の種", "日月火水木金土。", "日月火水木金土"),
  pack("g1-sizen", "g1", "story", "山と森", "山が並ぶと林、増えると森。", "山林森川"),
  pack("g1-hito", "g1", "story", "人の列", "人の下に、子と女と男。", "人子女男"),
  pack("g1-gakko", "g1", "kotoba", "学校", "学と校を、同じ大きさで。", "学校先生"),
  pack("g1-karada", "g1", "story", "からだ", "手・口・耳・目。", "手口耳目"),
  pack("g1-tenki", "g1", "kotoba", "天気", "天と気と雨。", "天気雨空"),
  pack("g1-iro", "g1", "pair", "色のはじまり", "赤青白。横を平行に。", "赤青白"),
  pack("g1-mura", "g1", "story", "村と町", "田のそばの暮らし。", "村町田土"),
  pack("g1-hana", "g1", "story", "花と草", "竹も、まっすぐに。", "花草竹木"),
  pack("g1-inu", "g1", "trap", "犬と大", "点が一つで、犬になる。", "大犬"),
  pack("g1-iri", "g1", "trap", "人と入", "開くか、閉じるか。", "人入"),

  pack("g2-umi", "g2", "story", "海へ", "山を出て、川が海になる。", "山川海"),
  pack("g2-tomodachi", "g2", "kotoba", "友達", "友の手を、開いて。", "友達親子"),
  pack("g2-densha", "g2", "kotoba", "電車", "電の雨冠を、広く。", "電車駅道"),
  pack("g2-asa", "g2", "story", "朝と夜", "昼を挟んで、一日。", "朝昼夜夜"),
  pack("g2-haru", "g2", "story", "四季", "春夏秋冬。横の間隔を等しく。", "春夏秋冬"),
  pack("g2-youbi", "g2", "kotoba", "曜日", "曜の日を、右に残す。", "曜日週回"),
  pack("g2-gaku", "g2", "kotoba", "計算", "数と算。桁を揃える気持ちで。", "計算数学"),
  pack("g2-kokoro", "g2", "story", "心の形", "思・知・言。中心を通す。", "心思知言"),
  pack("g2-ie", "g2", "story", "家の中", "戸を開けて、部屋へ。", "家戸部屋"),
  pack("g2-taberu", "g2", "story", "食べる", "米と肉と魚。", "食米肉魚"),
  pack("g2-hashi", "g2", "trap", "形が近い", "同と週の口、線の向き。", "同週走"),
  pack("g2-kita", "g2", "pair", "東西南北", "方の十字。", "東西南北"),
  pack("g2-uta", "g2", "kotoba", "音楽", "音と楽。点を弱くしない。", "音楽歌声"),

  pack("g3-byouin", "g3", "kotoba", "病院", "病だれを、広く取る。", "病院医者"),
  pack("g3-eki", "g3", "story", "駅前", "駅から港、橋を渡る。", "駅港橋岸"),
  pack("g3-shumi", "g3", "story", "趣味の午後", "詩を書いて、絵を見る。", "詩絵音楽"),
  pack("g3-shi", "g3", "trap", "士と土", "上が短いか、下が短いか。", "士土"),
  pack("g3-mi", "g3", "trap", "未と末", "上の横が短ければ未。", "未末"),
  pack("g3-yasai", "g3", "story", "畑の味", "茶と豆と油。", "茶豆油味"),
  pack("g3-tabi", "g3", "kotoba", "旅行", "旅の方を、流さない。", "旅行駅道"),
  pack("g3-kankoku", "g3", "kotoba", "研究", "究の穴冠を、潰さない。", "研究質問"),
  pack("g3-shiai", "g3", "story", "試合", "勝っても、字は慌てない。", "勝負試合"),
  pack("g3-umi2", "g3", "story", "湖と島", "水辺の漢字。", "湖島波氷"),
  pack("g3-kurai", "g3", "pair", "暗と消", "日が沈む、火が消える。", "暗消死生"),

  pack("g4-ai", "g4", "kotoba", "愛と希望", "心を、中に置く。", "愛希望願"),
  pack("g4-ken", "g4", "kotoba", "健康", "康の部分、左を細く。", "健康病院"),
  pack("g4-seiji", "g4", "story", "社会の字", "議と選と府。", "議論選府"),
  pack("g4-shi2", "g4", "trap", "氏と民", "はらいの長さで決まる。", "氏民"),
  pack("g4-sai", "g4", "kotoba", "材料", "材と料。木偏を揃える。", "材料産機"),
  pack("g4-sora", "g4", "story", "空を飛ぶ", "飛と航と灯。", "飛行灯堂"),
  pack("g4-rekishi", "g4", "kotoba", "歴史", "史の下を、止めきる。", "歴史戦軍"),
  pack("g4-fuku", "g4", "story", "副と福", "示偏と衣、役割を分ける。", "副福衣袋"),
  pack("g4-nen", "g4", "pair", "特と得", "牛と彳、左側で見分ける。", "特得"),

  pack("g5-sekinin", "g5", "kotoba", "責任", "責の貝を、潰さない。", "責任義務"),
  pack("g5-keizai", "g5", "kotoba", "経済", "経の糸を、平行に。", "経済政治"),
  pack("g5-kagaku", "g5", "kotoba", "科学", "科の禾を、左に細く。", "科学技術"),
  pack("g5-shi3", "g5", "trap", "情と精", "青の上で、心か米か。", "情精晴"),
  pack("g5-geijutsu", "g5", "story", "芸術", "術の行構えを、広く。", "芸術演技"),
  pack("g5-shizen", "g5", "story", "自然", "燃える火と、残る液。", "自然液燃"),
  pack("g5-eiyou", "g5", "kotoba", "栄養", "食の下を、開く。", "栄養衛健"),
  pack("g5-hanketsu", "g5", "kotoba", "判断", "判の刀を、最後まではらう。", "判断評価"),
  pack("g5-koku", "g5", "story", "国家", "政と税と防。", "政治税防"),

  pack("g6-yume", "g6", "kotoba", "夢と希望", "夢の夕を、寝かせすぎない。", "夢希望想"),
  pack("g6-sonkei", "g6", "kotoba", "尊敬", "敬の攵を、はっきり。", "尊敬感謝"),
  pack("g6-kankyo", "g6", "kotoba", "環境", "環の王を、小さく。", "環境資源"),
  pack("g6-shi4", "g6", "trap", "暮と幕", "日か、巾か。", "暮幕"),
  pack("g6-bungaku", "g6", "story", "文学", "詩を訳して、論ずる。", "文学議論"),
  pack("g6-kenko", "g6", "kotoba", "血液", "血の皿を、水平に。", "血液脳筋"),
  pack("g6-kokusai", "g6", "kotoba", "国際", "際の祭を、詰めない。", "国際貿易"),
  pack("g6-dowa", "g6", "story", "城と武", "聖も優も、上を広く。", "城武聖優"),

  pack("jh-jiyu", "jh", "kotoba", "自由", "己を、枠の中で伸ばす。", "自由権利"),
  pack("jh-heiwa", "jh", "kotoba", "平和", "平の点を、揃える。", "平和戦争"),
  pack("jh-tetsugaku", "jh", "kotoba", "哲学", "哲の口を、開けて。", "哲学思想"),
  pack("jh-kagaku2", "jh", "story", "実験", "験の馬を、右に残す。", "実験理論"),
  pack("jh-keizai2", "jh", "kotoba", "金融", "融の虫を、弱くしない。", "金融貿易"),
  pack("jh-bungaku2", "jh", "story", "小説", "説の兑を、流さない。", "小説詩歌"),
  pack("jh-chiri", "jh", "story", "地理", "緯と経。糸偏を揃える。", "緯経地形"),
  pack("jh-houritsu", "jh", "kotoba", "法律", "律の聿を、まっすぐに。", "法律裁判"),
  pack("jh-iryo", "jh", "kotoba", "医療", "療の療を、上から広く。", "医療看護"),
  pack("jh-kankyo2", "jh", "kotoba", "気候", "候の矢を、止めきる。", "気候災害"),
  pack("jh-trap1", "jh", "trap", "緑と縁", "糸の下で見分ける。", "緑縁"),
  pack("jh-trap2", "jh", "trap", "壁と避", "土か、辶か。", "壁避"),
  pack("jh-trap3", "jh", "trap", "暑と署", "日か、網か。", "暑署"),

  pack("hs-isseki", "hs", "dictation", "一石二鳥", "読みを見て、四字を書く。", "一石二鳥"),
  pack("hs-onko", "hs", "dictation", "温故知新", "故の古い口を、忘れない。", "温故知新"),
  pack("hs-jiga", "hs", "dictation", "自画自賛", "同じ自を、二度同じ大きさで。", "自画自賛"),
  pack("hs-ikki", "hs", "dictation", "一期一会", "会の人を、開く。", "一期一会"),
  pack("hs-junin", "hs", "dictation", "十人十色", "十を、短くしない。", "十人十色"),
  pack("hs-nisshin", "hs", "dictation", "日進月歩", "進の辶を、長く。", "日進月歩"),
  pack("hs-denko", "hs", "dictation", "電光石火", "光の⼉を、開く。", "電光石火"),
  pack("hs-unzan", "hs", "dictation", "雲散霧消", "雨冠を、広く揃える。", "雲散霧消"),
  pack("hs-baji", "hs", "dictation", "馬耳東風", "馬の四点を、揃える。", "馬耳東風"),
  pack("hs-rinki", "hs", "dictation", "臨機応変", "臨の臣を、縦に使う。", "臨機応変"),
  pack("hs-trap-mi", "hs", "trap", "未と末と味", "上の横、一点の差。", "未末味"),
  pack("hs-trap-shi", "hs", "trap", "士と土と志", "横の長短が、意味になる。", "士土志"),
  pack("hs-trap-hi", "hs", "trap", "日と目と月", "閉じ方と、中の線。", "日目月"),
  pack("hs-wasure", "hs", "dictation", "忘れかけ", "点の低い字を、見ないで。", ""),
].filter((p) => p.glyphs.length >= 2 || p.id === "hs-wasure");

function chunk<T>(list: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
}

function curatedGlyphs(grade: SchoolGradeId): Set<string> {
  const set = new Set<string>();
  for (const p of CURATED) {
    if (p.grade === grade) for (const g of p.glyphs) set.add(g);
  }
  return set;
}

export function leftoverPacks(grade: SchoolGradeId): SchoolPack[] {
  if (grade === "hs") {
    return leftoverPacks("jh").map((p, i) => ({
      ...p,
      id: `hs-pick-${i + 1}`,
      grade: "hs",
      kind: "dictation" as const,
      title: `書き取り拾い ${i + 1}`,
      line: "中学の字を、見ないで書く。",
    }));
  }
  const used = curatedGlyphs(grade);
  const left = charsInGrade(grade).filter((r) => !used.has(r.char));
  return chunk(left, 5).map((group, i) => ({
    id: `${grade}-pick-${i + 1}`,
    grade,
    kind: "pickup" as const,
    title: `拾い書き ${i + 1}`,
    line: "まだ組になっていない字を、5つ。",
    glyphs: group.map((r) => r.char),
  }));
}

export function packsForGrade(grade: SchoolGradeId): SchoolPack[] {
  return [...CURATED.filter((p) => p.grade === grade && p.glyphs.length >= 2), ...leftoverPacks(grade)];
}

export function getPack(id: string): SchoolPack | undefined {
  const curated = CURATED.find((p) => p.id === id);
  if (curated) return curated;
  const matched = id.match(/^(g[1-6]|jh|hs)-pick-(\d+)$/);
  if (!matched) return id === "hs-wasure" ? CURATED.find((p) => p.id === id) : undefined;
  return leftoverPacks(matched[1] as SchoolGradeId).find((p) => p.id === id);
}

export function getGrade(id: string): (typeof SCHOOL_GRADES)[number] | undefined {
  return SCHOOL_GRADES.find((g) => g.id === id);
}

export function isRemembered(state: AppState, glyph: string): boolean {
  const id = schoolId(glyph);
  return (state.records[id]?.best ?? 0) >= REMEMBER_SCORE;
}

export function gradeProgress(state: AppState, grade: SchoolGradeId): { have: number; total: number; percent: number } {
  const rows = charsInGrade(grade);
  const total = rows.length;
  const have = rows.filter((r) => isRemembered(state, r.char)).length;
  return { have, total, percent: total ? Math.round((have / total) * 100) : 0 };
}

export function packProgress(state: AppState, packItem: SchoolPack): { have: number; total: number; done: boolean } {
  const total = packItem.glyphs.length;
  const have = packItem.glyphs.filter((g) => isRemembered(state, g)).length;
  return { have, total, done: total > 0 && have >= total };
}

export function schoolHref(packItem: SchoolPack): string {
  const ids = packItem.glyphs.map(schoolId);
  const from = packItem.kind === "dictation" ? "school-dict" : "school";
  const q = new URLSearchParams({
    queue: ids.join(","),
    from,
    grade: packItem.grade,
    pack: packItem.id,
  });
  return `${practicePath(ids[0])}?${q.toString()}`;
}

export function schoolCharHref(glyph: string, grade: SchoolGradeId): string {
  const id = schoolId(glyph);
  const q = new URLSearchParams({ from: "school", grade });
  return `${practicePath(id)}?${q.toString()}`;
}

function daySeed(stamp: string): number {
  let h = 2166136261;
  for (let i = 0; i < stamp.length; i++) {
    h ^= stamp.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function weakSchoolPack(state: AppState): SchoolPack | null {
  const weak = SCHOOL_ROWS.filter((r) => {
    const rec = state.records[schoolId(r.char)];
    return rec && rec.best >= 1 && rec.best < 80;
  })
    .sort((a, b) => (state.records[schoolId(a.char)]?.last ?? 0) - (state.records[schoolId(b.char)]?.last ?? 0))
    .slice(0, 3);
  if (weak.length < 2) return null;
  return {
    id: "hs-wasure",
    grade: "hs",
    kind: "dictation",
    title: "忘れかけ",
    line: "一度書いた字を、見ないで。",
    glyphs: weak.map((r) => r.char),
  };
}

export function pickTodaySchoolPack(state: AppState): { pack: SchoolPack; grade: (typeof SCHOOL_GRADES)[number] } {
  const forgotten = weakSchoolPack(state);
  if (forgotten && daySeed(todayStamp()) % 3 === 0) {
    return { pack: forgotten, grade: SCHOOL_GRADES[7] };
  }
  for (const grade of SCHOOL_GRADES) {
    const packs = packsForGrade(grade.id);
    const next = packs.find((p) => !packProgress(state, p).done);
    if (next) return { pack: next, grade };
  }
  const fallback = CURATED[0];
  return { pack: fallback, grade: SCHOOL_GRADES[0] };
}

export function schoolRememberedCount(state: AppState): number {
  return SCHOOL_ROWS.filter((r) => isRemembered(state, r.char)).length;
}
