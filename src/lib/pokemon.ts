import bulbizarre from "@/assets/pokemon/bulbizarre.png";
import dracaufeu from "@/assets/pokemon/dracaufeu.png";
import carabaffe from "@/assets/pokemon/carabaffe.png";
import papilusion from "@/assets/pokemon/papilusion.png";
import pikachu from "@/assets/pokemon/pikachu.png";
import rondoudou from "@/assets/pokemon/rondoudou.png";
import ferosinge from "@/assets/pokemon/ferosinge.png";
import mewto from "@/assets/pokemon/mewto.png";
import tadmorv from "@/assets/pokemon/tadmorv.png";
import ponyta from "@/assets/pokemon/ponyta.png";
import machopeur from "@/assets/pokemon/machopeur.png";
import taupiqueur from "@/assets/pokemon/taupiqueur.png";
import evoli from "@/assets/pokemon/evoli.png";
import onix from "@/assets/pokemon/onix.png";
import tortank from "@/assets/pokemon/tortank.png";
import sulfura from "@/assets/pokemon/sulfura.png";
import rayquaza from "@/assets/pokemon/rayquaza.png";
import blizzeval from "@/assets/pokemon/blizzeval.png";
import ectoplasma from "@/assets/pokemon/ectoplasma.png";
import ronflex from "@/assets/pokemon/ronflex.png";
import abra from "@/assets/pokemon/abra.png";
import noctali from "@/assets/pokemon/noctali.png";

export type Rarity = "common" | "rare" | "legendary";

export interface PokemonDef {
  id: string;
  name: string;
  image: string;
  points: number;
  rarity: Rarity;
  weight: number; // spawn weight
}

export const POKEMONS: PokemonDef[] = [
  { id: "rondoudou", name: "Rondoudou", image: rondoudou, points: 50, rarity: "common", weight: 25 },
  { id: "papilusion", name: "Papilusion", image: papilusion, points: 60, rarity: "common", weight: 22 },
  { id: "taupiqueur", name: "Taupiqueur", image: taupiqueur, points: 70, rarity: "common", weight: 22 },
  { id: "bulbizarre", name: "Bulbizarre", image: bulbizarre, points: 80, rarity: "common", weight: 20 },
  { id: "evoli", name: "Évoli", image: evoli, points: 90, rarity: "common", weight: 18 },
  { id: "abra", name: "Abra", image: abra, points: 90, rarity: "common", weight: 16 },
  { id: "tadmorv", name: "Tadmorv", image: tadmorv, points: 90, rarity: "common", weight: 15 },
  { id: "noctali", name: "Noctali", image: noctali, points: 130, rarity: "rare", weight: 10 },
  { id: "ectoplasma", name: "Ectoplasma", image: ectoplasma, points: 220, rarity: "rare", weight: 7 },
  { id: "ronflex", name: "Ronflex", image: ronflex, points: 250, rarity: "rare", weight: 6 },
  { id: "carabaffe", name: "Carabaffe", image: carabaffe, points: 100, rarity: "rare", weight: 12 },
  { id: "ponyta", name: "Ponyta", image: ponyta, points: 110, rarity: "rare", weight: 11 },
  { id: "ferosinge", name: "Férosinge", image: ferosinge, points: 120, rarity: "rare", weight: 10 },
  { id: "machopeur", name: "Machopeur", image: machopeur, points: 150, rarity: "rare", weight: 9 },
  { id: "onix", name: "Onix", image: onix, points: 180, rarity: "rare", weight: 8 },
  { id: "pikachu", name: "Pikachu", image: pikachu, points: 200, rarity: "rare", weight: 8 },
  { id: "dracaufeu", name: "Dracaufeu", image: dracaufeu, points: 300, rarity: "rare", weight: 5 },
  { id: "tortank", name: "Tortank", image: tortank, points: 350, rarity: "rare", weight: 4 },
  { id: "sulfura", name: "Sulfura", image: sulfura, points: 450, rarity: "legendary", weight: 3 },
  { id: "mewto", name: "Mewto", image: mewto, points: 500, rarity: "legendary", weight: 3 },
  { id: "blizzeval", name: "Blizzeval", image: blizzeval, points: 550, rarity: "legendary", weight: 2 },
  { id: "rayquaza", name: "Rayquaza", image: rayquaza, points: 600, rarity: "legendary", weight: 2 },
];

export function rollPokemon(excludeIds: string[] = [], rarityTier: number = 0): PokemonDef | null {
  const pool = POKEMONS.filter((p) => !excludeIds.includes(p.id));
  if (pool.length === 0) return null;
  // Each tier (per +1000 score) boosts rare x1.25 and legendary x1.6, capped at tier 8
  const t = Math.max(0, Math.min(8, rarityTier));
  const rareMult = Math.pow(1.25, t);
  const legendMult = Math.pow(1.6, t);
  const weighted = pool.map((p) => ({
    p,
    w: p.weight * (p.rarity === "legendary" ? legendMult : p.rarity === "rare" ? rareMult : 1),
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.p;
  }
  return pool[0];
}

const CAUGHT_STORAGE_KEY = "caughtPokemonIds";

export function loadCaughtIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(CAUGHT_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.filter((x): x is string => typeof x === "string"));
    return new Set();
  } catch {
    return new Set();
  }
}

export function saveCaughtIds(ids: Iterable<string>): Set<string> {
  const merged = loadCaughtIds();
  for (const id of ids) merged.add(id);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CAUGHT_STORAGE_KEY, JSON.stringify(Array.from(merged)));
    } catch {
      // ignore
    }
  }
  return merged;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "var(--muted)",
  rare: "var(--accent)",
  legendary: "var(--rainbow)",
};
