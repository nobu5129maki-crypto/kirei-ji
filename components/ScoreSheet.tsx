"use client";

import type { ScoreBreakdown } from "@/lib/scoring";
import { FOCUS_LABEL, type PracticeChar } from "@/lib/characters";
import { relatedLivingBoss } from "@/lib/game";
import { ADOPT_SCORE, BOSS_HIT_SCORE, COVER_SCORE } from "@/lib/storage";

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
  phase = "free",
  onAdopt,
}: {
  char: PracticeChar;
  score: ScoreBreakdown;
  onRetry: () => void;
  onNext?: () => void;
  nextLabel?: string;
  phase?: "free" | "warmup" | "honban";
  onAdopt?: () => void;
}) {
  const passed = !score.empty && score.overall >= ADOPT_SCORE;
  const cover = !score.empty && score.overall >= COVER_SCORE;
  const cutsHabit =
    phase === "honban" &&
    !score.empty &&
    score.overall >= BOSS_HIT_SCORE &&
    Boolean(relatedLivingBoss(char));
  const verdict = score.empty
    ? "書けたら、見てみるを押してください。"
    : phase === "warmup"
      ? "終わり方だけ残して、本番へ。"
      : cutsHabit
        ? "残すと、癖のパーセントが下がります。何度でも削ってよい。"
        : cover
          ? "見本帳の表紙候補です。残しましょう。"
          : passed
            ? `通った。癖を削るなら、${BOSS_HIT_SCORE}以上でもう一枚。`
            : `もう一枚。${BOSS_HIT_SCORE}以上で残すと、癖が下がります。`;

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-[11px] tracking-[0.25em] text-gold">
          {phase === "warmup" ? "1本目" : phase === "honban" ? "本番" : "整い度"}
        </p>
        <p className="mt-1 font-serif text-5xl font-medium text-ink">
          {score.empty ? "—" : score.overall}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {phase === "free" ? score.praise : verdict}
        </p>
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
        {score.correctionUrl && !score.empty && (
          <figure className="mt-3 overflow-hidden rounded-2xl border border-vermillion/35 bg-[#FBF7F0]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={score.correctionUrl}
              alt={`${char.char}の、赤い添削`}
              className="w-full"
            />
            <figcaption className="px-3 py-2 text-[12px] leading-relaxed text-ink">
              書いた字の上に、赤い直しかたを重ねています。
              {char.focus === "harai"
                ? " はらいは、赤い先まで一気に。"
                : char.focus === "hane"
                  ? " はねは、赤い先だけ小さく。"
                  : char.focus === "tome"
                    ? " とめは、赤い位置で止めてから離す。"
                    : " 赤い線が、戻したい形です。"}
            </figcaption>
          </figure>
        )}
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
          {score.comments.map((c) => (
            <li key={c}>・{c}</li>
          ))}
        </ul>
      </div>

      {phase === "warmup" && onNext && (
        <button type="button" onClick={onNext} className="btn-ink w-full">
          本番へ
        </button>
      )}

      {phase === "honban" && (
        <div className="flex gap-2">
          <button type="button" onClick={onRetry} className="btn-ghost flex-1">
            もう一枚
          </button>
          {onAdopt && !score.empty && (
            <button type="button" onClick={onAdopt} className="btn-ink flex-1">
              {passed ? "残す" : "それでも残す"}
            </button>
          )}
        </div>
      )}

      {phase === "free" && (
        <div className="flex gap-2">
          <button type="button" onClick={onRetry} className="btn-ghost flex-1">
            もう一枚
          </button>
          {onNext && (
            <button type="button" onClick={onNext} className="btn-ink flex-1">
              {nextLabel ?? "つぎへ"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
