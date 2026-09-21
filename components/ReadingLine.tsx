import type { PracticeChar } from "@/lib/characters";
import { readingsOf } from "@/lib/school-rows";

export function kanjiReadings(char: PracticeChar): { on: string[]; kun: string[] } {
  return readingsOf(char.char);
}

export function formatReadings(char: PracticeChar): string {
  if (char.kind !== "kanji") return char.reading;
  const { on, kun } = kanjiReadings(char);
  const bits: string[] = [];
  if (on.length) bits.push(`音 ${on.join("・")}`);
  if (kun.length) bits.push(`訓 ${kun.join("・")}`);
  return bits.join("　") || char.reading;
}

export function ReadingLine({
  char,
  className = "text-sm text-ink-soft",
  large = false,
}: {
  char: PracticeChar;
  className?: string;
  large?: boolean;
}) {
  if (char.kind !== "kanji") {
    return <p className={className}>{char.reading}</p>;
  }
  const { on, kun } = kanjiReadings(char);
  if (!on.length && !kun.length) {
    return <p className={className}>{char.reading}</p>;
  }
  return (
    <p className={className}>
      {on.length > 0 && (
        <span>
          <span className={large ? "text-[10px] tracking-widest text-gold" : "text-gold"}>音</span>{" "}
          {on.join("・")}
        </span>
      )}
      {on.length > 0 && kun.length > 0 && (
        <span className="mx-1.5 text-ink-soft/40" aria-hidden>
          /
        </span>
      )}
      {kun.length > 0 && (
        <span>
          <span className={large ? "text-[10px] tracking-widest text-gold" : "text-gold"}>訓</span>{" "}
          {kun.join("・")}
        </span>
      )}
    </p>
  );
}
