import { useCallback, useEffect, useRef, useState } from "react";

const TRACKS = ["/music/track1.mp3", "/music/track2.mp3", "/music/track3.mp3", "/music/track4.mp3"];

export function useMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
  const baseVolumeRef = useRef(0.35);
  const duckTimersRef = useRef<number[]>([]);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("space-music-muted") === "1";
  });
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.volume = 0.35;
    audio.preload = "auto";
    audioRef.current = audio;

    const onEnded = () => {
      indexRef.current = (indexRef.current + 1) % TRACKS.length;
      audio.src = TRACKS[indexRef.current];
      audio.play().catch(() => {});
    };
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || muted) return;
    if (!audio.src) {
      indexRef.current = Math.floor(Math.random() * TRACKS.length);
      audio.src = TRACKS[indexRef.current];
    }
    audio.play().then(() => setPlaying(true)).catch(() => {});
  }, [muted]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (typeof window !== "undefined") {
        localStorage.setItem("space-music-muted", next ? "1" : "0");
      }
      const audio = audioRef.current;
      if (audio) {
        if (next) {
          audio.pause();
          setPlaying(false);
        } else {
          if (!audio.src) {
            indexRef.current = Math.floor(Math.random() * TRACKS.length);
            audio.src = TRACKS[indexRef.current];
          }
          audio.play().then(() => setPlaying(true)).catch(() => {});
        }
      }
      return next;
    });
  }, []);

  const duck = useCallback((durationMs = 3000, duckedVolume = 0.05, fadeMs = 250) => {
    const audio = audioRef.current;
    if (!audio) return;
    // Clear any pending fade timers
    duckTimersRef.current.forEach((t) => window.clearTimeout(t));
    duckTimersRef.current = [];

    const base = baseVolumeRef.current;
    const steps = 10;
    const stepMs = Math.max(10, Math.floor(fadeMs / steps));

    // Fade down
    for (let i = 1; i <= steps; i++) {
      const t = window.setTimeout(() => {
        if (!audioRef.current) return;
        const v = base + (duckedVolume - base) * (i / steps);
        audioRef.current.volume = Math.max(0, Math.min(1, v));
      }, stepMs * i);
      duckTimersRef.current.push(t);
    }

    // Fade back up after duration
    const fadeUpStart = fadeMs + durationMs;
    for (let i = 1; i <= steps; i++) {
      const t = window.setTimeout(() => {
        if (!audioRef.current) return;
        const v = duckedVolume + (base - duckedVolume) * (i / steps);
        audioRef.current.volume = Math.max(0, Math.min(1, v));
      }, fadeUpStart + stepMs * i);
      duckTimersRef.current.push(t);
    }
  }, []);

  return { muted, playing, play, stop, toggleMute, duck };
}
