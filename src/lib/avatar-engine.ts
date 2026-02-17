/**
 * Avatar animation engine v6 — Rhubarb 6-shape lip sync (A-F basic set)
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

// ── Rhubarb frame paths (basic A-F set) ────────────────────────
// Maps all possible Rhubarb outputs to our 6 basic frames
const FRAMES: Record<string, string> = {
  A: "/avatars/default/A.png",  // Closed mouth (P, B, M)
  B: "/avatars/default/B.png",  // Barely parted, teeth hint (consonants, EE)
  C: "/avatars/default/C.png",  // Slightly open (EH, AE)
  D: "/avatars/default/D.png",  // Open wider (AA, AH)
  E: "/avatars/default/E.png",  // Rounded (AO, ER, OH)
  F: "/avatars/default/F.png",  // Pursed (UW, OW, OO)
  // Extended shapes mapped to nearest basic shape
  G: "/avatars/default/B.png",  // F/V sounds → use B (teeth visible)
  H: "/avatars/default/C.png",  // L/TH sounds → use C (open mouth)
  X: "/avatars/default/A.png",  // Rest/silence → use A (closed)
};

type MouthCue = {
  start: number;
  end: number;
  value: string;
};

// ── Playback state ─────────────────────────────────────────────
let currentCues: MouthCue[] = [];
let playbackStartTime = 0;
let isPlaying = false;

export function startSpeakingWithCues(cues: MouthCue[]): void {
  currentCues = cues;
  playbackStartTime = Date.now();
  isPlaying = true;
}

export function advanceSpeaking(): string {
  if (!isPlaying || currentCues.length === 0) return FRAMES.A;

  const elapsed = (Date.now() - playbackStartTime) / 1000;

  for (const cue of currentCues) {
    if (elapsed >= cue.start && elapsed < cue.end) {
      return FRAMES[cue.value] || FRAMES.A;
    }
  }

  return FRAMES.A;
}

export function stopSpeaking(): void {
  currentCues = [];
  isPlaying = false;
}

export function isSpeakingActive(): boolean {
  if (!isPlaying) return false;
  const elapsed = (Date.now() - playbackStartTime) / 1000;
  const lastCue = currentCues[currentCues.length - 1];
  return !lastCue || elapsed < lastCue.end;
}

// ── Preload ────────────────────────────────────────────────────
export function preloadAvatarFrames(): void {
  const uniqueFrames = [...new Set(Object.values(FRAMES))];
  uniqueFrames.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// ── State-based getters ────────────────────────────────────────
export function getIdleFrame(tick: number): string {
  // Subtle blink: occasionally show B (barely parted) 
  const blinkCycle = 40 + (tick % 10);
  const isBlinking = tick % blinkCycle < 2;
  return isBlinking ? FRAMES.B : FRAMES.A;
}

export function getListeningFrame(): string {
  return FRAMES.A;
}

export function getThinkingFrame(tick: number): string {
  const phase = tick % 40;
  return phase < 20 ? FRAMES.A : FRAMES.E;
}

export function getFrameForState(state: AvatarState, tick: number): string {
  switch (state) {
    case "speaking":
      return advanceSpeaking();
    case "listening":
      return getListeningFrame();
    case "thinking":
      return getThinkingFrame(tick);
    case "idle":
    default:
      return getIdleFrame(tick);
  }
}

// Legacy text-based fallback
export function startSpeaking(text: string): void {
  const duration = Math.max(2000, text.length * 50);
  const shapes = ['A', 'C', 'D', 'C', 'E', 'B', 'A'];
  const cueLength = duration / shapes.length / 1000;
  
  const fallbackCues: MouthCue[] = shapes.map((shape, i) => ({
    start: i * cueLength,
    end: (i + 1) * cueLength,
    value: shape,
  }));
  
  startSpeakingWithCues(fallbackCues);
}
