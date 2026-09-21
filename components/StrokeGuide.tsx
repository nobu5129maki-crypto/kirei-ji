"use client";

import { useEffect, useState } from "react";
import { loadStrokes } from "@/lib/kanjivg";

export function StrokeGuide({
  char,
  playing,
}: {
  char: string;
  playing: boolean;
}) {
  const [paths, setPaths] = useState<string[] | null>(null);
  const [viewBox, setViewBox] = useState("0 0 109 109");
  const [tick, setTick] = useState(0);

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

  if (paths === null) {
    return (
      <div className="flex aspect-square items-center justify-center text-sm text-ink-soft">
        筆順を読み込み中…
      </div>
    );
  }

  if (paths.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center font-display text-[7.5rem] text-ink">
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
      <rect x="0" y="0" width="109" height="109" fill="#FBF7F0" />
      {paths.map((d, i) => (
        <path
          key={`${i}-${d.slice(0, 12)}`}
          d={d}
          pathLength={1}
          fill="none"
          stroke="#1C1916"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-draw"
          style={{ animationDelay: `${i * 0.42}s` }}
        />
      ))}
    </svg>
  );
}
