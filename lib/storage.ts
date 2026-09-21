import type { StrokeFocus } from "./characters";

export type CharRecord = {
  count: number;
  best: number;
  last: number;
  history: { date: string; score: number }[];
};

export type Diagnosis = {
  size: "small" | "ok" | "large";
  tilt: "left" | "ok" | "right";
  center: "left" | "ok" | "right";
  note: string;
};

export type AlbumEntry = {
  id: string;
  charId: string;
  date: string;
  score: number;
  image: string;
  focus: StrokeFocus;
};

export type BossState = {
  hp: number;
  maxHp: number;
  defeatedAt: string | null;
};

export type TodayRound = {
  date: string;
  charId: string;
  bossId: string;
  adoptedEntryId?: string;
};

export type AppState = {
  onboarded: boolean;
  streak: number;
  lastPracticeDate: string | null;
  records: Record<string, CharRecord>;
  diagnosis?: Diagnosis;
  totalWrites: number;
  practiceDays: string[];
  album: AlbumEntry[];
  bosses: Record<string, BossState>;
  todayRound: TodayRound | null;
};

const KEY = "kirei-ji-v1";
const ALBUM_MAX = 48;

export const EMPTY_STATE: AppState = {
  onboarded: false,
  streak: 0,
  lastPracticeDate: null,
  records: {},
  totalWrites: 0,
  practiceDays: [],
  album: [],
  bosses: {},
  todayRound: null,
};

export function todayStamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStamp(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadState(): AppState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...EMPTY_STATE,
      ...parsed,
      album: parsed.album ?? [],
      bosses: parsed.bosses ?? {},
      todayRound: parsed.todayRound ?? null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function updateState(patch: (prev: AppState) => AppState): AppState {
  const next = patch(loadState());
  saveState(next);
  return next;
}

export function recordScore(charId: string, score: number): AppState {
  const today = todayStamp();
  return updateState((prev) => {
    const rec = prev.records[charId] ?? {
      count: 0,
      best: 0,
      last: 0,
      history: [],
    };
    const history = [...rec.history, { date: today, score }].slice(-30);
    let streak = prev.streak;
    if (prev.lastPracticeDate === today) {
      // keep
    } else if (prev.lastPracticeDate === yesterdayStamp() || prev.streak === 0) {
      streak = prev.lastPracticeDate === yesterdayStamp() ? prev.streak + 1 : 1;
    } else {
      streak = 1;
    }
    const days = new Set(prev.practiceDays);
    days.add(today);
    return {
      ...prev,
      streak,
      lastPracticeDate: today,
      totalWrites: prev.totalWrites + 1,
      practiceDays: Array.from(days).slice(-120),
      records: {
        ...prev.records,
        [charId]: {
          count: rec.count + 1,
          best: Math.max(rec.best, score),
          last: score,
          history,
        },
      },
    };
  });
}

export function markOnboarded(diagnosis: Diagnosis): AppState {
  return updateState((prev) => ({
    ...prev,
    onboarded: true,
    diagnosis,
  }));
}

export function weakestIds(state: AppState, n = 3): string[] {
  const entries = Object.entries(state.records);
  if (entries.length === 0) return [];
  return entries
    .sort((a, b) => a[1].last - b[1].last || a[1].best - b[1].best)
    .slice(0, n)
    .map(([id]) => id);
}

export function averageScore(state: AppState): number | null {
  const vals = Object.values(state.records).map((r) => r.best);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function captureSheet(source: HTMLCanvasElement): string {
  const out = 280;
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#FBF7F0";
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(source, 0, 0, out, out);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export function saveAlbumEntry(
  entry: Omit<AlbumEntry, "id" | "date">,
  opts?: { keepAsToday?: boolean },
): AlbumEntry {
  const today = todayStamp();
  const saved: AlbumEntry = {
    ...entry,
    id: `${today}-${entry.charId}-${Date.now()}`,
    date: today,
  };
  updateState((prev) => ({
    ...prev,
    album: [saved, ...prev.album].slice(0, ALBUM_MAX),
    todayRound:
      opts?.keepAsToday &&
      prev.todayRound &&
      prev.todayRound.date === today &&
      prev.todayRound.charId === entry.charId
        ? { ...prev.todayRound, adoptedEntryId: saved.id }
        : prev.todayRound,
  }));
  return saved;
}

export function setTodayRound(round: TodayRound): AppState {
  return updateState((prev) => ({ ...prev, todayRound: round }));
}

export function setBosses(bosses: Record<string, BossState>): AppState {
  return updateState((prev) => ({ ...prev, bosses }));
}

export function hitBoss(bossId: string, amount: number): AppState {
  const today = todayStamp();
  return updateState((prev) => {
    const cur = prev.bosses[bossId];
    if (!cur || cur.defeatedAt) return prev;
    const hp = Math.max(0, cur.hp - amount);
    return {
      ...prev,
      bosses: {
        ...prev.bosses,
        [bossId]: {
          ...cur,
          hp,
          defeatedAt: hp <= 0 ? today : null,
        },
      },
    };
  });
}

export const ADOPT_SCORE = 78;
export const COVER_SCORE = 90;
export const BOSS_HIT_SCORE = 80;

const RULES_KEY = "kirei-ji-rules-v1";

export function loadRulesSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(RULES_KEY) === "1";
  } catch {
    return true;
  }
}

export function markRulesSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RULES_KEY, "1");
}
