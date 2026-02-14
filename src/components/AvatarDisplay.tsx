"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { useEffect, useRef, useState } from "react";
import { getFrameForState, preloadAvatarFrames } from "@/lib/avatar-engine";

export default function AvatarDisplay() {
  const avatarState = useVelyraStore((s) => s.avatarState);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    preloadAvatarFrames();
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const speed =
      avatarState === "speaking"
        ? 140
        : avatarState === "thinking"
        ? 400
        : 200;

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
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-transparent to-transparent" />

      {/* Avatar with breathing */}
      <div className="relative animate-[breathe_4s_ease-in-out_infinite]">
        {/* State glow ring */}
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

        {/* Avatar image — contain, not cover. No cropping. */}
        <div className="relative w-52 h-64 sm:w-60 sm:h-72 flex items-center justify-center">
          <img
            src={frameSrc}
            alt="Velyra"
            className="max-w-full max-h-full object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            draggable={false}
          />
        </div>

        {/* State dot */}
        <div
          className={`absolute bottom-1 right-4 w-3 h-3 rounded-full border-2 border-transparent transition-colors duration-300 ${
            avatarState === "speaking"
              ? "bg-green-400 animate-pulse"
              : avatarState === "listening"
              ? "bg-cyan-400 animate-pulse"
              : avatarState === "thinking"
              ? "bg-amber-400 animate-pulse"
              : "bg-gray-500/50"
          }`}
        />
      </div>
    </div>
  );
}
