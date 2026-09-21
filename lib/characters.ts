export type CharKind = "hiragana" | "katakana" | "kanji" | "form";

export type StrokeFocus =
  | "tome"
  | "hane"
  | "harai"
  | "center"
  | "balance"
  | "size"
  | "curve"
  | "line";

export type PracticeChar = {
  id: string;
  char: string;
  reading: string;
  kind: CharKind;
  strokeCount: number;
  focus: StrokeFocus;
  /** 書くときの要点。短く、手を動かす人に向けて。 */
  tips: string[];
  /** 大人がやりがちな崩れ。 */
  mistakes: string[];
};

const hiraganaBase: [string, string, number, StrokeFocus][] = [
  ["あ", "あ", 3, "curve"],
  ["い", "い", 2, "harai"],
  ["う", "う", 2, "curve"],
  ["え", "え", 2, "balance"],
  ["お", "お", 3, "center"],
  ["か", "か", 3, "hane"],
  ["き", "き", 4, "hane"],
  ["く", "く", 1, "harai"],
  ["け", "け", 3, "hane"],
  ["こ", "こ", 2, "line"],
  ["さ", "さ", 2, "harai"],
  ["し", "し", 1, "curve"],
  ["す", "す", 2, "center"],
  ["せ", "せ", 3, "balance"],
  ["そ", "そ", 1, "curve"],
  ["た", "た", 4, "line"],
  ["ち", "ち", 2, "curve"],
  ["つ", "つ", 1, "curve"],
  ["て", "て", 1, "harai"],
  ["と", "と", 2, "tome"],
  ["な", "な", 4, "center"],
  ["に", "に", 3, "line"],
  ["ぬ", "ぬ", 2, "curve"],
  ["ね", "ね", 2, "curve"],
  ["の", "の", 1, "curve"],
  ["は", "は", 3, "hane"],
  ["ひ", "ひ", 1, "curve"],
  ["ふ", "ふ", 4, "center"],
  ["へ", "へ", 1, "harai"],
  ["ほ", "ほ", 4, "hane"],
  ["ま", "ま", 3, "hane"],
  ["み", "み", 2, "curve"],
  ["む", "む", 3, "center"],
  ["め", "め", 2, "curve"],
  ["も", "も", 3, "hane"],
  ["や", "や", 3, "harai"],
  ["ゆ", "ゆ", 2, "curve"],
  ["よ", "よ", 2, "hane"],
  ["ら", "ら", 2, "curve"],
  ["り", "り", 2, "harai"],
  ["る", "る", 1, "curve"],
  ["れ", "れ", 2, "hane"],
  ["ろ", "ろ", 1, "curve"],
  ["わ", "わ", 2, "curve"],
  ["を", "を", 3, "center"],
  ["ん", "ん", 1, "curve"],
];

const hiraganaExtra: Record<
  string,
  { tips: string[]; mistakes: string[] }
