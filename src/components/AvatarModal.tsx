"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion, AnimatePresence } from "framer-motion";
import AvatarDisplay from "./AvatarDisplay";
import Captions from "./Captions";
import InputBar from "./InputBar";

export default function AvatarModal() {
  const isOpen = useVelyraStore((s) => s.isOpen);
  const isMuted = useVelyraStore((s) => s.isMuted);
  const close = useVelyraStore((s) => s.close);
  const toggleMute = useVelyraStore((s) => s.toggleMute);
  const remainingMessages = useVelyraStore((s) => s.remainingMessages);

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
            {/* Close button — floating top-right */}
            <div className="w-full flex justify-end px-4 mb-2">
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Avatar — floating, no container */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 mb-2">
              <AvatarDisplay />
            </div>

            {/* Captions — floating over site */}
            <Captions />

            {/* Mute toggle — small pill */}
            <button
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm text-[11px] text-white/60 hover:text-white hover:bg-black/50 transition-all mb-2"
            >
              {isMuted ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  Tap to unmute
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  Sound on
                </>
              )}
            </button>

            {/* Remaining messages warning */}
            {remainingMessages <= 10 && (
              <div className="text-[10px] text-white/30 mb-1">
                {remainingMessages} messages remaining
              </div>
            )}

            {/* Input bar — single line at bottom */}
            <div className="w-full px-4 pb-4 sm:pb-0">
              <InputBar />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
