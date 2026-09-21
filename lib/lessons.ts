import { CHARACTERS, type PracticeChar } from "./characters";

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  intro: string;
  characterIds: string[];
};

export const LESSONS: Lesson[] = [
  {
    id: "start",
    title: "はじめの3分",
    subtitle: "マスと中心をつかむ",
    minutes: 3,
    intro:
      "大人の字が崩れる第一の理由は、マスの使い方を忘れていることです。まずは十字の中心と、余白。形より先に、場所を整えます。",
    characterIds: ["kj-ichi", "kj-juu", "kj-hi"],
  },
  {
    id: "eiji",
    title: "永字八法",
    subtitle: "とめ・はね・はらいの原型",
    minutes: 5,
    intro:
      "「永」一文字に、点・横・縦・はね・はらいが揃っています。急がなくていい。一画ごとに、終わり方だけを確かめてください。",
    characterIds: ["kj-ei", "kj-tsuchi", "kj-ki", "kj-mizu", "kj-chiisai"],
  },
  {
    id: "hiragana-a",
    title: "ひらがな あ行",
    subtitle: "曲線の骨格",
    minutes: 5,
    intro:
      "ひらがなは、線の途中ではなく「始点と終点」で決まります。あ行は、輪の中心と、はらいの長さを意識すると一気に整います。",
    characterIds: ["h-あ", "h-い", "h-う", "h-え", "h-お"],
  },
  {
    id: "hiragana-kuzu",
    title: "崩れやすいひらがな",
    subtitle: "き・さ・そ・ぬ・ね・を",
    minutes: 8,
    intro:
      "仕事のメモで特に崩れる音です。形を覚えるより、一画の役割（止める・払う・結ぶ）を取り戻します。",
    characterIds: ["h-き", "h-さ", "h-そ", "h-ぬ", "h-ね", "h-を", "h-れ", "h-わ", "h-る"],
  },
  {
    id: "katakana",
    title: "カタカナの直線",
    subtitle: "角をはっきり",
    minutes: 5,
    intro:
      "カタカナが丸くなるのは、ひらがなの筋肉のまま書いているからです。点の向き（シとツ、ソとン）だけは、今日はっきりさせましょう。",
    characterIds: ["k-ア", "k-シ", "k-ツ", "k-ソ", "k-ン", "k-カ", "k-ハ", "k-ラ"],
  },
  {
    id: "kanji-kotsu",
    title: "漢字の骨格",
    subtitle: "左右・上下・中心",
    minutes: 6,
    intro:
      "漢字はパーツの会話です。左を細くして右を生かす。上を広くして下を安定させる。中心線が一本通ると、字は直ちに大人の字になります。",
    characterIds: ["kj-hito", "kj-iri", "kj-ki", "kj-kuni", "kj-wa", "kj-tadashi"],
  },
  {
    id: "daily-kanji",
    title: "よく書く漢字",
    subtitle: "日付・仕事・気持ち",
    minutes: 8,
    intro:
      "毎日使う字ほど、速さで壊れます。私・年・月・日・会・気・心。ゆっくり正しい形を一度通すと、翌日のメモが変わります。",
    characterIds: [
      "kj-watashi",
      "kj-nen",
      "kj-tsuki",
      "kj-hi",
      "kj-kai",
      "kj-ki2",
      "kj-kokoro",
      "kj-omou",
    ],
  },
  {
    id: "name-date",
    title: "名前と日付",
    subtitle: "人前に出す字",
    minutes: 6,
    intro:
      "書類の氏名欄と日付は、字の履歴書です。大きさだけでも揃える。様・名のバランスは、相手への礼儀でもあります。",
    characterIds: ["kj-namae", "kj-mae", "kj-nen", "kj-tsuki", "kj-hi", "kj-sama"],
  },
  {
    id: "flow",
    title: "整った漢字",
    subtitle: "見・書・話・行・来・美",
    minutes: 7,
    intro:
      "画数が多い字は、細部の前に「外の形」です。マスの七割に収める。中が詰まっても、外枠が美しいと字は読め、きれいに見えます。",
    characterIds: ["kj-miru", "kj-kaku", "kj-hanasu", "kj-iku", "kj-kuru", "kj-bi"],
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonChars(lesson: Lesson): PracticeChar[] {
  return lesson.characterIds
    .map((id) => CHARACTERS.find((c) => c.id === id))
    .filter((c): c is PracticeChar => Boolean(c));
}
