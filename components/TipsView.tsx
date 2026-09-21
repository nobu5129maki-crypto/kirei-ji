import Link from "next/link";
import { TIPS } from "@/lib/tips";

export function TipsView() {
  return (
    <div className="px-5 pt-[max(1.4rem,env(safe-area-inset-top))] pb-10">
      <p className="pt-4 text-[11px] tracking-[0.28em] text-gold">こころえ</p>
      <h1 className="mt-2 font-serif text-3xl">手を動かす前に</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        短く、実地の話だけ。読んで、すぐ一文字書いてください。
      </p>
      <Link
        href="/practice/kj-ei?from=tips"
        className="btn-ink mt-5 flex w-full items-center justify-center gap-3"
      >
        <span className="font-display text-2xl leading-none">永</span>
        <span>を書いてみる</span>
      </Link>
      <ul className="mt-6 space-y-3">
        {TIPS.map((tip) => (
          <li key={tip.id}>
            <Link
              href={`/tips/${tip.id}`}
              className="block rounded-3xl border border-ink/8 bg-white/40 px-4 py-4"
            >
              <p className="text-[11px] tracking-[0.16em] text-gold">{tip.kicker}</p>
              <p className="mt-1 font-serif text-xl">{tip.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
