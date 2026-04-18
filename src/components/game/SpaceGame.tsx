import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarField } from "./StarField";
import { Confetti } from "./Confetti";
import { Leaderboard } from "./Leaderboard";
import { sfx } from "@/lib/sound";
import { loadScores, qualifiesForTop, saveScore, type ScoreEntry } from "@/lib/leaderboard";
import { useMusic } from "@/hooks/use-music";

type Phase = "start" | "playing" | "over";
type ItemKind = "star" | "asteroid" | "rainbow" | "shield" | "pokeball";

interface FallingItem {
  id: number;
  kind: ItemKind;
  x: number; // percent
  y: number; // percent
  speed: number;
  rot: number;
}

interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const STAGE_W = 100;
const STAGE_H = 100;
const PLAYER_W = 12; // percent
const PLAYER_Y = 86; // percent from top
const WIN_SCORE = 200;
const TICK_MS = 30;

const ITEM_VISUAL: Record<ItemKind, { emoji: string; size: number }> = {
  star: { emoji: "⭐", size: 36 },
  asteroid: { emoji: "☄️", size: 38 },
  rainbow: { emoji: "🌈", size: 38 },
  shield: { emoji: "🛡️", size: 36 },
  pokeball: { emoji: "🔴", size: 38 },
};

const POKEMONS = ["🐹", "🦊", "🐉", "🦄", "🐲", "🦎", "🐢", "🦋"];
const PLANET_EMOJIS = ["🪐", "🌍", "🌕", "🔵"];

interface Planet {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

export function SpaceGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [playerX, setPlayerX] = useState(50);
  const [shielded, setShielded] = useState(false);
  const [doubled, setDoubled] = useState(false);
  const [shake, setShake] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [pendingName, setPendingName] = useState("");
  const [savedIndex, setSavedIndex] = useState<number | null>(null);
  const [needsName, setNeedsName] = useState(false);
  const [planets, setPlanets] = useState<Planet[]>([]);
  const music = useMusic();

  useEffect(() => {
    setScores(loadScores());
  }, []);

  const idRef = useRef(0);
  const elapsedRef = useRef(0);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const stageRef = useRef<HTMLDivElement>(null);
  const milestoneRef = useRef(0);
  const planetTimerRef = useRef(0);

  const reset = useCallback(() => {
    setScore(0);
    setHearts(3);
    setItems([]);
    setPopups([]);
    setPlanets([]);
    setPlayerX(50);
    setShielded(false);
    setDoubled(false);
    elapsedRef.current = 0;
    milestoneRef.current = 0;
    planetTimerRef.current = 0;
  }, []);

  const startGame = useCallback(() => {
    reset();
    sfx.start();
    music.play();
    setSavedIndex(null);
    setNeedsName(false);
    setPendingName("");
    setPhase("playing");
  }, [reset, music]);

  const endGame = useCallback((finalScore: number) => {
    music.stop();
    const current = loadScores();
    if (qualifiesForTop(finalScore, current)) {
      setNeedsName(true);
    } else {
      setNeedsName(false);
      setScores(current);
    }
    setPhase("over");
  }, [music]);

