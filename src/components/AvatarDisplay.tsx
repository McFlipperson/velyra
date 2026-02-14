"use client";

import { useVelyraStore } from "@/store/velyra-store";

export default function AvatarDisplay() {
  const avatarState = useVelyraStore((s) => s.avatarState);

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/30 via-transparent to-transparent" />

      {/* Avatar container with breathing animation */}
      <div className="relative animate-[breathe_4s_ease-in-out_infinite]">
        {/* Outer glow ring - pulses when speaking */}
        <div
          className={`absolute -inset-4 rounded-full blur-2xl transition-all duration-500 ${
            avatarState === "speaking"
              ? "bg-purple-500/30 animate-[pulse_1.2s_ease-in-out_infinite]"
              : avatarState === "listening"
              ? "bg-cyan-400/20 animate-[pulse_2s_ease-in-out_infinite]"
              : avatarState === "thinking"
              ? "bg-amber-400/20 animate-[pulse_1.5s_ease-in-out_infinite]"
              : "bg-purple-500/10"
          }`}
        />

        {/* Avatar frame */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
          {/* Placeholder — will be replaced with sprite frames in Phase 3 */}
          <div className="w-full h-full bg-gradient-to-br from-[#1a0533] to-[#0d1b2a] flex items-center justify-center">
            <span className="text-7xl">🧞‍♀️</span>
          </div>
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
