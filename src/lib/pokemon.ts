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
  { id: "tadmorv", name: "Tadmorv", image: tadmorv, points: 90, rarity: "common", weight: 15 },
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

export function rollPokemon(excludeIds: string[] = []): PokemonDef | null {
  const pool = POKEMONS.filter((p) => !excludeIds.includes(p.id));
  if (pool.length === 0) return null;
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= p.weight;
    if (r <= 0) return p;
  }
  return pool[0];
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "var(--muted)",
  rare: "var(--accent)",
  legendary: "var(--rainbow)",
};
