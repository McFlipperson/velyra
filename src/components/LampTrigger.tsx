"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion } from "framer-motion";
import { useState } from "react";

export default function LampTrigger() {
  const open = useVelyraStore((s) => s.open);
  const isOpen = useVelyraStore((s) => s.isOpen);
  const [isSmoke, setIsSmoke] = useState(false);

  const handleClick = () => {
    if (isOpen) return;
    setIsSmoke(true);
    setTimeout(() => {
      setIsSmoke(false);
      open();
    }, 450);
  };

  if (isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 right-6 z-[60]"
    >
      <button
        onClick={handleClick}
        className="group relative block w-20 h-20 focus:outline-none"
        aria-label="Open Velyra"
      >
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-400/40 blur-xl group-hover:blur-2xl transition-all duration-300 animate-pulse" />

        {/* Lamp body */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-[#1a0533] to-[#0d1b2a] border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-shadow duration-300 animate-[wobble_3s_ease-in-out_infinite]">
          <span className="text-4xl drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">🪔</span>
        </div>

        {/* Smoke particles */}
        {isSmoke && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0.8,
                  scale: 0.3,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: 0,
                  scale: 1.5,
                  x: (Math.random() - 0.5) * 120,
                  y: -40 - Math.random() * 80,
                }}
                transition={{
                  duration: 0.4 + Math.random() * 0.2,
                  ease: "easeOut",
                }}
                className="absolute top-1/2 left-1/2 w-6 h-6 -ml-3 -mt-3 rounded-full bg-purple-400/60 blur-sm"
              />
            ))}
          </div>
        )}
      </button>
    </motion.div>
  );
}
