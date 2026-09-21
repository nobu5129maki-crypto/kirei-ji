export type PlayBeat = "warmup" | "honban" | "keep";

export const PLAY_BEATS: { id: PlayBeat; title: string; line: string }[] = [
  { id: "warmup", title: "お手本", line: "重ねて書く。終わり方だけ覚える。" },
  { id: "honban", title: "本番", line: "見ないで書く。さっきの手を残す。" },
  { id: "keep", title: "残す", line: "通った字が、見本帳になる。" },
];

export function PlaySteps({
  current,
  variant = "board",
}: {
  current?: PlayBeat;
  variant?: "story" | "board" | "rail";
}) {
  if (variant === "story") {
    return (
      <ol className="space-y-4">
        {PLAY_BEATS.map((beat, i) => (
          <li key={beat.id} className="flex gap-4">
            <span className="font-serif text-2xl leading-none text-gold">{i + 1}</span>
            <div>
              <p className="font-serif text-xl leading-none">{beat.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{beat.line}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol
      className={`grid grid-cols-3 ${
        variant === "rail" ? "gap-1" : "gap-0 overflow-hidden rounded-2xl bg-white/45"
      }`}
    >
      {PLAY_BEATS.map((beat, i) => {
        const on = current ? current === beat.id : true;
        const done =
          current && PLAY_BEATS.findIndex((b) => b.id === current) > i;
        return (
          <li
            key={beat.id}
            aria-current={current && on ? "step" : undefined}
            className={`px-2 py-2.5 text-center ${
              variant === "rail" ? "rounded-xl" : ""
            } ${
              current && on
                ? "bg-ink text-paper"
                : current && done
                  ? "text-ink"
                  : current
                    ? "text-ink-soft/55"
                    : "text-ink"
            }`}
          >
            <p
              className={`text-[10px] tracking-widest ${
                current && on ? "opacity-70" : "text-gold"
              }`}
            >
              {i + 1}
            </p>
            <p className={`mt-0.5 ${variant === "rail" ? "text-[12px]" : "font-serif text-[15px]"}`}>
              {beat.title}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
