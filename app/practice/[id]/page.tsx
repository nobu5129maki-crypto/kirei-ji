import { notFound } from "next/navigation";
import { PracticeView } from "@/components/PracticeView";
import { CHARACTERS, charSlug, getChar, normalizeCharId } from "@/lib/characters";
import { BOSSES } from "@/lib/game";

export const dynamicParams = true;

export function generateStaticParams() {
  return CHARACTERS.map((c) => ({ id: charSlug(c) }));
}

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; from?: string; boss?: string; grade?: string; pack?: string; at?: string }>;
}) {
  const { id: rawId } = await params;
  const { queue, from, boss: rawBoss, grade, pack, at } = await searchParams;
  const id = normalizeCharId(rawId);
  const char = getChar(id);
  if (!char) notFound();
  const ids = (
    queue
      ? queue.split(",").map((s) => getChar(normalizeCharId(s))?.id)
      : [char.id]
  ).filter((value): value is string => Boolean(value));
  if (!ids.includes(char.id)) ids.unshift(char.id);
  const atNum = Number(at);
  const atIndex = Number.isInteger(atNum) && atNum >= 0 && atNum < ids.length ? atNum : undefined;
  const bossId = BOSSES.some((b) => b.id === rawBoss) ? rawBoss : undefined;
  return (
    <PracticeView
      key={`${char.id}:${atIndex ?? "auto"}`}
      char={char}
      queue={ids}
      from={from}
      bossId={bossId}
      grade={grade}
      packId={pack}
      at={atIndex}
    />
  );
}
