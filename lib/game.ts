import {
  CHARACTERS,
  CHAR_BY_ID,
  FOCUS_LABEL,
  getChar,
  practicePath,
  type PracticeChar,
  type StrokeFocus,
} from "./characters";
import {
  hitBoss,
  loadState,
  setBosses,
  setTodayRound,
  todayStamp,
  weakestIds,
  BOSS_HIT_SCORE,
  COVER_SCORE,
  type AppState,
  type BossState,
  type Diagnosis,
  type TodayRound,
} from "./storage";

export type BossId = "small" | "large" | "left" | "tilt" | "harai";

export type BossDef = {
  id: BossId;
  name: string;
  hint: string;
  focuses: StrokeFocus[];
  characterIds: string[];
  matches: (d?: Diagnosis) => boolean;
};

export const BOSSES: BossDef[] = [
  {
    id: "small",
    name: "小さくなる",
    hint: "余白を恐れず、マスの七〜八割へ。",
    focuses: ["size", "center"],
    characterIds: ["h-あ", "kj-ei", "kj-juu"],
    matches: (d) => d?.size === "small",
  },
  {
    id: "large",
    name: "枠いっぱい",
    hint: "周囲に一画分の余白を残す。",
    focuses: ["size", "balance"],
    characterIds: ["kj-kuni", "kj-sama", "h-あ"],
    matches: (d) => d?.size === "large",
  },
  {
    id: "left",
    name: "左偏り",
    hint: "十字の交点に、字の心臓を置く。",
    focuses: ["center"],
    characterIds: ["h-を", "kj-juu", "kj-kokoro"],
    matches: (d) => d?.center === "left",
  },
  {
    id: "tilt",
    name: "傾き",
    hint: "最初の一画を、水平か垂直に。",
    focuses: ["line", "tome"],
    characterIds: ["kj-ichi", "kj-tadashi", "k-ア"],
    matches: (d) => Boolean(d && d.tilt !== "ok"),
  },
  {
    id: "harai",
    name: "はらい不足",
    hint: "最後まで一気に。途中で細く切らない。",
    focuses: ["harai", "hane"],
    characterIds: ["h-い", "kj-ki", "kj-ei"],
    matches: () => true,
  },
];

export type Scene = {
  id: string;
  title: string;
  kicker: string;
  minutes: number;
  characterIds: string[];
};

export const SCENES: Scene[] = [
  {
    id: "date",
    title: "日付",
    kicker: "毎日書く字",
    minutes: 3,
    characterIds: ["kj-nen", "kj-tsuki", "kj-hi"],
  },
  {
    id: "sign",
    title: "署名",
    kicker: "書類の顔",
    minutes: 4,
    characterIds: ["kj-watashi", "kj-namae", "kj-sama"],
  },
  {
    id: "memo",
    title: "メモ",
    kicker: "会議のあと",
    minutes: 3,
    characterIds: ["h-あ", "h-を", "kj-kokoro"],
  },
  {
    id: "close",
    title: "締めの一字",
    kicker: "心・和",
    minutes: 3,
    characterIds: ["kj-kokoro", "kj-wa", "kj-omou"],
  },
];

const FUNDAMENTALS = ["kj-ei", "h-あ", "kj-juu", "h-を", "kj-kokoro"];

