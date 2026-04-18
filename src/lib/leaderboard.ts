import { supabase } from "@/integrations/supabase/client";

const MAX = 10;

export interface ScoreEntry {
  id?: string;
  name: string;
  score: number;
  pokemonCaught: number;
  date: number;
}

export const TOP_MAX = MAX;

interface LeaderboardRow {
  id: string;
  player_name: string;
  score: number;
  pokemon_caught: number | null;
  created_at: string;
}

function rowToEntry(row: LeaderboardRow): ScoreEntry {
  return {
    id: row.id,
    name: row.player_name,
    score: row.score,
    pokemonCaught: row.pokemon_caught ?? 0,
    date: new Date(row.created_at).getTime(),
  };
}

export async function loadScores(): Promise<ScoreEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, player_name, score, pokemon_caught, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(MAX);
  if (error || !data) return [];
  return data.map(rowToEntry);
}

export function qualifiesForTop(score: number, scores: ScoreEntry[]): boolean {
  if (!Number.isFinite(score) || score <= 0) return false;
  if (scores.length < MAX) return true;
  return score > scores[scores.length - 1].score;
}

export async function saveScore(
  name: string,
  score: number,
  pokemonCaught: number,
): Promise<ScoreEntry[]> {
  const cleanName = name.trim().slice(0, 20) || "Anonyme";
  const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
  const cleanCaught = Math.max(0, Math.floor(Number(pokemonCaught) || 0));
  if (!cleanName || !Number.isFinite(cleanScore)) {
    return loadScores();
  }
  await supabase.from("leaderboard").insert({
    player_name: cleanName,
    score: cleanScore,
    pokemon_caught: cleanCaught,
  });
  return loadScores();
}

export function subscribeToLeaderboard(onChange: () => void) {
  const channel = supabase
    .channel("leaderboard-changes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "leaderboard" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
