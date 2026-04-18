import { useEffect, useState } from "react";

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  rotate: number;
}

const COLORS = ["var(--star)", "var(--rainbow)", "var(--shield)", "var(--primary)", "var(--accent)"];

export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const next = Array.from({ length: 40 }, (_, i) => ({
      id: trigger * 1000 + i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.3,
      duration: 1.2 + Math.random() * 0.8,
      rotate: Math.random() * 360,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), 2200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 h-3 w-3 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `rise ${p.duration}s ease-out ${p.delay}s forwards`,
            animationDirection: "reverse",
          }}
        />
      ))}
    </div>
  );
}
