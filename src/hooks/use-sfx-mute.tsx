import { useCallback, useEffect, useState } from "react";
import { isSfxMuted, setSfxMuted, subscribeSfxMuted } from "@/lib/sound";

export function useSfxMute() {
  const [muted, setMutedState] = useState<boolean>(() => isSfxMuted());

  useEffect(() => {
    const unsub = subscribeSfxMuted((m) => setMutedState(m));
    return () => {
      unsub();
    };
  }, []);

  const toggleMute = useCallback(() => {
    setSfxMuted(!isSfxMuted());
  }, []);

  return { muted, toggleMute };
}
