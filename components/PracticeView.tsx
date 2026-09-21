"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOCUS_LABEL, getChar, type PracticeChar } from "@/lib/characters";
import { recordScore } from "@/lib/storage";
import { scoreHandwriting, type ScoreBreakdown } from "@/lib/scoring";
import { StrokeGuide } from "./StrokeGuide";
import { WritingPad, type WritingPadHandle } from "./WritingPad";
import { ScoreSheet } from "./ScoreSheet";

export function PracticeView({
  char,
  queue,
  from,
}: {
  char: PracticeChar;
  queue: string[];
  from?: string;
}) {
  const router = useRouter();
  const padRef = useRef<WritingPadHandle>(null);
  const [ghost, setGhost] = useState(true);
  const [guide, setGuide] = useState(false);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState("");

  const index = Math.max(0, queue.indexOf(char.id));
  const nextId = queue[index + 1];
  const nextChar = nextId ? getChar(nextId) : undefined;
  const backHref = from === "lessons" ? "/lessons" : from === "diagnose" ? "/" : "/";

  const modelLabel = useMemo(
    () => (char.kind === "kanji" ? char.reading : char.kind === "katakana" ? "カタカナ" : "ひらがな"),
    [char],
  );

  const onJudge = async () => {
    const canvas = padRef.current?.getInkCanvas();
    if (!canvas || padRef.current?.isEmpty()) {
      setError("マスの中に、書いてから見てみましょう。");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const result = await scoreHandwriting(canvas, char);
      setScore(result);
      if (!result.empty) recordScore(char.id, result.overall);
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!nextId) {
      router.push(from === "lessons" ? "/lessons" : "/progress");
      return;
    }
    const q = encodeURIComponent(queue.join(","));
    const extra = from ? `&from=${encodeURIComponent(from)}` : "";
    router.push(`/practice/${encodeURIComponent(nextId)}?queue=${q}${extra}`);
  };

  const retry = () => {
    setScore(null);
    padRef.current?.clear();
  };

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(0.8rem,env(safe-area-inset-top))] pb-4">
      <header className="flex items-center justify-between">
        <Link href={backHref} className="text-sm text-ink-soft">
          もどる
        </Link>
        <p className="text-[11px] tracking-[0.2em] text-ink-soft">
          {queue.length > 1 ? `${index + 1} / ${queue.length}` : "練習"}
        </p>
        <span className="w-10" />
      </header>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-gold">{modelLabel}</p>
          <h1 className="font-serif text-3xl leading-none">{char.char}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {char.reading} ・ {char.strokeCount}画 ・ {FOCUS_LABEL[char.focus]}
          </p>
        </div>
        <div className="font-display text-5xl text-ink/90">{char.char}</div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{char.tips[0]}</p>

      {score ? (
        <div className="mt-5">
          <ScoreSheet
            char={char}
            score={score}
            onRetry={retry}
            onNext={goNext}
            nextLabel={nextChar ? `つぎ（${nextChar.char}）` : "おわる"}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-hidden rounded-[22px] border border-ink/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            {guide ? (
              <StrokeGuide char={char.char} playing />
            ) : (
              <WritingPad ref={padRef} ghost={char.char} showGhost={ghost} />
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Toggle pressed={ghost} onClick={() => setGhost((v) => !v)} disabled={guide}>
              お手本を重ねる
            </Toggle>
            <Toggle
              pressed={guide}
              onClick={() => {
                setGuide((v) => !v);
              }}
            >
              筆順
            </Toggle>
          </div>

          {error && <p className="mt-2 text-sm text-vermillion">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => padRef.current?.undo()}
              disabled={guide}
            >
              もどす
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => padRef.current?.clear()}
              disabled={guide}
            >
              消す
            </button>
            <button
              type="button"
              className="btn-ink flex-1"
              onClick={onJudge}
              disabled={busy || guide}
            >
              {busy ? "見ています…" : "見てみる"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Toggle({
  pressed,
  onClick,
  children,
  disabled,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-[12px] tracking-wide ${
        pressed
          ? "bg-ink text-paper"
          : "bg-paper-deep text-ink-soft"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
