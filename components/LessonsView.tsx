"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LESSONS, lessonChars } from "@/lib/lessons";
import { loadState } from "@/lib/storage";

export function LessonsView() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const records = loadState().records;
    const map: Record<string, boolean> = {};
    for (const lesson of LESSONS) {
      map[lesson.id] = lesson.characterIds.every((id) => records[id]?.count);
    }
    setDone(map);
  }, []);

  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-8">
      <p className="pt-4 text-[11px] tracking-[0.28em] text-gold">レッスン</p>
      <h1 className="mt-2 font-serif text-3xl">順番に、戻す</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        上からでなくて構いません。いま気になるところから。
      </p>

      <Link
        href="/school"
        className="mt-5 block rounded-3xl border border-ink/8 bg-white/50 px-5 py-4"
      >
        <p className="text-[11px] tracking-[0.2em] text-gold">書きながら覚える</p>
        <p className="mt-1 font-serif text-xl">学年の地図</p>
        <p className="mt-1 text-sm text-ink-soft">
          小1から高校まで、常用漢字2136字。ことばと罠で出題します。
        </p>
      </Link>

      <ul className="mt-6 space-y-3">
        {LESSONS.map((lesson, i) => {
          const chars = lessonChars(lesson);
          return (
            <li key={lesson.id}>
              <Link
                href={`/lessons/${lesson.id}`}
                className="block rounded-3xl border border-ink/8 bg-white/40 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[0.18em] text-gold">
                      {String(i + 1).padStart(2, "0")} ・ {lesson.minutes}分
                      {done[lesson.id] ? " ・ ひととおり" : ""}
                    </p>
                    <p className="mt-1 font-serif text-xl">{lesson.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{lesson.subtitle}</p>
                  </div>
                  <div className="flex -space-x-1.5 pt-1">
                    {chars.slice(0, 3).map((c) => (
                      <span
                        key={c.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-paper-deep font-display text-lg ring-2 ring-paper"
                      >
                        {c.char}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
