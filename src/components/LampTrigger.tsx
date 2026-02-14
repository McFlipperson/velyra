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
      className="fixed bottom-4 right-4 z-[60]"
    >
      <button
        onClick={handleClick}
        className="group relative block w-24 h-16 focus:outline-none animate-[wobble_3s_ease-in-out_infinite]"
        aria-label="Open Velyra"
      >
        {/* Glow */}
        <div className="absolute inset-0 blur-xl bg-purple-500/20 group-hover:bg-purple-500/40 rounded-full transition-all duration-300" />

        {/* Lamp image */}
        <img
          src="/lamp.png"
          alt="Genie Lamp"
          className="relative w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.8)] transition-all duration-300"
        />

        {/* Smoke particles */}
        {isSmoke && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.8, scale: 0.3, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1.5,
                  x: (Math.random() - 0.5) * 120,
                  y: -40 - Math.random() * 80,
                }}
                transition={{ duration: 0.4 + Math.random() * 0.2, ease: "easeOut" }}
                className="absolute top-1/4 left-1/4 w-6 h-6 rounded-full bg-cyan-400/60 blur-sm"
              />
            ))}
          </div>
        )}
      </button>
    </motion.div>
  );
}