> = {
  あ: {
    tips: [
      "1画目の横は、左から右へ少しだけ右下がり。",
      "3画目の縦は、輪の中心を貫くように。楕円を意識。",
    ],
    mistakes: [
      "輪が縦長になりすぎる",
      "3画目が輪の左や右に寄る",
    ],
  },
  き: {
    tips: [
      "横画は3本とも、ほぼ同じ長さで揃える。",
      "最後の縦は、下で軽く左へはらう。",
    ],
    mistakes: ["横がバラバラの長さ", "下がとがりすぎる"],
  },
  さ: {
    tips: [
      "1画目の横のあと、2画目は上から左へ大きくはらう。",
      "切れすぎず、一筆のリズムで。",
    ],
    mistakes: ["2画目が点になって終わる", "全体が左に倒れる"],
  },
  そ: {
    tips: [
      "一筆。上の折れをはっきり、下は大きなカーブ。",
      "終わりは右下へ、少し余韻を残す。",
    ],
    mistakes: ["折れが丸まって「の」に見える", "下が小さい"],
  },
  ぬ: {
    tips: [
      "結びは急がず、輪の大きさを揃える。",
      "最後のはらいは輪の外へ抜ける。",
    ],
    mistakes: ["結びが潰れる", "全体が右に流れる"],
  },
  ね: {
    tips: [
      "1画目の縦を軸に、右側の曲線を大きく。",
      "「わ」と違い、途中で一度折れる。",
    ],
    mistakes: ["わ と形が混ざる", "右の曲線が小さい"],
  },
  を: {
    tips: [
      "上の横と、中の斜めをしっかり。",
      "下のカーブはマスの下側いっぱいを使う。",
    ],
    mistakes: ["下が小さすぎる", "上と下がバラバラ"],
  },
  れ: {
    tips: [
      "1画目の縦をまっすぐ。",
      "2画目は払ったあと、右へはねる。",
    ],
    mistakes: ["はねが出ない", "わ に近づく"],
  },
  わ: {
    tips: [
      "1画目は短めの縦。",
      "2画目は大きく左から回り、下で止める。",
    ],
    mistakes: ["輪が小さい", "れ と混ざる"],
  },
  る: {
    tips: [
      "一筆で、巻き込みを急がない。",
      "終わりの輪は、つぶさず余白を残す。",
    ],
    mistakes: ["ろ と区別がつかない", "巻きが点になる"],
  },
  ほ: {
    tips: [
      "左側の縦を軸にする。",
      "右側の横画の間隔を等しく。",
    ],
    mistakes: ["右が詰まる", "軸が斜め"],
  },
  し: {
    tips: [
      "上は軽く入り、下へいくほど深く。",
      "終わりは左下へ、はらいを最後まで。",
    ],
    mistakes: ["棒のように硬い", "途中で消える"],
  },
  の: {
    tips: [
      "楕円。縦より少し横に広いと安定する。",
      "始点と終点がぶつからないよう、隙間を残す。",
    ],
    mistakes: ["円が小さすぎる", "三角になる"],
  },
};

function defaultKanaTips(
  char: string,
  focus: StrokeFocus,
): { tips: string[]; mistakes: string[] } {
  const extra = hiraganaExtra[char];
  if (extra) return extra;
  const byFocus: Record<StrokeFocus, { tips: string[]; mistakes: string[] }> = {
    tome: {
      tips: ["止めは、筆をぐっと置いてから離す。"],
      mistakes: ["流れて止まらない"],
    },
    hane: {
      tips: ["はねは、止めてから小さく跳ねる。"],
      mistakes: ["跳ねすぎる、または出ない"],
    },
    harai: {
      tips: ["はらいは、最後まで一気に。途中で細くしない。"],
      mistakes: ["途中で切れる"],
    },
    center: {
      tips: ["マスの十字を意識して、中心を外さない。"],
      mistakes: ["左や上に寄る"],
    },
    balance: {
      tips: ["左右の幅を揃える。片方だけ大きくしない。"],
      mistakes: ["左右で大きさが違う"],
    },
    size: {
      tips: ["マスの七〜八割を目安に。"],
      mistakes: ["小さすぎる"],
    },
    curve: {
      tips: ["曲線は肩の力を抜いて、一拍で。"],
      mistakes: ["角ばる"],
    },
    line: {
      tips: ["直線は、始める位置と終わる位置を先に目で決める。"],
      mistakes: ["途中で曲がる"],
    },
  };
  return byFocus[focus];
}

