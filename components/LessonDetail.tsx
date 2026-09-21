"use client";

import Link from "next/link";
import { lessonChars, type Lesson } from "@/lib/lessons";
import { queueHref } from "@/lib/daily";

export function LessonDetail({ lesson }: { lesson: Lesson }) {
  const chars = lessonChars(lesson);
  const ids = chars.map((c) => c.id);

  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-10">
      <Link href="/lessons" className="inline-block pt-4 text-sm text-ink-soft">
        レッスン一覧
      </Link>
      <p className="mt-6 text-[11px] tracking-[0.22em] text-gold">
        {lesson.minutes}分 ・ {chars.length}字
      </p>
      <h1 className="mt-2 font-serif text-3xl">{lesson.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{lesson.intro}</p>

      <Link
        href={queueHref(ids, "lessons")}
        className="btn-ink mt-6 block text-center"
      >
        このレッスンを書く
      </Link>

      <ul className="mt-6 divide-y divide-ink/8 rounded-3xl border border-ink/8 bg-white/35">
        {chars.map((c) => (
          <li key={c.id}>
            <Link
              href={`/practice/${c.id}?from=lessons`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-deep font-display text-3xl">
                {c.char}
              </span>
              <span className="flex-1">
                <span className="block text-sm">{c.reading}</span>
                <span className="block text-[12px] text-ink-soft">{c.tips[0]}</span>
              </span>
              <span className="text-ink-soft">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
