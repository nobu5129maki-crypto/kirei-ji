import { notFound } from "next/navigation";
import { PracticeView } from "@/components/PracticeView";
import { CHARACTERS, charSlug, getChar, normalizeCharId } from "@/lib/characters";

export const dynamicParams = true;

export function generateStaticParams() {
  return CHARACTERS.map((c) => ({ id: charSlug(c) }));
}

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; from?: string }>;
}) {
  const { id: rawId } = await params;
  const { queue, from } = await searchParams;
  const id = normalizeCharId(rawId);
  const char = getChar(id);
  if (!char) notFound();
  const ids = (
    queue
      ? queue.split(",").map((s) => getChar(normalizeCharId(s))?.id)
      : [char.id]
  ).filter((value): value is string => Boolean(value));
  if (!ids.includes(char.id)) ids.unshift(char.id);
  return <PracticeView char={char} queue={ids} from={from} />;
}