  const submitName = useCallback(() => {
    const next = saveScore(pendingName, score);
    setScores(next);
    const idx = next.findIndex((e) => e.score === score && e.name === (pendingName.trim().slice(0, 12) || "Anonyme"));
    setSavedIndex(idx >= 0 ? idx : null);
    setNeedsName(false);
  }, [pendingName, score]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === " " && phase !== "playing") {
        e.preventDefault();
        startGame();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase, startGame]);

  // Pointer / touch
  useEffect(() => {
    if (phase !== "playing") return;
    const stage = stageRef.current;
    if (!stage) return;

    const move = (clientX: number) => {
      const rect = stage.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPlayerX(Math.max(PLAYER_W / 2, Math.min(STAGE_W - PLAYER_W / 2, pct)));
    };
    const onMove = (e: PointerEvent) => move(e.clientX);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerdown", onMove);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerdown", onMove);
    };
  }, [phase]);

  // Main game loop
  useEffect(() => {
    if (phase !== "playing") return;

    const interval = setInterval(() => {
      elapsedRef.current += TICK_MS;
      const seconds = elapsedRef.current / 1000;
      const difficulty = 1 + Math.floor(seconds / 10) * 0.25; // ramps every 10s

      // Move player from keys
      setPlayerX((x) => {
        let next = x;
        if (keysRef.current.left) next -= 1.6;
        if (keysRef.current.right) next += 1.6;
        return Math.max(PLAYER_W / 2, Math.min(STAGE_W - PLAYER_W / 2, next));
      });

      // Spawn item
      const spawnChance = 0.06 + difficulty * 0.02;
      let newItem: FallingItem | null = null;
      if (Math.random() < spawnChance) {
        const r = Math.random();
        let kind: ItemKind;
        if (r < 0.5) kind = "star";
        else if (r < 0.8) kind = "asteroid";
        else if (r < 0.9) kind = "rainbow";
        else if (r < 0.98) kind = "shield";
        else kind = "pokeball"; // very rare ~2%
        idRef.current += 1;
        newItem = {
          id: idRef.current,
          kind,
          x: 6 + Math.random() * 88,
          y: -5,
          speed: 0.7 + Math.random() * 0.5 + difficulty * 0.3,
          rot: Math.random() * 360,
        };
      }

      // Spawn stationary planet (rare)
      planetTimerRef.current += TICK_MS;
      if (planetTimerRef.current > 8000 && Math.random() < 0.01) {
        planetTimerRef.current = 0;
        idRef.current += 1;
        const newPlanet: Planet = {
          id: idRef.current,
          emoji: PLANET_EMOJIS[Math.floor(Math.random() * PLANET_EMOJIS.length)],
          x: 15 + Math.random() * 70,
          y: 20 + Math.random() * 45,
          size: 44 + Math.random() * 24,
        };
        setPlanets((p) => [...p, newPlanet].slice(-3));
      }

      // Planet collision (stationary obstacle)
      setPlanets((prev) => {
        for (const pl of prev) {
          const dx = pl.x - playerX;
          const dy = pl.y - PLAYER_Y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = pl.size / 12 + PLAYER_W / 2;
          if (dist < radius) {
            handleHit({ id: pl.id, kind: "asteroid", x: pl.x, y: pl.y, speed: 0, rot: 0 });
            return prev.filter((x) => x.id !== pl.id);
          }
        }
        return prev;
      });

      // Update items + collisions
      setItems((prev) => {
        const advanced = prev.map((it) => ({ ...it, y: it.y + it.speed, rot: it.rot + 4 }));
        const remaining: FallingItem[] = [];
        for (const it of advanced) {
          if (it.y > 110) continue;
          // collision when item near player band
          const near =
            it.y > PLAYER_Y - 6 &&
            it.y < PLAYER_Y + 8 &&
            Math.abs(it.x - playerX) < PLAYER_W / 2 + 4;
          if (near) {
            handleHit(it);
          } else {
            remaining.push(it);
          }
        }
        if (newItem) remaining.push(newItem);
        return remaining;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerX, doubled, shielded]);

  function handleHit(it: FallingItem) {
    idRef.current += 1;
    const popupId = idRef.current;
    if (it.kind === "star") {
      const points = doubled ? 20 : 10;
      sfx.collect();
      setScore((s) => {
        const next = s + points;
        const milestone = Math.floor(next / 50);
        if (milestone > milestoneRef.current) {
          milestoneRef.current = milestone;
          setConfetti((c) => c + 1);
        }
        if (next >= WIN_SCORE) {
          sfx.win();
          setConfetti((c) => c + 1);
          endGame(next);
        }
        return next;
      });
      setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: `+${points}`, color: "var(--star)" }]);
    } else if (it.kind === "rainbow") {
      sfx.power();
      setDoubled(true);
      setTimeout(() => setDoubled(false), 5000);
      setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: "x2 !", color: "var(--rainbow)" }]);
    } else if (it.kind === "shield") {
      sfx.power();
      setShielded(true);
      setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: "Bouclier !", color: "var(--shield)" }]);
    } else if (it.kind === "pokeball") {
      const points = doubled ? 100 : 50;
      sfx.pokemon();
      setConfetti((c) => c + 1);
      const poke = POKEMONS[Math.floor(Math.random() * POKEMONS.length)];
      setScore((s) => {
        const next = s + points;
        if (next >= WIN_SCORE) {
          sfx.win();
          endGame(next);
        }
        return next;
      });
      setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: `${poke} +${points} !`, color: "var(--rainbow)" }]);
    } else if (it.kind === "asteroid") {
      if (shielded) {
        setShielded(false);
        sfx.power();
        setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: "Bloqué !", color: "var(--shield)" }]);
      } else {
        sfx.hit();
        setShake((s) => s + 1);
        setHearts((h) => {
          const next = h - 1;
          if (next <= 0) {
            sfx.gameover();
            endGame(score);
          }
          return next;
        });
        setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: "Aïe !", color: "var(--heart)" }]);
      }
    }
    setTimeout(() => setPopups((p) => p.filter((x) => x.id !== popupId)), 900);
  }

  const won = phase === "over" && score >= WIN_SCORE;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4" style={{ background: "var(--gradient-space)" }}>
      <h1 className="text-center text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        🚀 L'Aventure Spatiale
      </h1>
      <p className="text-center text-sm text-muted-foreground">
        Attrape les ⭐ étoiles, évite les ☄️ astéroïdes, prends les bonus 🌈 et 🛡️ !
      </p>

      <div
        ref={stageRef}
        className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-3xl border-2 touch-none select-none"
        style={{
          background: "var(--gradient-space)",
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-glow)",
          animation: shake > 0 ? "shake 0.4s ease-in-out" : undefined,
        }}
        key={`stage-${shake}`}
      >
        <StarField />

        {/* HUD */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3">
          <div className="rounded-full bg-card/80 px-3 py-1.5 text-sm font-bold text-card-foreground backdrop-blur">
            Score : {score}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={music.toggleMute}
              aria-label={music.muted ? "Activer la musique" : "Couper la musique"}
              className="rounded-full bg-card/80 px-2 py-1 text-base backdrop-blur transition hover:scale-110"
            >
              {music.muted ? "🔇" : "🔊"}
            </button>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="text-xl" style={{ filter: i < hearts ? "none" : "grayscale(1) opacity(0.3)" }}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Power-up indicators */}
        <div className="absolute left-3 top-14 z-20 flex flex-col gap-1">
          {doubled && (
            <div className="rounded-full px-2 py-0.5 text-xs font-bold animate-pop" style={{ background: "var(--gradient-rainbow)", color: "var(--primary-foreground)" }}>
              Score x2
            </div>
          )}
          {shielded && (
            <div className="rounded-full px-2 py-0.5 text-xs font-bold animate-pop" style={{ backgroundColor: "var(--shield)", color: "var(--primary-foreground)" }}>
              🛡️ Bouclier
            </div>
          )}
        </div>

        <Confetti trigger={confetti} />

        {/* Falling items */}
        {items.map((it) => {
          const v = ITEM_VISUAL[it.kind];
          return (
            <div
              key={it.id}
              className="absolute z-10 select-none"
              style={{
                left: `${it.x}%`,
                top: `${it.y}%`,
                fontSize: `${v.size}px`,
                lineHeight: 1,
                transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
                filter: it.kind === "star" ? "drop-shadow(var(--shadow-star))" : undefined,
              }}
            >
              {v.emoji}
            </div>
          );
        })}

        {/* Popups */}
        {popups.map((p) => (
          <div
            key={p.id}
            className="pointer-events-none absolute z-20 text-lg font-extrabold animate-rise"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              color: p.color,
              transform: "translate(-50%, -50%)",
              textShadow: "0 2px 6px rgba(0,0,0,0.5)",
            }}
          >
            {p.text}
          </div>
        ))}

        {/* Player */}
        {phase !== "start" && (
          <div
            className="absolute z-10 select-none"
            style={{
              left: `${playerX}%`,
              top: `${PLAYER_Y}%`,
              transform: "translate(-50%, -50%)",
              fontSize: "52px",
              lineHeight: 1,
              filter: shielded ? "drop-shadow(0 0 12px var(--shield))" : "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
              animation: "bounce-soft 1.2s ease-in-out infinite",
            }}
          >
            🚀
          </div>
        )}

        {/* Start overlay */}
        {phase === "start" && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-background/70 p-6 text-center backdrop-blur-sm">
            <div className="text-5xl animate-float-slow">🚀</div>
            <h2 className="text-2xl font-extrabold text-foreground">Prêt, astronaute ?</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>⭐ Attrape les étoiles pour marquer</li>
              <li>☄️ Évite les astéroïdes</li>
              <li>🌈 Arc-en-ciel = points x2 !</li>
              <li>🛡️ Le bouclier bloque un coup</li>
            </ul>
            <Button
              size="lg"
              onClick={startGame}
              className="h-14 rounded-full px-8 text-lg font-bold shadow-lg transition-transform hover:scale-105"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}
            >
              ▶ Commencer
            </Button>
            <Leaderboard scores={scores} />
            <p className="text-xs text-muted-foreground">Flèches ← → ou doigt sur l'écran</p>
          </div>
        )}

        {/* Game over overlay */}
        {phase === "over" && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-background/85 p-6 text-center backdrop-blur-sm animate-pop">
            <div className="text-5xl">{won ? "🏆" : "💫"}</div>
            <h2 className="text-2xl font-extrabold text-foreground">
              {won ? "Tu as gagné !" : "Réessaie !"}
            </h2>
            <p className="text-lg font-bold text-foreground">Score : {score}</p>

            {needsName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitName();
                }}
                className="flex w-full max-w-xs flex-col items-center gap-2"
              >
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  🎉 Tu entres dans le Top 5 !
                </p>
                <Input
                  autoFocus
                  maxLength={12}
                  value={pendingName}
                  onChange={(e) => setPendingName(e.target.value)}
                  placeholder="Ton prénom"
                  className="h-11 rounded-full text-center text-base font-bold"
                />
                <Button
                  type="submit"
                  className="h-11 w-full rounded-full text-base font-bold"
                  style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)" }}
                >
                  💾 Enregistrer
                </Button>
              </form>
            ) : (
              <>
                <Leaderboard scores={scores} highlightIndex={savedIndex ?? undefined} />
                <Button
                  size="lg"
                  onClick={startGame}
                  className="h-14 rounded-full px-8 text-lg font-bold shadow-lg transition-transform hover:scale-105"
                  style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}
                >
                  🔄 Rejouer
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* On-screen controls for touch */}
      {phase === "playing" && (
        <div className="flex w-full max-w-md gap-3 sm:hidden">
          <Button
            className="h-16 flex-1 rounded-2xl text-2xl font-bold"
            onPointerDown={() => (keysRef.current.left = true)}
            onPointerUp={() => (keysRef.current.left = false)}
            onPointerLeave={() => (keysRef.current.left = false)}
          >
            ◀
          </Button>
          <Button
            className="h-16 flex-1 rounded-2xl text-2xl font-bold"
            onPointerDown={() => (keysRef.current.right = true)}
            onPointerUp={() => (keysRef.current.right = false)}
            onPointerLeave={() => (keysRef.current.right = false)}
          >
            ▶
          </Button>
        </div>
      )}
    </div>
  );
}
