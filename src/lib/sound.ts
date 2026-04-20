// Tiny Web Audio sound effects — no asset files, instant load
import legendaryCaptureUrl from "@/assets/sfx/legendary-capture.mp3";

let ctx: AudioContext | null = null;
let legendaryAudio: HTMLAudioElement | null = null;
let muted: boolean = (() => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("space-sfx-muted") === "1";
})();

const listeners = new Set<(m: boolean) => void>();

export function isSfxMuted() {
  return muted;
}

export function setSfxMuted(next: boolean) {
  muted = next;
  if (typeof window !== "undefined") {
    localStorage.setItem("space-sfx-muted", next ? "1" : "0");
  }
  if (next && legendaryAudio) {
    legendaryAudio.pause();
  }
  listeners.forEach((l) => l(next));
}

export function subscribeSfxMuted(cb: (m: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const sfx = {
  collect: () => {
    tone(880, 0.08, "triangle", 0.18);
    setTimeout(() => tone(1320, 0.12, "triangle", 0.18), 60);
  },
  hit: () => {
    tone(180, 0.25, "sawtooth", 0.2);
    setTimeout(() => tone(110, 0.2, "sawtooth", 0.18), 80);
  },
  power: () => {
    tone(660, 0.08, "square", 0.15);
    setTimeout(() => tone(880, 0.08, "square", 0.15), 70);
    setTimeout(() => tone(1180, 0.15, "square", 0.15), 140);
  },
  win: () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.2), i * 130));
  },
  gameover: () => {
    [440, 349, 277, 196].forEach((f, i) => setTimeout(() => tone(f, 0.22, "sawtooth", 0.18), i * 140));
  },
  start: () => {
    tone(523, 0.1, "triangle", 0.18);
    setTimeout(() => tone(784, 0.15, "triangle", 0.18), 100);
  },
  pokemon: () => {
    [659, 784, 988, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.12, "square", 0.18), i * 80));
  },
  legendary: () => {
    if (typeof window === "undefined") return;
    if (muted) return;
    try {
      if (!legendaryAudio) {
        legendaryAudio = new Audio(legendaryCaptureUrl);
        legendaryAudio.volume = 0.7;
      }
      legendaryAudio.currentTime = 0;
      void legendaryAudio.play();
    } catch {
      // ignore
    }
  },
};
