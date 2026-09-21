"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHAR_BY_ID } from "@/lib/characters";
import { pickDaily, queueHref } from "@/lib/daily";
import { LESSONS } from "@/lib/lessons";
import { PwaInstall } from "./PwaInstall";

function greeting(hour: number): string {
  if (hour < 11) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "今日も、一文字だけ";
}

export function HomeView() {
  const [state, setState] = useState<AppState | null>(null);
  const [daily, setDaily] = useState<string[]>([]);
  const [hour, setHour] = useState(12);

  useEffect(() => {
    setState(loadState());
    setDaily(pickDaily(3));
    setHour(new Date().getHours());
  }, []);

  if (!state) {
    return <div className="flex-1 px-5 pt-16 text-ink-soft">紙を広げています…</div>;
  }

  const avg = averageScore(state);
  const dailyChars = daily.map((id) => CHAR_BY_ID[id]).filter(Boolean);
  const lesson = LESSONS[0];

  return (
    <div className="flex flex-1 flex-col px-5 pt-[max(1.4rem,env(safe-area-inset-top))]">
      <header className="pt-4">
        <p className="text-[11px] tracking-[0.18em] text-gold">字をきれいに</p>
        <h1 className="mt-2 font-serif text-[1.85rem] leading-snug">
          {greeting(hour)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          大人の字は、下手になったのではありません。速くなっただけです。
        </p>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="連続" value={state.streak ? `${state.streak}日` : "—"} />
        <Stat label="書いた字" value={state.totalWrites ? `${state.totalWrites}` : "0"} />
        <Stat label="平均" value={avg !== null ? `${avg}` : "—"} />
      </section>

      {!state.onboarded && (
        <Link
          href="/diagnose"
          className="mt-5 block rounded-3xl bg-ink px-5 py-4 text-paper"
        >
          <p className="text-[11px] tracking-[0.2em] text-gold">はじめての方へ</p>
          <p className="mt-1 font-serif text-xl">いまの字を、見てみましょう</p>
          <p className="mt-1 text-sm text-paper/70">5字・約3分。癖がわかります。</p>
        </Link>
      )}

      {state.diagnosis && (
        <div className="mt-5 rounded-3xl border border-ink/8 bg-white/35 px-5 py-4">
          <p className="text-[11px] tracking-[0.2em] text-vermillion">いまの癖</p>
          <p className="mt-2 text-sm leading-relaxed">{state.diagnosis.note}</p>
        </div>
      )}

      <section className="mt-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-xl">きょうの3分</h2>
          <span className="text-[11px] text-ink-soft">3文字</span>
        </div>
        <Link
          href={dailyChars.length ? queueHref(dailyChars.map((c) => c.id)) : "/lessons"}
          className="mt-3 flex items-center gap-3 rounded-3xl border border-ink/8 bg-white/50 px-4 py-4"
        >
          <div className="flex -space-x-2">
            {dailyChars.map((c) => (
              <span
                key={c.id}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper-deep font-display text-2xl ring-2 ring-paper"
              >
                {c.char}
              </span>
            ))}
          </div>
          <div className="flex-1">
            <p className="text-sm">弱っている字と、基本の字</p>
            <p className="text-[12px] text-ink-soft">なぞって、消して、見てみる</p>
          </div>
          <span className="text-ink-soft">→</span>
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-xl">レッスン</h2>
        <Link
          href={`/lessons/${lesson.id}`}
          className="mt-3 block rounded-3xl bg-paper-deep/80 px-5 py-4"
        >
          <p className="text-[11px] tracking-[0.18em] text-gold">
            {lesson.minutes}分 ・ {lesson.characterIds.length}字
          </p>
          <p className="mt-1 font-serif text-lg">{lesson.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{lesson.subtitle}</p>
        </Link>
        <div className="mt-3 flex gap-4">
          <Link href="/lessons" className="text-sm text-ink-soft">
            すべてのレッスン →
          </Link>
          <Link href="/chars" className="text-sm text-ink-soft">
            字を選ぶ →
          </Link>
        </div>
      </section>

      <PwaInstall />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/45 px-3 py-3 text-center">
      <p className="text-[10px] tracking-widest text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-xl">{value}</p>
    </div>
  );
}
