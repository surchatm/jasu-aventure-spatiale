import { useCallback, useEffect, useRef, useState } from "react";

const TRACKS = ["/music/track1.mp3", "/music/track2.mp3", "/music/track3.mp3"];

export function useMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const indexRef = useRef(0);
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
        }
      }
      return next;
    });
  }, []);

  return { muted, playing, play, stop, toggleMute };
}