function daySeed(stamp: string): number {
  let h = 2166136261;
  for (let i = 0; i < stamp.length; i++) {
    h ^= stamp.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function isoWeek(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function pickWeeklyChar(): PracticeChar {
  const seed = daySeed(isoWeek());
  return CHARACTERS[seed % CHARACTERS.length];
}

export function activeBoss(state: AppState): BossDef {
  const living = BOSSES.filter((b) => !state.bosses[b.id]?.defeatedAt);
  const matched = living.find((b) => b.id !== "harai" && b.matches(state.diagnosis));
  return matched ?? living.find((b) => b.id === "harai") ?? BOSSES[BOSSES.length - 1];
}

export function ensureBosses(state: AppState): AppState {
  const next = { ...state.bosses };
  let changed = false;
  for (const boss of BOSSES) {
    if (next[boss.id]) continue;
    if (boss.id === "harai" || boss.matches(state.diagnosis)) {
      next[boss.id] = { hp: 100, maxHp: 100, defeatedAt: null };
      changed = true;
    }
  }
  if (!changed) return state;
  return setBosses(next);
}

export function bossProgress(state: AppState, id: BossId): BossState {
  return state.bosses[id] ?? { hp: 100, maxHp: 100, defeatedAt: null };
}

export function bossMeterReadout(hp: BossState): {
  percent: number;
  stage: string;
  caption: string;
} {
  if (hp.defeatedAt || hp.hp <= 0) {
    return {
      percent: 0,
      stage: "おさまった",
      caption: "きょう、この癖は一回おさまりました。",
    };
  }
  const percent = Math.round((hp.hp / Math.max(1, hp.maxHp)) * 100);
  const left = Math.max(1, Math.ceil(hp.hp / 25));
  const stage =
    percent >= 85
      ? "かなり強い"
      : percent >= 65
        ? "やや強い"
        : percent >= 45
          ? "半分くらい"
          : percent >= 25
            ? "弱まってきた"
            : "もう少し";
  const caption =
    percent >= 85
      ? "よく書けて残すと下がります。今日の一枚のあとでも、何度でも削れます。"
      : left <= 1
        ? "もう一枚、整えばおさまります。"
        : `整った本番が、あと${left}回。気が済むまで削ってよい。`;
  return { percent, stage, caption };
}

export function pickRoundChar(state: AppState, boss: BossDef): PracticeChar {
  const pool = boss.characterIds.filter((id) => CHAR_BY_ID[id]);
  const weak = weakestIds(state, 6);
  const fromBoss = pool.find((id) => weak.includes(id));
  if (fromBoss) return CHAR_BY_ID[fromBoss];
  const seed = daySeed(todayStamp());
  const fromPool = pool[seed % Math.max(1, pool.length)];
  return CHAR_BY_ID[fromPool] ?? CHAR_BY_ID[FUNDAMENTALS[seed % FUNDAMENTALS.length]] ?? CHARACTERS[0];
}

function bossById(id?: string): BossDef | undefined {
  return BOSSES.find((b) => b.id === id);
}

function isRelated(boss: BossDef, char: PracticeChar): boolean {
  return boss.focuses.includes(char.focus) || boss.characterIds.includes(char.id);
}

function isLiving(state: AppState, boss: BossDef): boolean {
  const cur = state.bosses[boss.id];
  if (cur) return !cur.defeatedAt;
  return boss.id === "harai" || boss.matches(state.diagnosis);
}

function ensureBossRecord(id: string): AppState {
  const state = loadState();
  if (state.bosses[id]) return state;
  return setBosses({
    ...state.bosses,
    [id]: { hp: 100, maxHp: 100, defeatedAt: null },
  });
}

export function ensureTodayRound(state: AppState): { state: AppState; round: TodayRound; char: PracticeChar; boss: BossDef } {
  const today = todayStamp();
  let next = state;
  if (Object.keys(state.bosses).length === 0 || state.diagnosis) {
    next = ensureBosses(state);
  }
  const live = activeBoss(next);
  const existing = next.todayRound;
  if (existing && existing.date === today) {
    const stored = bossById(existing.bossId);
    const boss = stored ?? live;
    if (!next.bosses[boss.id]) next = ensureBossRecord(boss.id);
    const char = getChar(existing.charId) ?? pickRoundChar(next, boss);
    return { state: next, round: existing, char, boss };
  }
  const char = pickRoundChar(next, live);
  const round: TodayRound = {
    date: today,
    charId: char.id,
    bossId: live.id,
  };
  next = setTodayRound(round);
  return { state: next, round, char, boss: live };
}

export function resolveHitBoss(
  char: PracticeChar,
  preferredBossId?: string,
  state = loadState(),
): BossDef | undefined {
  const preferred = bossById(preferredBossId);
  if (preferred && isLiving(state, preferred)) {
    return preferred;
  }
  const roundBoss = bossById(state.todayRound?.bossId);
  if (roundBoss && isLiving(state, roundBoss) && isRelated(roundBoss, char)) {
    return roundBoss;
  }
  return BOSSES.find((b) => isLiving(state, b) && isRelated(b, char));
}

export function applyAdoptHit(
  char: PracticeChar,
  score: number,
  preferredBossId?: string,
): boolean {
  if (score < BOSS_HIT_SCORE) return false;
  let state = ensureBosses(loadState());
  const related = resolveHitBoss(char, preferredBossId, state);
  if (!related) return false;
  if (!state.bosses[related.id]) state = ensureBossRecord(related.id);
  const cur = loadState().bosses[related.id];
  if (!cur || cur.defeatedAt) return false;
  hitBoss(related.id, score >= COVER_SCORE ? 34 : 25);
  return true;
}

export function relatedLivingBoss(
  char: PracticeChar,
  state = loadState(),
): BossDef | undefined {
  return resolveHitBoss(char, undefined, state);
}

export function huntHref(charId: string, bossId?: string): string {
  const q = new URLSearchParams({ from: "boss" });
  if (bossId) q.set("boss", bossId);
  return `${practicePath(charId)}?${q.toString()}`;
}

export function charHuntHref(char: PracticeChar, preferredBoss?: BossDef): string {
  const bossId =
    preferredBoss && isRelated(preferredBoss, char) ? preferredBoss.id : undefined;
  return huntHref(char.id, bossId);
}

export function bossHuntHref(boss: BossDef, preferId?: string): string {
  const ids = boss.characterIds.filter((id) => CHAR_BY_ID[id]);
  const start =
    (preferId && ids.includes(preferId) ? preferId : ids[0]) ?? boss.characterIds[0];
  return huntHref(start, boss.id);
}

export function roundHref(charId: string, from = "round"): string {
  return `${practicePath(charId)}?from=${encodeURIComponent(from)}`;
}

export function sceneHref(scene: Scene): string {
  const q = encodeURIComponent(scene.characterIds.join(","));
  return `${practicePath(scene.characterIds[0])}?queue=${q}&from=scenes`;
}

export function weeklyHref(charId: string): string {
  return roundHref(charId, "weekly");
}

export function themeLabel(char: PracticeChar, boss: BossDef): string {
  if (boss.focuses.includes(char.focus)) return boss.name;
  return FOCUS_LABEL[char.focus];
}

export function isTwoPhase(from?: string): boolean {
  return from === "round" || from === "weekly";
}

export function isBossHunt(from?: string): boolean {
  return from === "boss";
}
