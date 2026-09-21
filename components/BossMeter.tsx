import Link from "next/link";
import { bossMeterReadout } from "@/lib/game";
import type { BossState } from "@/lib/storage";

const TICKS = [100, 75, 50, 25, 0];

export function BossMeter({
  name,
  hint,
  hp,
  huntHref,
}: {
  name: string;
  hint: string;
  hp: BossState;
  huntHref?: string;
}) {
  const { percent, stage, caption } = bossMeterReadout(hp);
  const cleared = percent === 0;
  const weak = 100 - percent;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-vermillion">癖の強さ ・ {name}</p>
          <p className="mt-1 text-sm">{stage}</p>
        </div>
        <p className="font-serif text-[2rem] leading-none tabular-nums">
          {percent}
          <span className="font-serif text-base text-ink-soft">%</span>
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{hint}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="w-8 shrink-0 text-[10px] tracking-widest text-ink-soft">強い</span>
        <div className="min-w-0 flex-1">
          <div
            className="relative h-4"
            role="meter"
            aria-label={`${name}の強さ`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${stage}、${percent}パーセント`}
          >
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-vermillion/50 via-vermillion/20 to-ink/10" />
            {TICKS.map((tick) => (
              <span
                key={tick}
                aria-hidden
                className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-ink/25"
                style={{ left: `${100 - tick}%` }}
              />
            ))}
            <span
              aria-hidden
              className={`absolute top-1/2 z-[1] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_rgba(244,239,230,0.95)] ${
                cleared ? "bg-gold" : "bg-ink"
              }`}
              style={{ left: `${weak}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] tabular-nums text-ink-soft/80">
            {TICKS.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
        <span className="w-8 shrink-0 text-right text-[10px] tracking-widest text-ink-soft">
          弱い
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{caption}</p>
      {huntHref && !cleared && (
        <Link href={huntHref} className="btn-ink mt-4 w-full">
          この癖を、削る
        </Link>
      )}
    </div>
  );
}
