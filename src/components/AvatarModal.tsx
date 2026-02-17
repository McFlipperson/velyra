"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";
import AvatarDisplay from "./AvatarDisplay";
import Captions from "./Captions";
import InputBar from "./InputBar";
import { startSpeakingWithCues } from "@/lib/avatar-engine";

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
  const hasGreeted = useRef(false);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  // Greet on first open — use Rhubarb lip sync
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      
      setTimeout(async () => {
        // Show thinking state while API processes
        useVelyraStore.setState({ avatarState: "thinking" });
        
        try {
          const lipsyncResponse = await fetch("/api/lipsync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: GREETING, sessionId }),
          });

          const lipsyncData = await lipsyncResponse.json();

          if (lipsyncData.cues && lipsyncData.cues.length > 0) {
            // Caption appears NOW — when audio is ready, not before
            useVelyraStore.setState({ currentCaption: GREETING });
            startSpeakingWithCues(lipsyncData.cues);
            useVelyraStore.setState({ isSpeaking: true, avatarState: "speaking" });

            if (!isMutedRef.current && lipsyncData.audio) {
              const audioBlob = new Blob(
                [Uint8Array.from(atob(lipsyncData.audio), c => c.charCodeAt(0))],
                { type: "audio/mpeg" }
              );
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);
              
              audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                stopSpeakingAction();
              };
              
              audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                stopSpeakingAction();
              };
              
              audio.play().catch(() => {
                // Browser blocked autoplay — animate silently
                const duration = (lipsyncData.duration || 3) * 1000;
                setTimeout(() => stopSpeakingAction(), duration);
              });
            } else {
              const duration = (lipsyncData.duration || 3) * 1000;
              setTimeout(() => stopSpeakingAction(), duration);
            }
          } else {
            speakText(GREETING);
            setTimeout(() => stopSpeakingAction(), 3000);
          }
        } catch {
          speakText(GREETING);
          setTimeout(() => stopSpeakingAction(), 3000);
        }
      }, 300);
    }
  }, [isOpen, sessionId, speakText, stopSpeakingAction]);

  const handleToggleMute = useCallback(() => {
    useVelyraStore.getState().toggleMute();
  }, []);

  const handleClose = useCallback(() => {
    stopSpeakingAction();
    close();
  }, [close, stopSpeakingAction]);

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

            <AvatarDisplay />

            <div className="mt-2 w-full">
              <Captions />
            </div>

            {remainingMessages <= 10 && (
              <div className="text-[10px] text-white/30 mt-1">
                {remainingMessages} messages remaining
              </div>
            )}

            <div className="w-full px-4 mt-2">
              <InputBar />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
