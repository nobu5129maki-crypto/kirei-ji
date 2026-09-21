"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  bossHuntHref,
  bossProgress,
  charHuntHref,
  ensureTodayRound,
  pickWeeklyChar,
  roundHref,
  sceneHref,
  SCENES,
  weeklyHref,
  type BossDef,
} from "@/lib/game";
import { LESSONS } from "@/lib/lessons";
import {
  COVER_SCORE,
  loadRulesSeen,
  loadState,
  type AlbumEntry,
  type AppState,
  type TodayRound,
} from "@/lib/storage";
import { PlaySteps } from "./PlaySteps";
import { PwaInstall } from "./PwaInstall";
import { RulesIntro } from "./RulesIntro";
import { BossMeter } from "./BossMeter";
import type { PracticeChar } from "@/lib/characters";

function greeting(hour: number): string {
  if (hour < 11) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "今日も、整える";
}

export function HomeView() {
  const [state, setState] = useState<AppState | null>(null);
  const [hour, setHour] = useState(12);
  const [round, setRound] = useState<TodayRound | null>(null);
  const [char, setChar] = useState<PracticeChar | null>(null);
  const [boss, setBoss] = useState<BossDef | null>(null);
  const [weekly, setWeekly] = useState<PracticeChar | null>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const raw = loadState();
    const ensured = ensureTodayRound(raw);
    setState(loadState());
    setRound(ensured.round);
    setChar(ensured.char);
    setBoss(ensured.boss);
    setWeekly(pickWeeklyChar());
    setHour(new Date().getHours());
    setShowRules(!loadRulesSeen());
  }, []);

  if (!state || !char || !boss || !round) {
    return <div className="flex-1 px-5 pt-16 text-ink-soft">紙を広げています…</div>;
  }

  if (showRules) {
    return (
      <RulesIntro
        char={char}
        href={roundHref(char.id)}
        onStay={() => setShowRules(false)}
      />
    );
  }

  const adopted = round.adoptedEntryId
    ? state.album.find((a) => a.id === round.adoptedEntryId)
    : undefined;
  const hp = bossProgress(state, boss.id);
  const lesson = LESSONS[0];

  return (
    <div className="flex flex-1 flex-col px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-6">
      <header className="pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] tracking-[0.18em] text-gold">字をきれいに</p>
          <button
            type="button"
            className="text-[11px] tracking-wide text-ink-soft"
            onClick={() => setShowRules(true)}
          >
            遊び方
          </button>
        </div>
        <h1 className="mt-2 font-serif text-[1.85rem] leading-snug">
          {greeting(hour)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          今日の一枚は、儀式。癖は、気が済むまで何度でも削ってよい。
        </p>
      </header>

      <section className="mt-5">
        <PlaySteps variant="board" />
        <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
          通った字が見本帳に残ります。癖は、整い度80以上で残すたびに下がります。
        </p>
      </section>

      <div className="mt-5 rounded-3xl border border-ink/8 bg-white/35 px-5 py-4">
        <BossMeter
          name={boss.name}
          hint={boss.hint}
          hp={hp}
          huntHref={bossHuntHref(boss, char.id)}
        />
      </div>

      <section className="mt-6">
        <p className="text-[11px] tracking-[0.22em] text-gold">きょうのラウンド</p>
        {adopted ? (
          <AdoptedCard
            entry={adopted}
            char={char}
            href={charHuntHref(char, boss)}
          />
        ) : (
          <Link
            href={roundHref(char.id)}
            className="mt-3 block rounded-3xl border border-ink/8 bg-white/50 px-5 py-5"
          >
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-ink-soft">今日の相手 ・ {boss.name}</p>
                <p className="mt-1 font-serif text-4xl leading-none">{char.char}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  1本目はお手本の上。2本目が見ない本番です。
                </p>
              </div>
              <span className="font-display text-6xl text-ink/85">{char.char}</span>
            </div>
            <p className="btn-ink mt-5">紙を開く</p>
          </Link>
        )}
      </section>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="連続" value={state.streak ? `${state.streak}日` : "—"} />
        <Stat label="見本帳" value={`${state.album.length}`} />
        <Stat label="残した字" value={`${uniqueChars(state.album)}`} />
      </section>

      {!state.onboarded && (
        <Link
          href="/diagnose"
          className="mt-5 block rounded-3xl border border-ink/8 bg-white/40 px-5 py-4"
        >
          <p className="text-[11px] tracking-[0.2em] text-gold">はじめての方へ</p>
          <p className="mt-1 font-serif text-xl">いまの癖を、見てみる</p>
          <p className="mt-1 text-sm text-ink-soft">5字・約3分。相手の名前がわかります。</p>
        </Link>
      )}

      {weekly && (
        <section className="mt-6">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-xl">今週の一字</h2>
            <span className="text-[11px] text-ink-soft">7日同じ字</span>
          </div>
          <Link
            href={weeklyHref(weekly.id)}
            className="mt-3 flex items-center gap-3 rounded-3xl bg-paper-deep/80 px-4 py-4"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 font-display text-3xl">
              {weekly.char}
            </span>
            <div className="flex-1">
              <p className="text-sm">{weekly.reading}</p>
              <p className="text-[12px] text-ink-soft">いちばんいい一枚が、今週の表紙。</p>
            </div>
            <span className="text-ink-soft">→</span>
          </Link>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-serif text-xl">場面</h2>
        <p className="mt-1 text-[12px] text-ink-soft">明日使う字の、下見。</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {SCENES.map((scene) => (
            <li key={scene.id}>
              <Link
                href={sceneHref(scene)}
                className="block rounded-2xl border border-ink/8 bg-white/40 px-3 py-3"
              >
                <p className="text-[10px] tracking-widest text-gold">{scene.kicker}</p>
                <p className="mt-1 font-serif text-lg">{scene.title}</p>
                <p className="mt-1 text-[11px] text-ink-soft">{scene.minutes}分</p>
              </Link>
            </li>
          ))}
        </ul>
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

function uniqueChars(album: AlbumEntry[]): number {
  return new Set(album.map((a) => a.charId)).size;
}

function AdoptedCard({
  entry,
  char,
  href,
}: {
  entry: AlbumEntry;
  char: PracticeChar;
  href: string;
}) {
  return (
    <div className="mt-3 rounded-3xl border border-ink/8 bg-white/50 px-5 py-4">
      <p className="text-sm text-ink-soft">今日の一枚 ・ {char.char}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.image}
        alt={`${char.char}の、今日の一枚`}
        className="mt-3 w-full rounded-2xl"
      />
      <p className="mt-2 text-sm">
        整い度 {entry.score}
        {entry.score >= COVER_SCORE ? " ・ 表紙候補" : " ・ 残しました"}
      </p>
      <Link href={href} className="btn-ghost mt-4 w-full">
        この字で、癖を削る
      </Link>
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
