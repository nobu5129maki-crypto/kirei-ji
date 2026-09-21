"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIAGNOSE_IDS, getChar } from "@/lib/characters";
import { markOnboarded, recordScore, type Diagnosis } from "@/lib/storage";
import { scoreHandwriting, summarizeDiagnosis } from "@/lib/scoring";
import { WritingPad, type WritingPadHandle } from "./WritingPad";

const ids = [...DIAGNOSE_IDS];

export function DiagnoseView() {
  const router = useRouter();
  const padRef = useRef<WritingPadHandle>(null);
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState<
    { size: number; tilt: number; center: number }[]
  >([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const char = getChar(ids[Math.min(step, ids.length - 1)])!;
  const last = step >= ids.length;

  const onNext = async () => {
    if (last) return;
    const canvas = padRef.current?.getInkCanvas();
    if (!canvas || padRef.current?.isEmpty()) {
      setError("書いてから、つぎへ。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await scoreHandwriting(canvas, char);
      if (!result.empty) recordScore(char.id, result.overall);
      const nextSamples = [
        ...samples,
        { size: result.size, tilt: result.tilt, center: result.center },
      ];
      setSamples(nextSamples);
      padRef.current?.clear();
      if (step + 1 >= ids.length) {
        const nextDiagnosis = summarizeDiagnosis(nextSamples);
        markOnboarded(nextDiagnosis);
        setDiagnosis(nextDiagnosis);
        setStep(ids.length);
      } else {
        setStep((s) => s + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  if (last) {
    return (
      <div className="flex min-h-dvh flex-col px-5 pt-16 pb-8">
        <p className="text-[11px] tracking-[0.25em] text-gold">診断</p>
        <h1 className="mt-2 font-serif text-3xl">いまの癖が見えました</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {diagnosis?.note}
        </p>
        <p className="mt-6 text-sm leading-relaxed">
          これから毎日、一文字。癖に名前をつけて、通った字だけ見本帳に残します。
        </p>
        <button type="button" className="btn-ink mt-8" onClick={() => router.push("/")}>
          紙を開く
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-[max(0.8rem,env(safe-area-inset-top))] pb-5">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink-soft">
          とじる
        </Link>
        <p className="text-[11px] tracking-[0.2em] text-ink-soft">
          {step + 1} / {ids.length}
        </p>
        <span className="w-10" />
      </header>

      <h1 className="mt-4 font-serif text-2xl">いまの字を書いてください</h1>
      <p className="mt-2 text-sm text-ink-soft">
        お手本を薄く重ねています。いつもの速さで大丈夫です。
      </p>

      <div className="mt-4 flex items-end justify-between">
        <p className="font-serif text-4xl">{char.char}</p>
        <p className="text-sm text-ink-soft">{char.reading}</p>
      </div>

      <div className="mt-3 overflow-hidden rounded-[22px] border border-ink/10">
        <WritingPad ref={padRef} ghost={char.char} showGhost />
      </div>

      {error && <p className="mt-2 text-sm text-vermillion">{error}</p>}

      <button
        type="button"
        className="btn-ink mt-4"
        onClick={onNext}
        disabled={busy}
      >
        {busy ? "見ています…" : step === ids.length - 1 ? "結果を見る" : "つぎの字へ"}
      </button>
    </div>
  );
}
