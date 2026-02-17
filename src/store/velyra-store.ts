"use client";

import { create } from "zustand";
import { startSpeaking, stopSpeaking } from "@/lib/avatar-engine";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface VelyraStore {
  isOpen: boolean;
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isLoading: boolean;
  avatarState: AvatarState;
  currentCaption: string | null;
  sessionId: string;
  remainingMessages: number;

  open: () => void;
  close: () => void;
  toggleMute: () => void;
  setAvatarState: (state: AvatarState) => void;
  setCaption: (caption: string | null) => void;
  clearCaption: () => void;
  setLoading: (loading: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setListening: (listening: boolean) => void;
  setThinking: (thinking: boolean) => void;
  setRemainingMessages: (count: number) => void;
  // New: start speaking with text for lip sync
  speakText: (text: string) => void;
  stopSpeakingAction: () => void;
}

export const useVelyraStore = create<VelyraStore>((set) => ({
  isOpen: false,
  isMuted: false,  // Start unmuted so audio plays by default
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  isLoading: false,
  avatarState: "idle",
  currentCaption: null,
  sessionId: `velyra-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  remainingMessages: 50,

  open: () => set({ isOpen: true }),
  close: () => {
    stopSpeaking();
    set({ isOpen: false, currentCaption: null, avatarState: "idle", isSpeaking: false });
  },
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setAvatarState: (avatarState) => set({ avatarState }),
  setCaption: (currentCaption) => set({ currentCaption }),
  clearCaption: () => set({ currentCaption: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setSpeaking: (isSpeaking) => {
    if (!isSpeaking) stopSpeaking();
    set({ isSpeaking, avatarState: isSpeaking ? "speaking" : "idle" });
  },
  setListening: (isListening) =>
    set({ isListening, avatarState: isListening ? "listening" : "idle" }),
  setThinking: (isThinking) =>
    set({ isThinking, avatarState: isThinking ? "thinking" : "idle" }),
  setRemainingMessages: (remainingMessages) => set({ remainingMessages }),

  // Start lip sync from text
  speakText: (text: string) => {
    startSpeaking(text);
    set({ isSpeaking: true, avatarState: "speaking", currentCaption: text });
  },
  stopSpeakingAction: () => {
    stopSpeaking();
    set({ isSpeaking: false, avatarState: "idle" });
  },
}));
