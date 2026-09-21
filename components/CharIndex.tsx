"use client";

import Link from "next/link";
import { CHARACTERS, type CharKind } from "@/lib/characters";

const groups: { kind: CharKind; title: string; note: string }[] = [
  { kind: "hiragana", title: "ひらがな", note: "曲線と、終わり方" },
  { kind: "katakana", title: "カタカナ", note: "直線と、点の向き" },
  { kind: "kanji", title: "漢字", note: "中心と、左右の余白" },
];

export function CharIndex() {
  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-10">
      <p className="pt-4 text-[11px] tracking-[0.28em] text-gold">字を選ぶ</p>
      <h1 className="mt-2 font-serif text-3xl">いつも崩れる、あの字</h1>
      <p className="mt-2 text-sm text-ink-soft">
        レッスンの途中でも、気になる一文字からで構いません。
      </p>

      {groups.map((g) => {
        const chars = CHARACTERS.filter((c) => c.kind === g.kind);
        return (
          <section key={g.kind} className="mt-8">
            <h2 className="font-serif text-xl">{g.title}</h2>
            <p className="mt-1 text-[12px] text-ink-soft">{g.note}</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {chars.map((c) => (
                <Link
                  key={c.id}
                  href={`/practice/${encodeURIComponent(c.id)}`}
                  className="flex aspect-square items-center justify-center rounded-2xl bg-white/50 font-display text-2xl"
                >
                  {c.char}
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
