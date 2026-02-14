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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed z-[51] bottom-0 left-0 right-0 h-[70vh] sm:bottom-6 sm:right-6 sm:left-auto sm:w-[500px] sm:h-[700px] sm:rounded-2xl rounded-t-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#0d0521] via-[#0d1b2a] to-[#0a0a1a] shadow-[0_-10px_60px_rgba(0,0,0,0.5)]"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
              {/* Mute toggle */}
              <button
                onClick={toggleMute}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs text-white/70 hover:text-white hover:bg-white/20 transition-all"
              >
                {isMuted ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    Tap to unmute
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                    Sound on
                  </>
                )}
              </button>

              {/* Close */}
              <button
                onClick={close}
                className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Avatar area (top 55%) */}
            <div className="h-[55%] relative">
              <AvatarDisplay />
            </div>

            {/* Captions area */}
            <Captions />

            {/* Remaining messages warning */}
            {remainingMessages <= 10 && (
              <div className="text-center text-[10px] text-white/30 py-1">
                {remainingMessages} messages remaining
              </div>
            )}

            {/* Input bar */}
            <InputBar />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
