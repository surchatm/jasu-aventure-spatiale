import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { POKEMONS, type PokemonDef, type Rarity } from "@/lib/pokemon";

interface PokedexProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caughtIds: Set<string>;
}

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Communs",
  rare: "Rares",
  legendary: "Légendaires",
};

const RARITY_ORDER: Rarity[] = ["common", "rare", "legendary"];

function PokeCard({ pokemon, caught }: { pokemon: PokemonDef; caught: boolean }) {
  const isLegendary = pokemon.rarity === "legendary";
  const borderColor =
    pokemon.rarity === "common"
      ? "var(--muted)"
      : pokemon.rarity === "rare"
      ? "var(--accent)"
      : "var(--rainbow)";

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-center transition-transform hover:scale-105 ${
        isLegendary && caught ? "animate-glow-pulse" : ""
      }`}
      style={{
        borderColor: caught ? borderColor : "var(--border)",
        background: caught ? "var(--card)" : "var(--muted)",
        opacity: caught ? 1 : 0.7,
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16">
        <img
          src={pokemon.image}
          alt={caught ? pokemon.name : "???"}
          className="h-full w-full object-contain"
          style={caught ? undefined : { filter: "brightness(0)", opacity: 0.6 }}
          draggable={false}
        />
      </div>
      <div className="text-[11px] font-bold leading-tight text-foreground sm:text-xs">
        {caught ? pokemon.name : "???"}
      </div>
      {caught && (
        <div className="text-[10px] font-semibold sm:text-[11px]" style={{ color: borderColor }}>
          {pokemon.points} pts
        </div>
      )}
    </div>
  );
}

export function Pokedex({ open, onOpenChange, caughtIds }: PokedexProps) {
  const total = POKEMONS.length;
  const caughtCount = POKEMONS.filter((p) => caughtIds.has(p.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl gap-3 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            📖 Pokédex
          </DialogTitle>
          <DialogDescription>
            Attrapés : <span className="font-bold text-foreground">{caughtCount}</span> / {total}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="flex flex-col gap-4">
            {RARITY_ORDER.map((rarity) => {
              const list = POKEMONS.filter((p) => p.rarity === rarity);
              if (list.length === 0) return null;
              return (
                <section key={rarity} className="flex flex-col gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    {RARITY_LABEL[rarity]} ({list.filter((p) => caughtIds.has(p.id)).length}/{list.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {list.map((p) => (
                      <PokeCard key={p.id} pokemon={p} caught={caughtIds.has(p.id)} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
