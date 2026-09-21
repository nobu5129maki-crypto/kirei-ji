"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  charsInGrade,
  getGrade,
  isRemembered,
  leftoverPacks,
  packProgress,
  packsForGrade,
  schoolCharHref,
  schoolHref,
  type SchoolGradeId,
  type SchoolPack,
} from "@/lib/school";
import { loadState, type AppState } from "@/lib/storage";

const KIND_LABEL: Record<SchoolPack["kind"], string> = {
  kotoba: "ことば",
  story: "物語",
  pair: "対",
  trap: "罠",
  dictation: "書き取り",
  pickup: "拾い",
};

export function SchoolGradeView({ gradeId }: { gradeId: SchoolGradeId }) {
  const grade = getGrade(gradeId);
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const packs = useMemo(() => packsForGrade(gradeId), [gradeId]);
  const curated = packs.filter((p) => p.kind !== "pickup");
  const rows = charsInGrade(gradeId);

  if (!grade) return null;
  if (!state) return <div className="px-5 pt-16 text-ink-soft">学年を開いています…</div>;

  const nextPick = leftoverPacks(gradeId).find((p) => !packProgress(state, p).done);
  const nextCurated = curated.find((p) => !packProgress(state, p).done);

  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-10">
      <Link href="/school" className="inline-block pt-4 text-sm text-ink-soft">
        学年の地図
      </Link>
      <p className="mt-6 text-[11px] tracking-[0.22em] text-gold">
        {grade.kicker} ・ {grade.hint}
      </p>
      <h1 className="mt-2 font-serif text-3xl">{grade.name}</h1>

      {nextCurated && (
        <Link
          href={schoolHref(nextCurated)}
          className="mt-5 block rounded-3xl border border-ink/8 bg-white/50 px-5 py-4"
        >
          <p className="text-[11px] tracking-[0.2em] text-gold">
            すすめ ・ {KIND_LABEL[nextCurated.kind]}
          </p>
          <p className="mt-1 font-serif text-2xl">{nextCurated.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{nextCurated.line}</p>
          <p className="mt-3 font-display text-3xl tracking-[0.12em]">
            {nextCurated.glyphs.join(" ")}
          </p>
          <p className="btn-ink mt-4">この組を、書く</p>
        </Link>
      )}

      <section className="mt-8">
        <h2 className="font-serif text-xl">おもしろ組</h2>
        <ul className="mt-3 space-y-2">
          {curated.map((pack) => {
            const prog = packProgress(state, pack);
            return (
              <li key={pack.id}>
                <Link
                  href={schoolHref(pack)}
                  className="block rounded-2xl border border-ink/8 bg-white/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] tracking-widest text-gold">{KIND_LABEL[pack.kind]}</p>
                    <p className="text-[11px] text-ink-soft">
                      {prog.done ? "通った" : `${prog.have}/${prog.total}`}
                    </p>
                  </div>
                  <p className="mt-1 font-serif text-lg">{pack.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">{pack.glyphs.join(" ")}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {nextPick && (
        <section className="mt-8">
          <h2 className="font-serif text-xl">拾い書き</h2>
          <p className="mt-1 text-sm text-ink-soft">組から漏れた字を、5つずつ拾います。</p>
          <Link href={schoolHref(nextPick)} className="btn-ghost mt-3 w-full">
            次の5字を、書く
          </Link>
        </section>
      )}

      {rows.length > 0 && rows.length <= 250 && (
        <section className="mt-8">
          <h2 className="font-serif text-xl">この学年の字</h2>
          <p className="mt-1 text-[12px] text-ink-soft">色がついた字は、一度通っています。</p>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {rows.map((row) => (
                <Link
                  key={row.char}
                  href={schoolCharHref(row.char, gradeId)}
                  className={`flex aspect-square items-center justify-center rounded-xl font-display text-xl ${
                    isRemembered(state, row.char) ? "bg-ink text-paper" : "bg-white/50"
                  }`}
                >
                  {row.char}
                </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

