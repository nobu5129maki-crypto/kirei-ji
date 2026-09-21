"use client";

import { useEffect, useRef, useState } from "react";
import { loadStrokes } from "@/lib/kanjivg";

const STROKE_MS = 700;
const DELAY_MS = 420;
const LOAD_FALLBACK_MS = 5000;

export function StrokeGuide({
  char,
  playing,
  overlay = false,
  onComplete,
}: {
  char: string;
  playing: boolean;
  overlay?: boolean;
  onComplete?: () => void;
}) {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [viewBox, setViewBox] = useState("0 0 109 109");
  const [tick, setTick] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let alive = true;
    loadStrokes(char).then((data) => {
      if (!alive) return;
      if (!data) {
        setPaths([]);
        return;
      }
      setPaths(data.paths);
      setViewBox(data.viewBox);
      setTick((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [char, playing]);

  useEffect(() => {
    if (!playing) return;
    const fallback = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, LOAD_FALLBACK_MS + 12_000);
    return () => window.clearTimeout(fallback);
  }, [playing, char]);

  useEffect(() => {
    if (!playing || paths === null) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration =
      reduced || paths.length === 0
        ? 900
        : (paths.length - 1) * DELAY_MS + STROKE_MS + 400;
    const t = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, duration);
    return () => window.clearTimeout(t);
  }, [playing, paths, tick]);

  if (paths === null) {
    return (
      <div
        className={`flex aspect-square items-center justify-center text-sm ${
          overlay ? "bg-transparent text-vermillion" : "text-ink-soft"
        }`}
      >
        筆順を読み込み中…
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div
        className={`flex aspect-square items-center justify-center font-display text-[7.5rem] ${
          overlay ? "bg-transparent text-vermillion/70" : "text-ink"
        }`}
      >
        {char}
      </div>
    );
  }

  return (
    <svg
      key={`${char}-${tick}`}
      viewBox={viewBox}
      className="aspect-square w-full"
      aria-label={`${char}の筆順`}
    >
      {!overlay && (
        <rect x="0" y="0" width="109" height="109" fill="#FBF7F0" />
      )}
      {paths.map((d, i) => (
        <path
          key={`${i}-${d.slice(0, 12)}`}
          d={d}
          pathLength={1}
          fill="none"
          stroke={overlay ? "#C45C4A" : "#1C1916"}
          strokeWidth={overlay ? 3.8 : 3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-draw"
          style={{ animationDelay: `${i * 0.42}s` }}
        />
      ))}
    </svg>
  );
}
