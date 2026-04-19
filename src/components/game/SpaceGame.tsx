import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StarField } from "./StarField";
import { Confetti } from "./Confetti";
import { Leaderboard } from "./Leaderboard";
import { PokemonHUD, type CaughtEntry } from "./PokemonHUD";
import { sfx } from "@/lib/sound";
import { loadScores, qualifiesForTop, saveScore, subscribeToLeaderboard, type ScoreEntry } from "@/lib/leaderboard";
import { rollPokemon, type PokemonDef } from "@/lib/pokemon";
import { useMusic } from "@/hooks/use-music";
import pokeballImg from "@/assets/pokeball.png";

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
const WIN_SCORE = 100000;
const TICK_MS = 30;

const ITEM_VISUAL: Record<Exclude<ItemKind, "pokeball">, { emoji: string; size: number }> = {
  star: { emoji: "⭐", size: 36 },
  asteroid: { emoji: "☄️", size: 38 },
  rainbow: { emoji: "🌈", size: 38 },
  shield: { emoji: "🛡️", size: 36 },
};
const POKEBALL_SIZE = 42;

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
  const [caught, setCaught] = useState<CaughtEntry[]>([]);
  const caughtCountRef = useRef(0);
  const music = useMusic();

  useEffect(() => {
    let active = true;
    loadScores().then((s) => {
      if (active) setScores(s);
    });
    const unsub = subscribeToLeaderboard(() => {
      loadScores().then((s) => {
        if (active) setScores(s);
      });
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const idRef = useRef(0);
  const elapsedRef = useRef(0);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const stageRef = useRef<HTMLDivElement>(null);
  const milestoneRef = useRef(0);
  const planetTimerRef = useRef(0);
  const caughtIdsRef = useRef<Set<string>>(new Set());
  const playerXRef = useRef(50);
  const doubledRef = useRef(false);
  const shieldedRef = useRef(false);

  const reset = useCallback(() => {
    setScore(0);
    setHearts(3);
    setItems([]);
    setPopups([]);
    setPlanets([]);
    setCaught([]);
    setPlayerX(50);
    setShielded(false);
    setDoubled(false);
    elapsedRef.current = 0;
    milestoneRef.current = 0;
    planetTimerRef.current = 0;
    caughtCountRef.current = 0;
    caughtIdsRef.current = new Set();
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

  const endGame = useCallback(async (finalScore: number) => {
    music.stop();
    setPhase("over");
    const current = await loadScores();
    setScores(current);
    if (qualifiesForTop(finalScore, current)) {
      setNeedsName(true);
    } else {
      setNeedsName(false);
    }
  }, [music]);

  const submitName = useCallback(async () => {
    const cleanName = pendingName.trim().slice(0, 20) || "Anonyme";
    if (!Number.isFinite(score) || score <= 0) {
      setNeedsName(false);
      return;
    }
    const next = await saveScore(cleanName, score, caughtCountRef.current);
    setScores(next);
    const idx = next.findIndex((e) => e.score === score && e.name === cleanName);
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
        const allCaught = caughtIdsRef.current.size >= 7;
        let kind: ItemKind;
        if (r < 0.5) kind = "star";
        else if (r < 0.82) kind = "asteroid";
        else if (r < 0.92) kind = "rainbow";
        else if (r < 0.997 || allCaught) kind = "shield";
        else kind = "pokeball"; // ~0.3% of spawns → ~1 per 45-60s
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
      if (planetTimerRef.current > 16000 && Math.random() < 0.004) {
        planetTimerRef.current = 0;
        idRef.current += 1;
        const newPlanet: Planet = {
          id: idRef.current,
          emoji: PLANET_EMOJIS[Math.floor(Math.random() * PLANET_EMOJIS.length)],
          x: 15 + Math.random() * 70,
          y: 20 + Math.random() * 45,
          size: 44 + Math.random() * 24,
        };
        setPlanets((p) => {
          // Replace any existing planet that overlaps with the new one
          const radiusNew = newPlanet.size / 12;
          const nonOverlapping = p.filter((existing) => {
            const dx = existing.x - newPlanet.x;
            const dy = existing.y - newPlanet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = radiusNew + existing.size / 12;
            return dist >= minDist;
          });
          return [...nonOverlapping, newPlanet].slice(-3);
        });
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
      const poke = rollPokemon(Array.from(caughtIdsRef.current));
      if (!poke) {
        // Already caught them all — treat as a small bonus
        sfx.power();
        setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: "Pokédex complet !", color: "var(--rainbow)" }]);
      } else {
        const points = doubled ? poke.points * 2 : poke.points;
        sfx.pokemon();
        setConfetti((c) => c + 1);
        caughtCountRef.current += 1;
        caughtIdsRef.current.add(poke.id);
        setCaught((prev) => [...prev, { pokemon: poke, count: 1, lastAt: Date.now() }]);
        setScore((s) => {
          const next = s + points;
          if (next >= WIN_SCORE) {
            sfx.win();
            endGame(next);
          }
          return next;
        });
        setPopups((p) => [...p, { id: popupId, x: it.x, y: it.y, text: `${poke.name} +${points} !`, color: "var(--rainbow)" }]);
      }
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-2 sm:gap-4 sm:p-4" style={{ background: "var(--gradient-space)" }}>
      <h1 className="text-center text-xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        🚀 L'Aventure Spatiale
      </h1>

      <div
        ref={stageRef}
        className="relative aspect-[3/4] w-full max-w-md max-h-[78vh] sm:max-h-none overflow-hidden rounded-3xl border-2 touch-none select-none"
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

        <PokemonHUD caught={caught} />

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

        {/* Stationary planets (obstacles) */}
        {planets.map((pl) => (
          <div
            key={pl.id}
            className="absolute z-10 select-none animate-float-slow"
            style={{
              left: `${pl.x}%`,
              top: `${pl.y}%`,
              fontSize: `${pl.size}px`,
              lineHeight: 1,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
            }}
          >
            {pl.emoji}
          </div>
        ))}

        {/* Falling items */}
        {items.map((it) => {
          if (it.kind === "pokeball") {
            return (
              <div
                key={it.id}
                className="absolute z-10 select-none flex items-center justify-center"
                style={{
                  left: `${it.x}%`,
                  top: `${it.y}%`,
                  width: `${POKEBALL_SIZE}px`,
                  height: `${POKEBALL_SIZE}px`,
                  transform: `translate(-50%, -50%) rotate(${it.rot}deg)`,
                  filter: "drop-shadow(0 0 8px var(--rainbow))",
                }}
              >
                <img
                  src={pokeballImg}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector(".pb-fallback")) {
                      const span = document.createElement("span");
                      span.textContent = "🔴";
                      span.className = "pb-fallback";
                      span.style.fontSize = `${POKEBALL_SIZE}px`;
                      span.style.lineHeight = "1";
                      parent.appendChild(span);
                    }
                  }}
                  style={{ width: "100%", height: "100%", pointerEvents: "none", userSelect: "none" }}
                />
              </div>
            );
          }
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
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-start gap-2 overflow-y-auto bg-background/70 p-4 text-center backdrop-blur-sm sm:justify-center sm:gap-3 sm:p-6">
            <div className="text-4xl animate-float-slow sm:text-5xl">🚀</div>
            <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">Prêt, astronaute ?</h2>
            <ul className="space-y-0.5 text-xs text-muted-foreground sm:space-y-1 sm:text-sm">
              <li>⭐ Attrape les étoiles pour marquer</li>
              <li>☄️ Évite les astéroïdes</li>
              <li>🌈 Arc-en-ciel = points x2 !</li>
              <li>🛡️ Le bouclier bloque un coup</li>
              <li className="flex items-center justify-center gap-1.5">
                <img src={pokeballImg} alt="" aria-hidden="true" className="h-4 w-4 inline-block" draggable={false} />
                <span>Pokéball = attrape un Pokémon (rare !)</span>
              </li>
            </ul>
            <Button
              size="lg"
              onClick={startGame}
              className="h-12 rounded-full px-6 text-base font-bold shadow-lg transition-transform hover:scale-105 sm:h-14 sm:px-8 sm:text-lg"
              style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}
            >
              ▶ Commencer
            </Button>
            <Leaderboard scores={scores} />
            <p className="text-[11px] text-muted-foreground sm:text-xs">Flèches ← → ou doigt sur l'écran</p>
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
            {caught.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  🔴 {caughtCountRef.current} Pokémon attrapé{caughtCountRef.current > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {caught.map((c) => (
                    <div key={c.pokemon.id} className="relative h-10 w-10">
                      <img src={c.pokemon.image} alt={c.pokemon.name} className="h-full w-full object-contain" draggable={false} />
                      {c.count > 1 && (
                        <span
                          className="absolute -bottom-1 -right-1 rounded-full px-1 text-[10px] font-bold"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                        >
                          ×{c.count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {needsName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitName();
                }}
                className="flex w-full max-w-xs flex-col items-center gap-2"
              >
                <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                  🎉 Tu entres dans le Top 5 mondial !
                </p>
                <Input
                  autoFocus
                  maxLength={20}
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
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button
                    size="lg"
                    onClick={startGame}
                    className="h-14 rounded-full px-8 text-lg font-bold shadow-lg transition-transform hover:scale-105"
                    style={{ background: "var(--gradient-primary)", color: "var(--primary-foreground)", boxShadow: "var(--shadow-glow)" }}
                  >
                    🔄 Rejouer
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => {
                      reset();
                      setSavedIndex(null);
                      setNeedsName(false);
                      setPendingName("");
                      setPhase("start");
                    }}
                    className="h-14 rounded-full px-6 text-base font-bold"
                  >
                    🏠 Accueil
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* On-screen controls for touch */}
      {phase === "playing" && (
        <div
          className="flex w-full max-w-md gap-3 sm:hidden select-none"
          style={{
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
            WebkitTapHighlightColor: "transparent",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {(["left", "right"] as const).map((dir) => (
            <button
              key={dir}
              type="button"
              aria-label={dir === "left" ? "Aller à gauche" : "Aller à droite"}
              draggable={false}
              onPointerDown={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
                keysRef.current[dir] = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                keysRef.current[dir] = false;
              }}
              onPointerCancel={() => (keysRef.current[dir] = false)}
              onPointerLeave={() => (keysRef.current[dir] = false)}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className="h-16 flex-1 rounded-2xl text-2xl font-bold bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform select-none"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
                WebkitUserDrag: "none",
              } as React.CSSProperties}
            >
              {dir === "left" ? "◀" : "▶"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
