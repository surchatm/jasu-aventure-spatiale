import { memo } from "react";
import type { PokemonDef } from "@/lib/pokemon";
import { RARITY_COLOR } from "@/lib/pokemon";

export interface CaughtEntry {
  pokemon: PokemonDef;
  count: number;
  lastAt: number;
}

const MAX_VISIBLE = 6;

function PokemonHUDInner({ caught }: { caught: CaughtEntry[] }) {
  if (caught.length === 0) return null;
  const recent = [...caught].sort((a, b) => b.lastAt - a.lastAt).slice(0, MAX_VISIBLE);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center px-2">
      <div className="flex max-w-full gap-1 overflow-hidden rounded-full bg-card/80 px-2 py-1 backdrop-blur">
        {recent.map((c) => (
          <div
            key={c.pokemon.id}
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, ${RARITY_COLOR[c.pokemon.rarity]} 0%, transparent 70%)`,
            }}
            title={`${c.pokemon.name} (${c.pokemon.rarity})`}
          >
            <img
              src={c.pokemon.image}
              alt={c.pokemon.name}
              loading="lazy"
              decoding="async"
              className={`h-7 w-7 object-contain ${c.pokemon.rarity === "legendary" ? "animate-glow-pulse" : ""}`}
              draggable={false}
            />
            {c.count > 1 && (
              <span
                className="absolute -bottom-0.5 -right-0.5 min-w-[16px] rounded-full px-1 text-[9px] font-bold leading-tight"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                ×{c.count}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const PokemonHUD = memo(PokemonHUDInner);