export const CHARACTERS: PracticeChar[] = [
  ...hiraganaBase.map(([char, reading, strokeCount, focus]) => {
    const { tips, mistakes } = defaultKanaTips(char, focus);
    return {
      id: `h-${reading}`,
      char,
      reading,
      kind: "hiragana" as const,
      strokeCount,
      focus,
      tips,
      mistakes,
    };
  }),
  ...(
    [
      ["ア", "ア", 2, "line"],
      ["イ", "イ", 2, "harai"],
      ["ウ", "ウ", 3, "line"],
      ["カ", "カ", 2, "hane"],
      ["シ", "シ", 3, "harai"],
      ["ツ", "ツ", 3, "tome"],
      ["ソ", "ソ", 2, "harai"],
      ["ン", "ン", 2, "harai"],
      ["ス", "ス", 2, "harai"],
      ["タ", "タ", 3, "balance"],
      ["ト", "ト", 2, "line"],
      ["ナ", "ナ", 2, "harai"],
      ["ハ", "ハ", 2, "harai"],
      ["マ", "マ", 2, "line"],
      ["ヤ", "ヤ", 2, "harai"],
      ["ラ", "ラ", 2, "harai"],
      ["リ", "リ", 2, "line"],
    ] as [string, string, number, StrokeFocus][]
  ).map(([char, reading, strokeCount, focus]) => ({
    id: `k-${reading}`,
    char,
    reading,
    kind: "katakana" as const,
    strokeCount,
    focus,
    tips:
      char === "シ" || char === "ツ"
        ? [
            "シは点を斜めに、ツは点をほぼ横に。",
            "最後の長い払いの角度で区別する。",
          ]
        : char === "ソ" || char === "ン"
          ? [
              "ソは右上から左下へ。ンは左から右下へ。",
              "点の向きを先に決めてから払う。",
            ]
          : [
              "カタカナは直線の美しさ。曲線に逃げない。",
              "角をはっきり、長さを揃える。",
            ],
    mistakes: ["ひらがなのように丸める", "点の向きが曖昧"],
  })),
  {
    id: "kj-ei",
    char: "永",
    reading: "えい",
    kind: "kanji",
    strokeCount: 5,
    focus: "harai",
    tips: [
      "永字八法。点・横・縦・はね・はらいがすべて入る。",
      "横は右上がりにせず、ほぼ水平。はらいは最後まで。",
    ],
    mistakes: ["点が弱い", "はらいが途中で終わる"],
  },
  {
    id: "kj-ichi",
    char: "一",
    reading: "いち",
    kind: "kanji",
    strokeCount: 1,
    focus: "line",
    tips: [
      "左で入り、中ほどで少し太く、右で止める。",
      "マスの上下中央。短すぎない。",
    ],
    mistakes: ["右下がり", "細く短い"],
  },
  {
    id: "kj-juu",
    char: "十",
    reading: "じゅう",
    kind: "kanji",
    strokeCount: 2,
    focus: "center",
    tips: ["横と縦の交差は、少し上寄りが安定。", "縦は下までしっかり。"],
    mistakes: ["交差が下すぎる", "縦が短い"],
  },
  {
    id: "kj-tsuchi",
    char: "土",
    reading: "つち",
    kind: "kanji",
    strokeCount: 3,
    focus: "tome",
    tips: ["下の横が一番長い。上の横は短く。", "縦は下の横を突き抜けない。"],
    mistakes: ["士 と上下の横が逆", "下が短い"],
  },
  {
    id: "kj-ki",
    char: "木",
    reading: "き",
    kind: "kanji",
    strokeCount: 4,
    focus: "harai",
    tips: [
      "左右のはらいは、対称に。左は長く、右も負けない。",
      "縦は下まで。交差は中心。",
    ],
    mistakes: ["左はらいだけ長い", "縦が右に寄る"],
  },
  {
    id: "kj-mizu",
    char: "水",
    reading: "みず",
    kind: "kanji",
    strokeCount: 4,
    focus: "hane",
    tips: ["1画目の縦はねを軸に。", "左右のはらいを同じ高さで揃える。"],
    mistakes: ["軸が曲がる", "左右非対称"],
  },
  {
    id: "kj-chiisai",
    char: "小",
    reading: "しょう",
    kind: "kanji",
    strokeCount: 3,
    focus: "hane",
    tips: ["中の縦はねを先に。左右の点は、中より少し下。", "点が大きすぎない。"],
    mistakes: ["点がバラバラの高さ", "中が短い"],
  },
  {
    id: "kj-hito",
    char: "人",
    reading: "ひと",
    kind: "kanji",
    strokeCount: 2,
    focus: "harai",
    tips: ["左はらい、右はらい。交差は上寄り。", "下が開いて安定する。"],
    mistakes: ["交差が下すぎて不安定", "右が弱い"],
  },
  {
    id: "kj-iri",
    char: "入",
    reading: "いり",
    kind: "kanji",
    strokeCount: 2,
    focus: "harai",
    tips: ["人 より交差が上。左の払いが短い。", "人 との違いをはっきり。"],
    mistakes: ["人 と同じ形になる"],
  },
  {
    id: "kj-watashi",
    char: "私",
    reading: "わたし",
    kind: "kanji",
    strokeCount: 7,
    focus: "balance",
    tips: [
      "左の禾は細め、右の厶にスペースを残す。",
      "左右の高さを揃える。右が沈まないように。",
    ],
    mistakes: ["左が大きすぎる", "右が下に落ちる"],
  },
  {
    id: "kj-nen",
    char: "年",
    reading: "ねん",
    kind: "kanji",
    strokeCount: 6,
    focus: "center",
    tips: ["縦の軸を一本通す。横画の間隔を等しく。", "一番下の横を少し長く。"],
    mistakes: ["横が詰まる", "軸が斜め"],
  },
  {
    id: "kj-tsuki",
    char: "月",
    reading: "つき",
    kind: "kanji",
    strokeCount: 4,
    focus: "hane",
    tips: ["外枠は縦長。中の二本は等間隔。", "左は縦、右ははね。"],
    mistakes: ["正方形になる", "中が偏る"],
  },
  {
    id: "kj-hi",
    char: "日",
    reading: "ひ",
    kind: "kanji",
    strokeCount: 4,
    focus: "center",
    tips: ["縦長の長方形。中の横は左右に触れてもよい。", "枠を先に整える。"],
    mistakes: ["正方形や横長", "枠が歪む"],
  },
  {
    id: "kj-kai",
    char: "会",
    reading: "かい",
    kind: "kanji",
    strokeCount: 6,
    focus: "balance",
    tips: ["上の人型を広く。下の云は中央に収める。", "上が小さいと貧弱になる。"],
    mistakes: ["上が狭い", "下が大きい"],
  },
  {
    id: "kj-ki2",
    char: "気",
    reading: "き",
    kind: "kanji",
    strokeCount: 6,
    focus: "hane",
    tips: ["「气」の流れを止めない。", "中の×は枠の中心。"],
    mistakes: ["流れが折れて硬い", "中が寄る"],
  },
  {
    id: "kj-kokoro",
    char: "心",
    reading: "こころ",
    kind: "kanji",
    strokeCount: 4,
    focus: "center",
    tips: [
      "中の鉤を軸に、三点の高さをずらす。",
      "左の点は低く、右の点は少し高く。",
    ],
    mistakes: ["点が一直線", "鉤が弱い"],
  },
  {
    id: "kj-omou",
    char: "思",
    reading: "おもう",
    kind: "kanji",
    strokeCount: 9,
    focus: "balance",
    tips: ["上の田は少し小さめ。下が心の空間。", "田と心の中心を揃える。"],
    mistakes: ["田が大きい", "心が左にずれる"],
  },
  {
    id: "kj-kaku",
    char: "書",
    reading: "かく",
    kind: "kanji",
    strokeCount: 10,
    focus: "line",
    tips: ["上の横画を平行に、間隔を揃える。", "日は下の中央。"],
    mistakes: ["横が扇状に開く", "日が小さい"],
  },
  {
    id: "kj-hanasu",
    char: "話",
    reading: "はなし",
    kind: "kanji",
    strokeCount: 13,
    focus: "balance",
    tips: ["言は細め、舌に半分の幅を残す。", "左右の高さを揃える。"],
    mistakes: ["言が幅を取りすぎる", "右が沈む"],
  },
  {
    id: "kj-miru",
    char: "見",
    reading: "みる",
    kind: "kanji",
    strokeCount: 7,
    focus: "hane",
    tips: ["目は縦長。脚の左右は開いて安定。", "右の払いを弱くしない。"],
    mistakes: ["目が横長", "脚が閉じる"],
  },
  {
    id: "kj-iku",
    char: "行",
    reading: "いく",
    kind: "kanji",
    strokeCount: 6,
    focus: "balance",
    tips: ["左の行人偏は細く、右に空間。", "右の二本は長さを変える。"],
    mistakes: ["左右が同じ幅", "全体が詰まる"],
  },
  {
    id: "kj-kuru",
    char: "来",
    reading: "くる",
    kind: "kanji",
    strokeCount: 7,
    focus: "center",
    tips: ["縦の軸。横は上から順に長さを整える。", "下のはらいは対称に。"],
    mistakes: ["軸が右へ", "はらい不足"],
  },
  {
    id: "kj-namae",
    char: "名",
    reading: "な",
    kind: "kanji",
    strokeCount: 6,
    focus: "balance",
    tips: ["夕は左上、口は右下。対角線のバランス。", "口を小さすぎない。"],
    mistakes: ["口が落ちる", "夕が大きい"],
  },
  {
    id: "kj-mae",
    char: "前",
    reading: "まえ",
    kind: "kanji",
    strokeCount: 9,
    focus: "balance",
    tips: ["くさかんむりを広く。下は左右対称に近づける。", "月と刂の高さを揃える。"],
    mistakes: ["冠が狭い", "下が片側だけ長い"],
  },
  {
    id: "kj-sama",
    char: "様",
    reading: "さま",
    kind: "kanji",
    strokeCount: 14,
    focus: "balance",
    tips: ["木偏は細く。右の複雑な部分を潰さない。", "全体の中心をマスの中心に。"],
    mistakes: ["左が太い", "右がはみ出す"],
  },
  {
    id: "kj-kuni",
    char: "国",
    reading: "くに",
    kind: "kanji",
    strokeCount: 8,
    focus: "center",
    tips: ["外枠を先に、やや縦長。", "中の玉は枠にめり込ませず、余白を残す。"],
    mistakes: ["枠が歪む", "中が枠に付く"],
  },
  {
    id: "kj-wa",
    char: "和",
    reading: "わ",
    kind: "kanji",
    strokeCount: 8,
    focus: "balance",
    tips: ["禾は縦を軸に。口は右の中央。", "口を禾より下げすぎない。"],
    mistakes: ["口が小さい", "左右の高さ差"],
  },
  {
    id: "kj-bi",
    char: "美",
    reading: "び",
    kind: "kanji",
    strokeCount: 9,
    focus: "center",
    tips: ["羊の横画を平行に。大は下で開く。", "全体を縦に使い、中心を通す。"],
    mistakes: ["横が乱れる", "下が閉じる"],
  },
  {
    id: "kj-tadashi",
    char: "正",
    reading: "ただしい",
    kind: "kanji",
    strokeCount: 5,
    focus: "line",
    tips: ["一を土台に、止を乗せる。横は平行。", "縦は中心。"],
    mistakes: ["横が傾く", "上が大きい"],
  },
];

