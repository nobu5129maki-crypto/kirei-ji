"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHAR_BY_ID, practicePath } from "@/lib/characters";
import { queueHref } from "@/lib/daily";
import {
  averageScore,
  loadState,
  todayStamp,
  type AppState,
} from "@/lib/storage";

export function ProgressView() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) return <div className="px-5 pt-16 text-ink-soft">記録を開いています…</div>;

  const avg = averageScore(state);
  const ranked = Object.entries(state.records)
    .map(([id, rec]) => ({ id, ...rec, char: CHAR_BY_ID[id] }))
    .filter((r) => r.char)
    .sort((a, b) => a.last - b.last);

  const weak = ranked.slice(0, 4);
  const strong = [...ranked].sort((a, b) => b.best - a.best).slice(0, 4);

  const days = last14();
  const practiced = new Set(state.practiceDays);

  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-8">
      <p className="pt-4 text-[11px] tracking-[0.28em] text-gold">きろく</p>
      <h1 className="mt-2 font-serif text-3xl">整ってきた跡</h1>
      <p className="mt-2 text-sm text-ink-soft">点数より、続けた日数です。</p>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <Box label="連続" value={state.streak ? `${state.streak}日` : "0日"} />
        <Box label="書いた回数" value={`${state.totalWrites}`} />
        <Box label="平均の整い度" value={avg !== null ? `${avg}` : "—"} />
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl">この14日</h2>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <div key={d} className="flex flex-col items-center gap-1">
              <span
                className={`h-8 w-8 rounded-full ${
                  practiced.has(d)
                    ? "bg-ink"
                    : d === todayStamp()
                      ? "border border-ink/30 bg-transparent"
                      : "bg-paper-deep"
                }`}
              />
              <span className="text-[9px] text-ink-soft">{Number(d.slice(8))}</span>
            </div>
          ))}
        </div>
      </section>

      {weak.length > 0 && (
        <section className="mt-8">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-xl">いま弱い字</h2>
            <Link
              href={queueHref(weak.map((w) => w.id), "progress")}
              className="text-sm text-ink-soft"
            >
              練習する →
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {weak.map((w) => (
              <li key={w.id}>
                <Link
                  href={`${practicePath(w.id)}?from=progress`}
                  className="flex items-center gap-3 rounded-2xl bg-white/40 px-3 py-2"
                >
                  <span className="font-display text-3xl">{w.char.char}</span>
                  <span className="flex-1 text-sm text-ink-soft">
                    {w.char.reading} ・ {w.count}回
                  </span>
                  <span className="font-serif text-xl">{w.last}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {strong.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-xl">整ってきた字</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {strong.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-2xl bg-paper-deep px-3 py-2"
              >
                <span className="font-display text-2xl">{s.char.char}</span>
                <span className="font-serif text-sm">{s.best}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.totalWrites === 0 && (
        <p className="mt-10 text-sm leading-relaxed text-ink-soft">
          まだ記録はありません。きょうの3分から、跡が残ります。
        </p>
      )}
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/45 px-3 py-3 text-center">
      <p className="text-[10px] tracking-widest text-ink-soft">{label}</p>
      <p className="mt-1 font-serif text-lg">{value}</p>
    </div>
  );
}

function last14(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 13; i >= 0; i--) {
    const t = new Date(d);
    t.setDate(d.getDate() - i);
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, "0");
    const day = String(t.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}
