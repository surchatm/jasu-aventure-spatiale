import type { ScoreEntry } from "@/lib/leaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Leaderboard({
  scores,
  highlightIndex,
}: {
  scores: ScoreEntry[];
  highlightIndex?: number;
}) {
  if (scores.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Aucun score pour l'instant — sois le premier !
      </p>
    );
  }
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <h3 className="text-sm font-bold text-foreground">🏆 Top 10 mondial</h3>
      <ol className="space-y-1">
        {scores.map((s, i) => {
          const highlighted = i === highlightIndex;
          return (
            <li
              key={`${s.date}-${i}`}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                highlighted ? "animate-pop" : ""
              }`}
              style={{
                background: highlighted ? "var(--gradient-primary)" : "var(--muted)",
                color: highlighted ? "var(--primary-foreground)" : "var(--foreground)",
              }}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 text-center">{MEDALS[i] ?? `${i + 1}.`}</span>
                <span className="truncate">{s.name}</span>
              </span>
              <span className="tabular-nums">{s.score}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
