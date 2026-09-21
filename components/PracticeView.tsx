"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOCUS_LABEL, getChar, practicePath, type PracticeChar } from "@/lib/characters";
import { applyAdoptHit, isBossHunt, isTwoPhase, resolveHitBoss } from "@/lib/game";
import {
  captureSheet,
  recordScore,
  saveAlbumEntry,
} from "@/lib/storage";
import { PlaySteps, type PlayBeat } from "./PlaySteps";
import { scoreHandwriting, type ScoreBreakdown } from "@/lib/scoring";
import { StrokeGuide } from "./StrokeGuide";
import { WritingPad, type WritingPadHandle } from "./WritingPad";
import { ScoreSheet } from "./ScoreSheet";

export function PracticeView({
  char,
  queue,
  from,
  bossId,
}: {
  char: PracticeChar;
  queue: string[];
  from?: string;
  bossId?: string;
}) {
  const router = useRouter();
  const padRef = useRef<WritingPadHandle>(null);
  const twoPhase = isTwoPhase(from);
  const hunting = isBossHunt(from);
  const isScene = from === "scenes";
  const canKeep = hunting || isScene || queue.length <= 1;
  const [leg, setLeg] = useState<"warmup" | "honban">(twoPhase ? "warmup" : "honban");
  const [ghost, setGhost] = useState(true);
  const [guide, setGuide] = useState(false);
  const [guideNonce, setGuideNonce] = useState(0);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [inkUrl, setInkUrl] = useState("");
  const [error, setError] = useState("");
  const [cutNote, setCutNote] = useState("");

  const index = Math.max(0, queue.indexOf(char.id));
  const nextId = queue[index + 1];
  const nextChar = nextId ? getChar(nextId) : undefined;
  const backHref =
    from === "lessons"
      ? "/lessons"
      : from === "tips"
        ? "/tips"
        : from === "chars"
          ? "/chars"
          : from === "progress" || from === "album"
            ? "/album"
            : "/";

  const modelLabel = useMemo(
    () => (char.kind === "kanji" ? char.reading : char.kind === "katakana" ? "カタカナ" : "ひらがな"),
    [char],
  );

  const sheetPhase = twoPhase ? leg : canKeep ? "honban" : "free";

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
      setInkUrl(result.empty ? "" : captureSheet(canvas));
      setScore(result);
      if (!result.empty) recordScore(char.id, result.overall);
    } finally {
      setBusy(false);
    }
  };

  const goNext = () => {
    if (!nextId) {
      router.push(backHref);
      return;
    }
    const q = encodeURIComponent(queue.join(","));
    const extra = [
      from ? `from=${encodeURIComponent(from)}` : "",
      bossId ? `boss=${encodeURIComponent(bossId)}` : "",
    ]
      .filter(Boolean)
      .join("&");
    router.push(`${practicePath(nextId)}?queue=${q}${extra ? `&${extra}` : ""}`);
  };

  const retry = () => {
    setScore(null);
    setInkUrl("");
    padRef.current?.clear();
  };

  const goHonban = () => {
    setScore(null);
    setInkUrl("");
    setGhost(false);
    setLeg("honban");
    padRef.current?.clear();
  };

  const adopt = () => {
    if (!score || score.empty || !inkUrl) return;
    saveAlbumEntry(
      {
        charId: char.id,
        score: score.overall,
        image: inkUrl,
        focus: char.focus,
      },
      { keepAsToday: twoPhase },
    );
    const hit = applyAdoptHit(char, score.overall, bossId);
    if (hunting) {
      setScore(null);
      setInkUrl("");
      padRef.current?.clear();
      setCutNote(
        hit
          ? "癖が、少し弱くなりました。気が済むまで続けて。"
          : "残しました。整い度80以上なら、癖が下がります。",
      );
      return;
    }
    if (isScene && nextId) {
      goNext();
      return;
    }
    router.push(backHref);
  };

  const stepLabel = hunting
    ? "癖を削る"
    : twoPhase
      ? leg === "warmup"
        ? "1本目 ・ お手本あり"
        : "本番 ・ お手本なし"
      : queue.length > 1
        ? `${index + 1} / ${queue.length}`
        : "本番";

  const railCurrent: PlayBeat | undefined = twoPhase
    ? score && leg === "honban"
      ? "keep"
      : leg
    : undefined;

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(0.8rem,env(safe-area-inset-top))] pb-4">
      <header className="flex items-center justify-between">
        <Link href={backHref} className="text-sm text-ink-soft">
          もどる
        </Link>
        <p className="text-[11px] tracking-[0.2em] text-ink-soft">{stepLabel}</p>
        <span className="w-10" />
      </header>

      {twoPhase && (
        <div className="mt-4">
          <PlaySteps variant="rail" current={railCurrent} />
        </div>
      )}

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

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        {cutNote
          ? cutNote
          : hunting
            ? "お手本を見て整えてよい。80以上で残すと、癖のパーセントが下がります。"
            : twoPhase && leg === "honban"
              ? "見ないで書く。さっきの終わり方だけ残して。"
              : char.tips[0]}
      </p>

      {score ? (
        <div className="mt-5">
          <ScoreSheet
            char={char}
            score={score}
            phase={sheetPhase}
            onRetry={retry}
            onNext={twoPhase && leg === "warmup" ? goHonban : goNext}
            nextLabel={nextChar ? `つぎ（${nextChar.char}）` : "おわる"}
            onAdopt={sheetPhase === "honban" ? adopt : undefined}
            willCut={
              sheetPhase === "honban" && Boolean(resolveHitBoss(char, bossId))
            }
          />
        </div>
      ) : (
        <>
          <div className="relative mt-4 overflow-hidden rounded-[22px] border border-ink/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <WritingPad
              ref={padRef}
              ghost={char.char}
              showGhost={(twoPhase ? leg === "warmup" : ghost) && !guide}
            />
            {guide && (
              <div className="pointer-events-none absolute inset-0 z-10">
                <StrokeGuide
                  key={guideNonce}
                  char={char.char}
                  playing
                  overlay
                  onComplete={() => setGuide(false)}
                />
                <p className="absolute right-0 bottom-2 left-0 text-center text-[12px] text-vermillion">
                  そのままで書けます
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!twoPhase && (
              <Toggle pressed={ghost} onClick={() => setGhost((v) => !v)}>
                お手本を重ねる
              </Toggle>
            )}
            <Toggle
              pressed={guide}
              onClick={() => {
                setGuide(true);
                setGuideNonce((n) => n + 1);
              }}
            >
              筆順
            </Toggle>
          </div>

          {error && <p className="mt-2 text-sm text-vermillion">{error}</p>}

          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-ghost" onClick={() => padRef.current?.undo()}>
              もどす
            </button>
            <button type="button" className="btn-ghost" onClick={() => padRef.current?.clear()}>
              消す
            </button>
            <button type="button" className="btn-ink flex-1" onClick={onJudge} disabled={busy}>
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
        pressed ? "bg-ink text-paper" : "bg-paper-deep text-ink-soft"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
