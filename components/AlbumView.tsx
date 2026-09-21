"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHAR_BY_ID, getChar, practicePath } from "@/lib/characters";
import { BOSSES, bossProgress } from "@/lib/game";
import {
  COVER_SCORE,
  loadState,
  todayStamp,
  type AlbumEntry,
  type AppState,
} from "@/lib/storage";

export function AlbumView() {
  const [state, setState] = useState<AppState | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) return <div className="px-5 pt-16 text-ink-soft">見本帳を開いています…</div>;

  const days = last14();
  const practiced = new Set(state.practiceDays);
  const grouped = groupByChar(state.album);
  const cover = state.album.find((a) => a.score >= COVER_SCORE);

  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-8">
      <p className="pt-4 text-[11px] tracking-[0.28em] text-gold">見本帳</p>
      <h1 className="mt-2 font-serif text-3xl">残した字</h1>
      <p className="mt-2 text-sm text-ink-soft">点数より、残した一枚です。</p>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <Box label="連続" value={state.streak ? `${state.streak}日` : "0日"} />
        <Box label="枚数" value={`${state.album.length}`} />
        <Box label="字の種類" value={`${grouped.length}`} />
      </section>

      {cover && (
        <section className="mt-8">
          <h2 className="font-serif text-xl">表紙候補</h2>
          <button
            type="button"
            onClick={() => setOpenId(cover.charId)}
            className="mt-3 w-full overflow-hidden rounded-3xl border border-ink/8 bg-white/45 text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover.image} alt="表紙候補" className="w-full" />
            <p className="px-4 py-3 text-sm">
              {CHAR_BY_ID[cover.charId]?.char ?? ""} ・ {cover.score}
            </p>
          </button>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-serif text-xl">作品</h2>
        {state.album.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            まだ一枚もありません。きょうの本番で通った字が、ここに残ります。
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {state.album.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(entry.charId)}
                  className="w-full overflow-hidden rounded-2xl bg-white/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.image} alt="" className="aspect-square w-full object-cover" />
                  <p className="py-1 text-center font-display text-lg">
                    {CHAR_BY_ID[entry.charId]?.char ?? ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {openId && (
        <CompareSheet
          charId={openId}
          entries={state.album.filter((a) => a.charId === openId)}
          onClose={() => setOpenId(null)}
        />
      )}

      <section className="mt-10">
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

      <section className="mt-8">
        <h2 className="font-serif text-xl">癖</h2>
        <ul className="mt-3 space-y-2">
          {BOSSES.filter((b) => state.bosses[b.id] || b.matches(state.diagnosis)).map((boss) => {
            const hp = bossProgress(state, boss.id);
            return (
              <li key={boss.id} className="rounded-2xl bg-white/40 px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-lg">{boss.name}</p>
                  <p className="text-[12px] text-ink-soft">
                    {hp.defeatedAt ? "通した" : `残り ${hp.hp}`}
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-vermillion/80"
                    style={{ width: `${(hp.hp / hp.maxHp) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-[12px] text-ink-soft">{boss.hint}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function CompareSheet({
  charId,
  entries,
  onClose,
}: {
  charId: string;
  entries: AlbumEntry[];
  onClose: () => void;
}) {
  const char = getChar(charId);
  const ordered = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    [entries],
  );
  const oldest = ordered[0];
  const newest = ordered[ordered.length - 1];
  const [mix, setMix] = useState(100);

  if (!char || !newest) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="max-h-[88dvh] w-full max-w-[400px] overflow-auto rounded-3xl bg-paper px-4 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-gold">{char.reading}</p>
            <h2 className="font-serif text-3xl">{char.char}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-ink-soft">
            とじる
          </button>
        </div>

        {ordered.length >= 2 ? (
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={oldest.image} alt="以前の字" className="w-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={newest.image}
              alt="いまの字"
              className="absolute inset-0 w-full"
              style={{ opacity: mix / 100 }}
            />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={newest.image} alt="残した字" className="mt-4 w-full rounded-2xl" />
        )}

        {ordered.length >= 2 && (
          <label className="mt-3 block text-[12px] text-ink-soft">
            以前 → いま
            <input
              type="range"
              min={0}
              max={100}
              value={mix}
              onChange={(e) => setMix(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
        )}

        <p className="mt-3 text-sm">
          整い度 {newest.score}
          {newest.score >= COVER_SCORE ? " ・ 仕事で使ってよい" : ""}
        </p>
        <p className="mt-1 text-[12px] text-ink-soft">
          {ordered.length >= 2
            ? `${ordered.length}枚残しています。以前といまを重ねて見られます。`
            : "きょう残した一枚です。"}
        </p>
        <Link
          href={`${practicePath(char.id)}?from=album`}
          className="btn-ink mt-4 w-full"
        >
          この字をもう一度
        </Link>
      </div>
    </div>
  );
}

function groupByChar(album: AlbumEntry[]): string[] {
  return [...new Set(album.map((a) => a.charId))];
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
