"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function Captions() {
  const currentCaption = useVelyraStore((s) => s.currentCaption);
  const isSpeaking = useVelyraStore((s) => s.isSpeaking);
  const [displayedCaption, setDisplayedCaption] = useState<string | null>(null);
  const [captionKey, setCaptionKey] = useState(0);

  useEffect(() => {
    if (currentCaption) {
      setDisplayedCaption(currentCaption);
      setCaptionKey((k) => k + 1);
    }
  }, [currentCaption]);

  // Auto-fade after 8 seconds, but NOT while speaking
  useEffect(() => {
    if (!displayedCaption || isSpeaking) return;
    const timer = setTimeout(() => {
      setDisplayedCaption(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [displayedCaption, captionKey, isSpeaking]);

  return (
    <div className="relative w-full px-6 min-h-[3.5rem] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {displayedCaption && (
          <motion.div
            key={captionKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="text-center"
          >
            <p className="inline-block text-sm leading-relaxed text-white/90 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5 max-w-full shadow-lg">
              {displayedCaption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
