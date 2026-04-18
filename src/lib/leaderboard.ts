const KEY = "space-adventure-leaderboard-v1";
const MAX = 5;

export interface ScoreEntry {
  name: string;
  score: number;
  date: number;
}

export function loadScores(): ScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function qualifiesForTop(score: number, scores: ScoreEntry[]): boolean {
  if (score <= 0) return false;
  if (scores.length < MAX) return true;
  return score > scores[scores.length - 1].score;
}

export function saveScore(name: string, score: number): ScoreEntry[] {
  const current = loadScores();
  const entry: ScoreEntry = {
    name: name.trim().slice(0, 12) || "Anonyme",
    score,
    date: Date.now(),
  };
  const next = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export const TOP_MAX = MAX;
