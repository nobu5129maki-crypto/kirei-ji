import { CHARACTERS, practicePath } from "./characters";
import { LESSONS } from "./lessons";
import { loadState, todayStamp, weakestIds } from "./storage";

function daySeed(stamp: string): number {
  let h = 2166136261;
  for (let i = 0; i < stamp.length; i++) {
    h ^= stamp.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickDaily(count = 3): string[] {
  const state = loadState();
  const seed = daySeed(todayStamp());
  const weak = weakestIds(state, 2);
  const ids: string[] = [];

  for (const id of weak) {
    if (ids.length >= count) break;
    if (!ids.includes(id)) ids.push(id);
  }

  const fundamentals = ["kj-ei", "h-あ", "kj-juu", "h-を", "kj-kokoro"];
  for (const id of fundamentals) {
    if (ids.length >= count) break;
    if (!ids.includes(id)) ids.push(id);
  }

  const lesson = LESSONS[state.totalWrites % LESSONS.length];
  for (const id of lesson.characterIds) {
    if (ids.length >= count) break;
    if (!ids.includes(id)) ids.push(id);
  }

  let i = 0;
  while (ids.length < count && i < CHARACTERS.length) {
    const random = CHARACTERS[(seed + i * 17) % CHARACTERS.length];
    if (!ids.includes(random.id)) ids.push(random.id);
    i += 1;
  }

  return ids.slice(0, count);
}

export function queueHref(ids: string[], from?: string): string {
  const q = encodeURIComponent(ids.join(","));
  const extra = from ? `&from=${encodeURIComponent(from)}` : "";
  return `${practicePath(ids[0])}?queue=${q}${extra}`;
}
