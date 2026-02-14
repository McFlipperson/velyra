"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";
import AvatarDisplay from "./AvatarDisplay";
import Captions from "./Captions";
import InputBar from "./InputBar";
import { createVoicePlayer } from "@/lib/voice-playback";

const GREETING =
  "Hey there! I'm Velyra, your AI concierge. What can I help you with?";

export default function AvatarModal() {
  const isOpen = useVelyraStore((s) => s.isOpen);
  const isMuted = useVelyraStore((s) => s.isMuted);
  const close = useVelyraStore((s) => s.close);
  const setCaption = useVelyraStore((s) => s.setCaption);
  const setSpeaking = useVelyraStore((s) => s.setSpeaking);
  const sessionId = useVelyraStore((s) => s.sessionId);
  const remainingMessages = useVelyraStore((s) => s.remainingMessages);
  const hasGreeted = useRef(false);

  // Stable ref for muted state so voice player can check current value
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const voicePlayerRef = useRef<ReturnType<typeof createVoicePlayer> | null>(
    null
  );
  const getVoicePlayer = useCallback(() => {
    if (!voicePlayerRef.current) {
      voicePlayerRef.current = createVoicePlayer(sessionId, {
        onStart: () => setSpeaking(true),
        onEnd: () => setSpeaking(false),
      });
    }
    return voicePlayerRef.current;
  }, [sessionId, setSpeaking]);

  // Greet on first open
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      setCaption(GREETING);
      // Don't auto-play voice — user needs to unmute first (browser policy)
    }
  }, [isOpen, setCaption]);

  // Toggle mute via store directly
  const handleToggleMute = useCallback(() => {
    const wasMuted = isMutedRef.current;
    // Toggle in store
    useVelyraStore.getState().toggleMute();

    if (wasMuted) {
      // Was muted, now unmuting — play greeting or current caption
      const caption = useVelyraStore.getState().currentCaption;
      if (caption) {
        getVoicePlayer().play(caption);
      }
    } else {
      // Was unmuted, now muting — stop audio
      getVoicePlayer().stop();
      setSpeaking(false);
    }
  }, [getVoicePlayer, setSpeaking]);

  const handleClose = useCallback(() => {
    voicePlayerRef.current?.stop();
    setSpeaking(false);
    close();
  }, [close, setSpeaking]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed z-[60] bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[420px] pointer-events-none"
        >
          <div className="pointer-events-auto flex flex-col items-center pb-4 sm:pb-0">
            {/* Top controls */}
            <div className="w-full flex justify-between items-center px-4 mb-3">
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium transition-all active:scale-95 ${
                  isMuted
                    ? "bg-white/10 text-white/50 border border-white/10 hover:bg-white/20"
                    : "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                }`}
              >
                {isMuted ? "🔇 Tap to unmute" : "🔊 Sound on"}
              </button>

              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all active:scale-90"
              >
                ✕
              </button>
            </div>

            {/* Avatar — fixed size, centered */}
            <AvatarDisplay />

            {/* Captions */}
            <div className="mt-2 w-full">
              <Captions />
            </div>

            {/* Remaining messages */}
            {remainingMessages <= 10 && (
              <div className="text-[10px] text-white/30 mt-1">
                {remainingMessages} messages remaining
              </div>
            )}

            {/* Input */}
            <div className="w-full px-4 mt-2">
              <InputBar />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
