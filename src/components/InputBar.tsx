"use client";

import { useVelyraStore } from "@/store/velyra-store";
import { motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect, FormEvent } from "react";
import { createVoicePlayer } from "@/lib/voice-playback";
import { createSpeechRecognizer, isSupported as isSpeechSupported } from "@/lib/speech-recognition";

export default function InputBar() {
  const {
    sessionId,
    isMuted,
    isLoading,
    setLoading,
    setCaption,
    setSpeaking,
    setThinking,
    setListening,
    setRemainingMessages,
  } = useVelyraStore();

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Array<{ role: string; content: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMicHeld, setIsMicHeld] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  // Voice player (lazy init)
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

  // Speech recognizer (lazy init)
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);

  useEffect(() => {
    setMicSupported(isSpeechSupported());
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      setLoading(true);
      setThinking(true);
      setCaption(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history: history.slice(-10),
            sessionId,
          }),
        });

        const data = await response.json();

        setHistory((prev) => [
          ...prev,
          { role: "user", content: text.trim() },
          { role: "assistant", content: data.reply },
        ]);

        setCaption(data.reply);

        if (data.remainingMessages !== undefined) {
          setRemainingMessages(data.remainingMessages);
        }

        if (!isMuted && !data.rateLimited) {
          getVoicePlayer().play(data.reply);
        }
      } catch {
        setCaption("Something went wrong — please try again.");
      } finally {
        setLoading(false);
        setThinking(false);
      }
    },
    [isLoading, history, sessionId, isMuted, setLoading, setThinking, setCaption, setSpeaking, setRemainingMessages]
  );

  const handleSend = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      sendMessage(input);
      setInput("");
    },
    [input, sendMessage]
  );

  // Mic hold handlers
  const handleMicDown = useCallback(() => {
    if (!micSupported || isLoading) return;
    setIsMicHeld(true);
    setListening(true);

    if (!recognizerRef.current) {
      recognizerRef.current = createSpeechRecognizer({
        onResult: (transcript) => {
          setIsMicHeld(false);
          setListening(false);
          sendMessage(transcript);
        },
        onEnd: () => {
          setIsMicHeld(false);
          setListening(false);
        },
        onError: () => {
          setIsMicHeld(false);
          setListening(false);
        },
      });
    }
    recognizerRef.current.start();
  }, [micSupported, isLoading, setListening, sendMessage]);

  const handleMicUp = useCallback(() => {
    setIsMicHeld(false);
    setListening(false);
    recognizerRef.current?.stop();
  }, [setListening]);

  return (
    <form onSubmit={handleSend} className="relative w-full z-10">
      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-2">
        {/* Mic button */}
        {micSupported && (
          <button
            type="button"
            onPointerDown={handleMicDown}
            onPointerUp={handleMicUp}
            onPointerLeave={handleMicUp}
            disabled={isLoading}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isMicHeld
                ? "bg-red-500/80 scale-110"
                : "bg-white/10 hover:bg-white/20"
            } disabled:opacity-30`}
          >
            {isMicHeld ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="w-3 h-3 rounded-full bg-white"
              />
            ) : (
              <svg
                className="w-4 h-4 text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            )}
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isMicHeld
              ? "Listening..."
              : isLoading
              ? "Thinking..."
              : "Ask me anything..."
          }
          disabled={isLoading || isMicHeld}
          className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none min-w-0"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center transition-all duration-200 disabled:opacity-30 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]"
        >
          <svg
            className="w-4 h-4 text-white ml-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
            />
          </svg>
        </button>
      </div>

      {/* Loading dots */}
      {isLoading && (
        <div className="flex justify-center gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-purple-400/60"
            />
          ))}
        </div>
      )}
    </form>
  );
}