export const CHAR_BY_ID: Record<string, PracticeChar> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);

/** URL 用。日本語 ID は Windows / Next で 404 になるため ASCII にする */
export function charSlug(char: PracticeChar): string {
  if (/^[\x00-\x7F]+$/.test(char.id)) return char.id;
  const prefix = char.kind === "katakana" ? "kata" : "hira";
  return `${prefix}-${(char.char.codePointAt(0) ?? 0).toString(16)}`;
}

export const CHAR_BY_SLUG: Record<string, PracticeChar> = Object.fromEntries(
  CHARACTERS.map((c) => [charSlug(c), c]),
);

/** `/practice/[id]` の日本語 ID がエンコードされて届いても照合できるようにする */
export function normalizeCharId(raw: string): string {
  let id = raw.trim();
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(id);
      if (next === id) break;
      id = next;
    } catch {
      break;
    }
  }
  return id;
}

export function getChar(id: string): PracticeChar | undefined {
  const normalized = normalizeCharId(id);
  return (
    CHAR_BY_ID[normalized] ||
    CHAR_BY_SLUG[normalized] ||
    CHAR_BY_ID[id] ||
    CHAR_BY_SLUG[id] ||
    CHARACTERS.find(
      (c) =>
        c.id === normalized ||
        c.char === normalized ||
        charSlug(c) === normalized,
    )
  );
}

export function practicePath(id: string): string {
  const c = getChar(id);
  return `/practice/${c ? charSlug(c) : encodeURIComponent(id)}`;
}

export function charsByKind(kind: CharKind): PracticeChar[] {
  return CHARACTERS.filter((c) => c.kind === kind);
}

export const DIAGNOSE_IDS = [
  "h-あ",
  "h-を",
  "kj-ei",
  "kj-watashi",
  "kj-kokoro",
] as const;

export const FOCUS_LABEL: Record<StrokeFocus, string> = {
  tome: "とめ",
  hane: "はね",
  harai: "はらい",
  center: "中心",
  balance: "バランス",
  size: "大きさ",
  curve: "曲線",
  line: "直線",
};
