"use client";

import { create } from "zustand";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface VelyraStore {
  // Core UI
  isOpen: boolean;
  isMuted: boolean;

  // Interaction states
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  isLoading: boolean;

  // Avatar
  avatarState: AvatarState;

  // Captions
  currentCaption: string | null;

  // Session
  sessionId: string;
  remainingMessages: number;

  // Actions
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
}

export const useVelyraStore = create<VelyraStore>((set) => ({
  // Core UI
  isOpen: false,
  isMuted: true, // Start muted for mobile autoplay compliance

  // Interaction states
  isListening: false,
  isSpeaking: false,
  isThinking: false,
  isLoading: false,

  // Avatar
  avatarState: "idle",

  // Captions
  currentCaption: null,

  // Session
  sessionId: `velyra-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  remainingMessages: 50,

  // Actions
  open: () => set({ isOpen: true }),
  close: () =>
    set({
      isOpen: false,
      currentCaption: null,
      avatarState: "idle",
    }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setAvatarState: (avatarState) => set({ avatarState }),
  setCaption: (currentCaption) => set({ currentCaption }),
  clearCaption: () => set({ currentCaption: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setSpeaking: (isSpeaking) =>
    set({ isSpeaking, avatarState: isSpeaking ? "speaking" : "idle" }),
  setListening: (isListening) =>
    set({ isListening, avatarState: isListening ? "listening" : "idle" }),
  setThinking: (isThinking) =>
    set({ isThinking, avatarState: isThinking ? "thinking" : "idle" }),
  setRemainingMessages: (remainingMessages) => set({ remainingMessages }),
}));
