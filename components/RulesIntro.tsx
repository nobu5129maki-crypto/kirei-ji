"use client";

import { useEffect } from "react";
import Link from "next/link";
import { markRulesSeen } from "@/lib/storage";
import type { PracticeChar } from "@/lib/characters";
import { PlaySteps } from "./PlaySteps";

export function RulesIntro({
  char,
  href,
  onStay,
}: {
  char: PracticeChar;
  href: string;
  onStay: () => void;
}) {
  useEffect(() => {
    document.documentElement.classList.add("rules-open");
    return () => document.documentElement.classList.remove("rules-open");
  }, []);

  const stay = () => {
    markRulesSeen();
    onStay();
  };

  return (
    <div
      role="dialog"
      aria-labelledby="rules-title"
      className="fixed inset-0 z-50 flex justify-center bg-desk"
    >
      <div className="relative flex h-full w-full max-w-[430px] flex-col overflow-auto bg-paper px-6 pt-[max(1.6rem,env(safe-area-inset-top))] pb-[max(1.8rem,env(safe-area-inset-bottom))]">
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-0.4rem] top-16 font-display text-[11rem] leading-none text-ink/[0.06]"
        >
          {char.char}
        </span>

        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.22em] text-gold">字をきれいに</p>
          <button type="button" className="text-sm text-ink-soft" onClick={stay}>
            ホームへ
          </button>
        </div>
        <h1 id="rules-title" className="mt-5 font-serif text-[2rem] leading-snug">
          今日は、
          <br />
          一枚だけ。
        </h1>
        <p className="mt-3 max-w-[20rem] text-sm leading-relaxed text-ink-soft">
          ドリルではありません。仕事で出す字を、一枚残していくゲームです。
        </p>

        <div className="mt-8">
          <PlaySteps variant="story" />
        </div>

        <p className="mt-7 text-sm leading-relaxed text-ink-soft">
          癖には名前と強さ（パーセント）があります。よく書けて残すと、数が下がります。
        </p>

        <div className="mt-auto pt-8">
          <Link href={href} className="btn-ink w-full" onClick={markRulesSeen}>
            {char.char} を、書く
          </Link>
        </div>
      </div>
    </div>
  );
}
