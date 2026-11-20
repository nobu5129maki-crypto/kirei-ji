"use client";

import { useEffect, useState } from "react";
import { PracticeView } from "@/components/PracticeView";
import { getChar, normalizeCharId } from "@/lib/characters";
import { BOSSES } from "@/lib/game";

type Ready = {
  id: string;
  queue: string[];
  from?: string;
  bossId?: string;
  grade?: string;
  packId?: string;
  at?: number;
};

export function PracticePageClient() {
  const [ready, setReady] = useState<Ready | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = normalizeCharId(params.get("id") ?? "");
    const char = getChar(id);
    if (!char) {
      setMissing(true);
      return;
    }
    const queueRaw = params.get("queue");
    const ids = (
      queueRaw
        ? queueRaw.split(",").map((item) => getChar(normalizeCharId(item))?.id)
        : [char.id]
    ).filter((value): value is string => Boolean(value));
    if (!ids.includes(char.id)) ids.unshift(char.id);
    const atNum = Number(params.get("at"));
    const at = Number.isInteger(atNum) && atNum >= 0 && atNum < ids.length ? atNum : undefined;
    const rawBoss = params.get("boss") ?? undefined;
    const bossId = BOSSES.some((boss) => boss.id === rawBoss) ? rawBoss : undefined;
    setReady({
      id: char.id,
      queue: ids,
      from: params.get("from") ?? undefined,
      bossId,
      grade: params.get("grade") ?? undefined,
      packId: params.get("pack") ?? undefined,
      at,
    });
  }, []);

  if (missing) {
    return (
      <div className="px-5 pt-24 text-center">
        <p className="font-serif text-3xl">この字はありません</p>
        <p className="mt-3 text-sm text-ink-soft">紙を閉じて、はじめの頁へ。</p>
        <a href="./" className="btn-ink mt-8 inline-flex">
          きょうへ
        </a>
      </div>
    );
  }

  if (!ready) {
    return <div className="flex-1 px-5 pt-16 text-ink-soft">紙を広げています…</div>;
  }

  const char = getChar(ready.id);
  if (!char) return null;

  return (
    <PracticeView
      key={`${char.id}:${ready.at ?? "auto"}`}
      char={char}
      queue={ready.queue}
      from={ready.from}
      bossId={ready.bossId}
      grade={ready.grade}
      packId={ready.packId}
      at={ready.at}
    />
  );
}
