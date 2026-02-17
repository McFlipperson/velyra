"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { useEffect, useRef, useState } from "react";
import { getFrameForState, preloadAvatarFrames } from "@/lib/avatar-engine";

export default function AvatarDisplay() {
  const avatarState = useVelyraStore((s) => s.avatarState);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentFrame, setCurrentFrame] = useState("/avatars/default/idle.png");

  useEffect(() => {
    preloadAvatarFrames();
  }, []);

  // Tick loop — faster when speaking for smooth lip sync
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Speaking uses time-based viseme lookup (not tick-based), 
    // so we tick fast to keep it responsive
    const speed =
      avatarState === "speaking"
        ? 60   // 60ms = ~16fps lip sync
        : avatarState === "thinking"
        ? 300
        : 150;

    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [avatarState]);

  // Update frame on tick
  useEffect(() => {
    const frame = getFrameForState(avatarState, tick);
    setCurrentFrame(frame);
  }, [tick, avatarState]);

  return (
    <div className="relative w-[260px] h-[260px] flex-shrink-0">
      {/* Glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${
          avatarState === "speaking"
            ? "bg-purple-500/20"
            : avatarState === "listening"
            ? "bg-cyan-400/15"
            : avatarState === "thinking"
            ? "bg-amber-400/10"
            : "bg-purple-500/10"
        }`}
      />

      {/* Fixed container — image swaps inside, no layout shift */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src={currentFrame}
          alt="Velyra"
          width={260}
          height={260}
          className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.25)] pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {/* State dot */}
      <div
        className={`absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
          avatarState === "speaking"
            ? "bg-green-400 animate-pulse"
            : avatarState === "listening"
            ? "bg-cyan-400 animate-pulse"
            : avatarState === "thinking"
            ? "bg-amber-400 animate-pulse"
            : "bg-white/20"
        }`}
      />
    </div>
  );
}
