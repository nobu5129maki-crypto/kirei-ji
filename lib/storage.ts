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

export type AppState = {
  onboarded: boolean;
  streak: number;
  lastPracticeDate: string | null;
  records: Record<string, CharRecord>;
  diagnosis?: Diagnosis;
  totalWrites: number;
  practiceDays: string[];
};

const KEY = "kirei-ji-v1";

export const EMPTY_STATE: AppState = {
  onboarded: false,
  streak: 0,
  lastPracticeDate: null,
  records: {},
  totalWrites: 0,
  practiceDays: [],
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
    return { ...EMPTY_STATE, ...JSON.parse(raw) } as AppState;
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
