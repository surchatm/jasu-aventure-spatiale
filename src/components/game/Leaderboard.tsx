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
    <div className="w-full max-w-sm space-y-2 rounded-2xl border border-border/50 bg-card/60 p-3 backdrop-blur">
      <h3 className="text-base font-extrabold text-foreground">🏆 Classement mondial</h3>
      <ol className="space-y-1">
        {scores.map((s, i) => {
          const highlighted = i === highlightIndex;
          return (
            <li
              key={s.id ?? `${s.date}-${i}`}
              className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                highlighted ? "animate-pop" : ""
              }`}
              style={{
                background: highlighted ? "var(--gradient-primary)" : "var(--muted)",
                color: highlighted ? "var(--primary-foreground)" : "var(--foreground)",
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-5 text-center">{MEDALS[i] ?? `${i + 1}.`}</span>
                <span className="truncate">{s.name}</span>
              </span>
              <span className="flex items-center gap-2 tabular-nums">
                {s.pokemonCaught > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    title="Pokémon attrapés"
                  >
                    🔴 {s.pokemonCaught}
                  </span>
                )}
                <span>{s.score}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
