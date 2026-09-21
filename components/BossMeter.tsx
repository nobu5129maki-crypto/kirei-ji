import { bossBarCaption } from "@/lib/game";
import type { BossState } from "@/lib/storage";

export function BossMeter({
  name,
  hint,
  hp,
}: {
  name: string;
  hint: string;
  hp: BossState;
}) {
  const cleared = Boolean(hp.defeatedAt) || hp.hp <= 0;
  const ratio = cleared ? 0 : Math.max(0, Math.min(1, hp.hp / hp.maxHp));
  const weak = cleared ? 100 : (1 - ratio) * 100;

  return (
    <div>
      <p className="text-[11px] tracking-[0.2em] text-vermillion">癖の強さ ・ {name}</p>
      <p className="mt-2 text-sm leading-relaxed">{hint}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="shrink-0 text-[10px] tracking-widest text-ink-soft">強い</span>
        <div
          className="relative mx-1 h-3 flex-1"
          role="meter"
          aria-label={`${name}の強さ`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(weak)}
          aria-valuetext={bossBarCaption(hp)}
        >
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-vermillion/55 to-ink/10" />
          <span
            aria-hidden
            className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_3px_rgba(244,239,230,0.95)] ${
              cleared ? "bg-gold" : "bg-ink"
            }`}
            style={{ left: `${weak}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] tracking-widest text-ink-soft">弱い</span>
      </div>
      <p className="mt-2.5 text-[12px] leading-relaxed text-ink-soft">{bossBarCaption(hp)}</p>
    </div>
  );
}
