export function kanjiVgCode(char: string): string {
  const cp = char.codePointAt(0);
  if (cp === undefined) return "";
  return cp.toString(16).padStart(5, "0");
}

export function kanjiVgUrl(char: string): string {
  return `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${kanjiVgCode(char)}.svg`;
}

export type StrokeSvg = {
  paths: string[];
  viewBox: string;
};

export async function loadStrokes(char: string): Promise<StrokeSvg | null> {
  try {
    const res = await fetch(kanjiVgUrl(char));
    if (!res.ok) return null;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "image/svg+xml");
    const svg = doc.querySelector("svg");
    const viewBox = svg?.getAttribute("viewBox") ?? "0 0 109 109";
    const group = doc.querySelector('g[id*="StrokePaths"]');
    const nodes = group
      ? group.querySelectorAll("path")
      : doc.querySelectorAll("path");
    const unique = Array.from(nodes)
      .map((p) => p.getAttribute("d") ?? "")
      .filter((d) => d.startsWith("M"));
    if (!unique.length) return null;
    return { paths: unique, viewBox };
  } catch {
    return null;
  }
}
