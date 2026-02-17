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
  const sessionId = useVelyraStore((s) => s.sessionId);
  const remainingMessages = useVelyraStore((s) => s.remainingMessages);
  const speakText = useVelyraStore((s) => s.speakText);
  const stopSpeakingAction = useVelyraStore((s) => s.stopSpeakingAction);
  const setSpeaking = useVelyraStore((s) => s.setSpeaking);
  const hasGreeted = useRef(false);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const voicePlayerRef = useRef<ReturnType<typeof createVoicePlayer> | null>(null);
  const getVoicePlayer = useCallback(() => {
    if (!voicePlayerRef.current) {
      voicePlayerRef.current = createVoicePlayer(sessionId, {
        onStart: () => {},
        onEnd: () => stopSpeakingAction(),
      });
    }
    return voicePlayerRef.current;
  }, [sessionId, stopSpeakingAction]);

  // Greet on first open — lip sync the greeting text
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      
      // Small delay to ensure frames are loaded
      setTimeout(() => {
        // Start lip sync animation
        speakText(GREETING);
        
        // Simulate speaking duration (no audio in muted mode)
        const duration = Math.max(3000, GREETING.length * 60);
        setTimeout(() => stopSpeakingAction(), duration);
      }, 300);
    }
  }, [isOpen, speakText, stopSpeakingAction]);

  const handleToggleMute = useCallback(() => {
    const wasMuted = isMutedRef.current;
    useVelyraStore.getState().toggleMute();

    if (wasMuted) {
      // Unmuting — play current caption with voice
      const caption = useVelyraStore.getState().currentCaption;
      if (caption) {
        speakText(caption);
        getVoicePlayer().play(caption);
      }
    } else {
      // Muting — stop everything
      getVoicePlayer().stop();
      stopSpeakingAction();
    }
  }, [getVoicePlayer, speakText, stopSpeakingAction]);

  const handleClose = useCallback(() => {
    voicePlayerRef.current?.stop();
    close();
  }, [close]);

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
            {/* Controls */}
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

            {/* Avatar */}
            <AvatarDisplay />

            {/* Captions */}
            <div className="mt-2 w-full">
              <Captions />
            </div>

            {/* Remaining */}
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
