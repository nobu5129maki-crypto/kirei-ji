"use client";

import type { ScoreBreakdown } from "@/lib/scoring";
import { FOCUS_LABEL, type PracticeChar } from "@/lib/characters";

const axes: { key: keyof Pick<ScoreBreakdown, "size" | "tilt" | "center" | "shape">; label: string }[] = [
  { key: "size", label: "大きさ" },
  { key: "tilt", label: "傾き" },
  { key: "center", label: "中心" },
  { key: "shape", label: "形" },
];

export function ScoreSheet({
  char,
  score,
  onRetry,
  onNext,
  nextLabel,
}: {
  char: PracticeChar;
  score: ScoreBreakdown;
  onRetry: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.25em] text-gold">整い度</p>
        <p className="mt-1 font-serif text-6xl font-medium text-ink">
          {score.empty ? "—" : score.overall}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{score.praise}</p>
      </div>

      {!score.empty && (
        <ul className="grid grid-cols-2 gap-2">
          {axes.map((axis) => (
            <li
              key={axis.key}
              className="rounded-2xl bg-paper-deep/60 px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-ink-soft">{axis.label}</span>
                <span className="font-serif text-lg">{score[axis.key]}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-ink/70"
                  style={{ width: `${score[axis.key]}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-ink/8 bg-white/40 px-4 py-3">
        <p className="text-[11px] tracking-widest text-vermillion">
          きょうの一点 ・ {FOCUS_LABEL[char.focus]}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
          {score.comments.map((c) => (
            <li key={c}>・{c}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onRetry} className="btn-ghost flex-1">
          もう一度
        </button>
        {onNext && (
          <button type="button" onClick={onNext} className="btn-ink flex-1">
            {nextLabel ?? "つぎへ"}
          </button>
        )}
      </div>
    </div>
  );
}
