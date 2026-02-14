"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import AvatarDisplay from "./AvatarDisplay";
import Captions from "./Captions";
import InputBar from "./InputBar";
import { createVoicePlayer } from "@/lib/voice-playback";

const GREETING = "Hey there! I'm Velyra, your AI concierge. What can I help you with?";

export default function AvatarModal() {
  const isOpen = useVelyraStore((s) => s.isOpen);
  const isMuted = useVelyraStore((s) => s.isMuted);
  const close = useVelyraStore((s) => s.close);
  const toggleMute = useVelyraStore((s) => s.toggleMute);
  const setCaption = useVelyraStore((s) => s.setCaption);
  const setSpeaking = useVelyraStore((s) => s.setSpeaking);
  const sessionId = useVelyraStore((s) => s.sessionId);
  const remainingMessages = useVelyraStore((s) => s.remainingMessages);
  const hasGreeted = useRef(false);

  const voicePlayerRef = useRef<ReturnType<typeof createVoicePlayer> | null>(null);
  function getVoicePlayer() {
    if (!voicePlayerRef.current) {
      voicePlayerRef.current = createVoicePlayer(sessionId, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      });
    }
    return voicePlayerRef.current;
  }

  // Auto-greet on first open
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      setCaption(GREETING);
      // Play greeting voice if not muted
      if (!isMuted) {
        getVoicePlayer().play(GREETING);
      }
    }
  }, [isOpen]);

  // When user unmutes, play the current greeting if it's still showing
  const handleToggleMute = () => {
    const wasMuted = isMuted;
    toggleMute();
    // If unmuting, speak the greeting
    if (wasMuted) {
      getVoicePlayer().play(GREETING);
    } else {
      getVoicePlayer().stop();
      setSpeaking(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed z-[60] bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] pointer-events-none"
        >
          <div className="pointer-events-auto flex flex-col items-center">
            {/* Top controls */}
            <div className="w-full flex justify-between items-center px-4 mb-2">
              {/* Sound toggle */}
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs transition-all ${
                  isMuted
                    ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                    : "bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30"
                }`}
              >
                {isMuted ? "🔇 Muted" : "🔊 Sound On"}
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  voicePlayerRef.current?.stop();
                  setSpeaking(false);
                  close();
                }}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Avatar */}
            <div className="w-60 h-72 sm:w-64 sm:h-80 mb-1">
              <AvatarDisplay />
            </div>

            {/* Captions */}
            <Captions />

            {/* Remaining messages */}
            {remainingMessages <= 10 && (
              <div className="text-[10px] text-white/30 mb-1">
                {remainingMessages} messages remaining
              </div>
            )}

            {/* Input */}
            <div className="w-full px-4 pb-4 sm:pb-0">
              <InputBar />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
