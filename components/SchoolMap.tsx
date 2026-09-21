"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SCHOOL_GRADES,
  gradeProgress,
  pickTodaySchoolPack,
  schoolHref,
  schoolRememberedCount,
} from "@/lib/school";
import { SCHOOL_ROWS } from "@/lib/school-rows";
import { loadState, type AppState } from "@/lib/storage";

const KIND_LABEL = {
  kotoba: "ことば",
  story: "物語",
  pair: "対",
  trap: "罠",
  dictation: "書き取り",
  pickup: "拾い",
} as const;

export function SchoolMap() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) return <div className="px-5 pt-16 text-ink-soft">地図を開いています…</div>;

  const today = pickTodaySchoolPack(state);
  const remembered = schoolRememberedCount(state);

  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-10">
      <p className="pt-4 text-[11px] tracking-[0.22em] text-gold">書きながら覚える</p>
      <h1 className="mt-2 font-serif text-3xl leading-snug">学年の地図</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        ドリルで暗記しません。ことば、物語、似た字の罠、高校は見ない書き取り。書いた字が、領土になります。
      </p>
      <p className="mt-3 text-sm">
        覚えた字 {remembered} / {SCHOOL_ROWS.length}
      </p>

      <section className="mt-6 rounded-3xl border border-ink/8 bg-white/50 px-5 py-5">
        <p className="text-[11px] tracking-[0.2em] text-gold">今日の組</p>
        <p className="mt-1 text-sm text-ink-soft">
          {today.grade.name} ・ {KIND_LABEL[today.pack.kind]}
        </p>
        <p className="mt-1 font-serif text-2xl">{today.pack.title}</p>
        <p className="mt-1 text-sm text-ink-soft">{today.pack.line}</p>
        <p className="mt-3 font-display text-3xl tracking-[0.12em]">{today.pack.glyphs.join(" ")}</p>
        <Link href={schoolHref(today.pack)} className="btn-ink mt-5 w-full">
          この組を、書く
        </Link>
      </section>

      <ul className="mt-6 space-y-2">
        {SCHOOL_GRADES.map((grade) => {
          const { have, total, percent } = gradeProgress(state, grade.id);
          return (
            <li key={grade.id}>
              <Link
                href={`/school/${grade.id}`}
                className="block rounded-3xl border border-ink/8 bg-white/40 px-4 py-4"
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[0.16em] text-gold">
                      {grade.kicker} ・ {have}/{total}
                    </p>
                    <p className="mt-1 font-serif text-xl">{grade.name}</p>
                    <p className="mt-1 text-[12px] text-ink-soft">{grade.hint}</p>
                  </div>
                  <p className="font-serif text-2xl tabular-nums">{percent}%</p>
                </div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-ink/70" style={{ width: `${percent}%` }} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
