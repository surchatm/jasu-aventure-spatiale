import type { ScoreEntry } from "@/lib/leaderboard";
import { POKEMONS } from "@/lib/pokemon";

const MEDALS = ["🥇", "🥈", "🥉"];
const POKE_BY_ID = new Map(POKEMONS.map((p) => [p.id, p]));
const MAX_ICONS = 6;

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
      <h3 className="text-base font-extrabold text-foreground">🏆 Top 5 mondial</h3>
      <ol className="space-y-1">
        {scores.map((s, i) => {
          const highlighted = i === highlightIndex;
          const ids = s.pokemonIds && s.pokemonIds.length > 0 ? s.pokemonIds : [];
          const visible = ids.slice(0, MAX_ICONS);
          const extra = ids.length - visible.length;
          return (
            <li
              key={s.id ?? `${s.date}-${i}`}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
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
              <span className="flex items-center gap-1.5 tabular-nums">
                {visible.length > 0 ? (
                  <span className="flex items-center -space-x-1.5" title={`${s.pokemonCaught} Pokémon attrapés`}>
                    {visible.map((id, idx) => {
                      const p = POKE_BY_ID.get(id);
                      if (!p) return null;
                      return (
                        <img
                          key={`${id}-${idx}`}
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="h-5 w-5 rounded-full bg-card/80 object-contain ring-1 ring-border/60"
                          title={p.name}
                        />
                      );
                    })}
                    {extra > 0 && (
                      <span
                        className="ml-1 rounded-full px-1 text-[10px] font-bold"
                        style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                      >
                        +{extra}
                      </span>
                    )}
                  </span>
                ) : s.pokemonCaught > 0 ? (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
                    title="Pokémon attrapés"
                  >
                    🔴 {s.pokemonCaught}
                  </span>
                ) : null}
                <span>{s.score}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
