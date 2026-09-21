import { notFound } from "next/navigation";
import { PracticeView } from "@/components/PracticeView";
import { CHARACTERS, getChar } from "@/lib/characters";

export function generateStaticParams() {
  return CHARACTERS.map((c) => ({ id: c.id }));
}

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ queue?: string; from?: string }>;
}) {
  const { id } = await params;
  const { queue, from } = await searchParams;
  const char = getChar(id);
  if (!char) notFound();
  const ids = queue
    ? queue
        .split(",")
        .map((s) => {
          try {
            return decodeURIComponent(s.trim());
          } catch {
            return s.trim();
          }
        })
        .filter(Boolean)
    : [id];
  return <PracticeView char={char} queue={ids} from={from} />;
}
