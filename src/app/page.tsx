"use client";

import LampTrigger from "@/components/LampTrigger";
import AvatarModal from "@/components/AvatarModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white/80">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Velyra
          </h1>
          <p className="text-lg text-white/50">
            Click the lamp to summon your AI concierge
          </p>
        </div>
      </div>
      <LampTrigger />
      <AvatarModal />
    </div>
  );
}
