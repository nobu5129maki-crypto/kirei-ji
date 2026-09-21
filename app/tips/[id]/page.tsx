import Link from "next/link";
import { notFound } from "next/navigation";
import { getChar } from "@/lib/characters";
import { getTip, TIPS } from "@/lib/tips";

export function generateStaticParams() {
  return TIPS.map((t) => ({ id: t.id }));
}

export default async function TipArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tip = getTip(id);
  if (!tip) notFound();
  const writeChar = getChar(tip.writeId);

  return (
    <article className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-12">
      <Link href="/tips" className="inline-block pt-4 text-sm text-ink-soft">
        こころえ
      </Link>
      <p className="mt-6 text-[11px] tracking-[0.2em] text-gold">{tip.kicker}</p>
      <h1 className="mt-2 font-serif text-3xl leading-snug">{tip.title}</h1>
      <div className="mt-6 space-y-5 text-[15px] leading-8">
        {tip.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      {writeChar && (
        <Link
          href={`/practice/${encodeURIComponent(writeChar.id)}?from=tips`}
          className="btn-ink mt-10 flex w-full items-center justify-center gap-3"
        >
          <span className="font-display text-2xl leading-none">{writeChar.char}</span>
          <span>を書いてみる</span>
        </Link>
      )}
    </article>
  );
}
