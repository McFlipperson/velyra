/**
 * Avatar animation engine v5 — Rhubarb timestamp-based lip sync
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

// ── Rhubarb frame paths (A-H + extended X, G) ──────────────────
const FRAMES = {
  A: "/avatars/default/A.png",  // Rest
  B: "/avatars/default/B.png",  // M, B, P
  C: "/avatars/default/C.png",  // E, I
  D: "/avatars/default/D.png",  // A, AI
  E: "/avatars/default/E.png",  // O
  F: "/avatars/default/F.png",  // U, OO
  G: "/avatars/default/G.png",  // F, V
  H: "/avatars/default/H.png",  // L, TH, N
  X: "/avatars/default/A.png",  // Extended rest (fallback to A)
} as const;

type MouthCue = {
  start: number;
  end: number;
  value: keyof typeof FRAMES;
};

// ── Playback state ─────────────────────────────────────────────
let currentCues: MouthCue[] = [];
let playbackStartTime = 0;
let isPlaying = false;

export function startSpeakingWithCues(cues: MouthCue[]): void {
  console.log('🎬 Starting Rhubarb playback with', cues.length, 'cues');
  console.log('Cues:', cues);
  currentCues = cues;
  playbackStartTime = Date.now();
  isPlaying = true;
}

export function advanceSpeaking(): string {
  if (!isPlaying || currentCues.length === 0) return FRAMES.A;

  const elapsed = (Date.now() - playbackStartTime) / 1000;

  // Find the current cue based on elapsed time
  for (const cue of currentCues) {
    if (elapsed >= cue.start && elapsed < cue.end) {
      const frame = FRAMES[cue.value] || FRAMES.A;
      // console.log(`⏱️ ${elapsed.toFixed(2)}s → ${cue.value} (${frame})`);
      return frame;
    }
  }

  // Past all cues
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
const ALL_FRAMES = Object.values(FRAMES);

export function preloadAvatarFrames(): void {
  const uniqueFrames = [...new Set(ALL_FRAMES)];
  uniqueFrames.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// ── State-based getters ────────────────────────────────────────
export function getIdleFrame(tick: number): string {
  const blinkCycle = 40 + (tick % 10);
  const isBlinking = tick % blinkCycle < 2;
  return isBlinking ? FRAMES.B : FRAMES.A;
}

export function getListeningFrame(tick: number): string {
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
      return getListeningFrame(tick);
    case "thinking":
      return getThinkingFrame(tick);
    case "idle":
    default:
      return getIdleFrame(tick);
  }
}

// Legacy text-based fallback (for when Rhubarb fails)
export function startSpeaking(text: string): void {
  // Simple fallback - just alternate between a few shapes
  const duration = Math.max(2000, text.length * 50);
  const shapes: Array<keyof typeof FRAMES> = ['A', 'D', 'C', 'E', 'B', 'A'];
  const cueLength = duration / shapes.length / 1000;
  
  const fallbackCues: MouthCue[] = shapes.map((shape, i) => ({
    start: i * cueLength,
    end: (i + 1) * cueLength,
    value: shape,
  }));
  
  startSpeakingWithCues(fallbackCues);
}
