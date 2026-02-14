"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { useEffect, useRef, useState } from "react";
import { getFrameForState, preloadAvatarFrames } from "@/lib/avatar-engine";

export default function AvatarDisplay() {
  const avatarState = useVelyraStore((s) => s.avatarState);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Preload all frames on mount
  useEffect(() => {
    preloadAvatarFrames();
  }, []);

  // Tick at different speeds depending on state
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const speed =
      avatarState === "speaking"
        ? 120 // Fast mouth movement
        : avatarState === "thinking"
        ? 300 // Slow thinking shifts
        : 150; // Normal idle blink rate

    intervalRef.current = setInterval(() => {
      setTick((t) => t + 1);
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [avatarState]);

  const frameSrc = getFrameForState(avatarState, tick);

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />

      {/* Avatar container with breathing animation */}
      <div className="relative animate-[breathe_4s_ease-in-out_infinite]">
        {/* Outer glow — changes by state */}
        <div
          className={`absolute -inset-6 rounded-full blur-2xl transition-all duration-500 ${
            avatarState === "speaking"
              ? "bg-purple-500/25 animate-[pulse_1.2s_ease-in-out_infinite]"
              : avatarState === "listening"
              ? "bg-cyan-400/20 animate-[pulse_2s_ease-in-out_infinite]"
              : avatarState === "thinking"
              ? "bg-amber-400/15 animate-[pulse_1.5s_ease-in-out_infinite]"
              : "bg-purple-500/10"
          }`}
        />

        {/* Avatar image */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
          <img
            src={frameSrc}
            alt="Velyra"
            className="w-full h-full object-cover object-top"
            draggable={false}
          />
        </div>

        {/* State indicator dot */}
        <div
          className={`absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-[#0d1b2a] transition-colors duration-300 ${
            avatarState === "speaking"
              ? "bg-green-400 animate-pulse"
              : avatarState === "listening"
              ? "bg-cyan-400 animate-pulse"
              : avatarState === "thinking"
              ? "bg-amber-400 animate-pulse"
              : "bg-gray-500"
          }`}
        />
      </div>
    </div>
  );
}
