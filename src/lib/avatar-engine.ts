/**
 * Avatar animation engine v4 — Rhubarb 8-frame lip sync
 * Using Preston Blair phoneme set (A-H)
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

// ── Rhubarb frame paths (A-H) ──────────────────────────────────
const FRAMES = {
  A: "/avatars/default/A.png",  // Rest position
  B: "/avatars/default/B.png",  // M, B, P
  C: "/avatars/default/C.png",  // E, I (wide smile)
  D: "/avatars/default/D.png",  // A, AI (jaw dropped)
  E: "/avatars/default/E.png",  // O
  F: "/avatars/default/F.png",  // U, OO (pucker)
  G: "/avatars/default/G.png",  // F, V
  H: "/avatars/default/H.png",  // L, TH, N
} as const;

const PHONEME_DURATION_MS = 150;
const PAUSE_DURATION_MS = 120;

// ── Simple text-to-phoneme mapper ─────────────────────────────
export function textToPhonemes(text: string): Array<{ frame: string; duration: number }> {
  const sequence: Array<{ frame: string; duration: number }> = [];
  const lower = text.toLowerCase();
  let i = 0;

  while (i < lower.length) {
    const ch = lower[i];
    const next = lower[i + 1] || "";
    const pair = ch + next;

    // Skip non-letters
    if (!/[a-z]/.test(ch)) {
      if (ch === " " || ch === "," || ch === "." || ch === "!" || ch === "?") {
        sequence.push({ frame: FRAMES.A, duration: PAUSE_DURATION_MS });
      }
      i++;
      continue;
    }

    // Two-letter patterns
    if (pair === "th") {
      sequence.push({ frame: FRAMES.H, duration: PHONEME_DURATION_MS });
      i += 2;
      continue;
    }
    if (pair === "ee" || pair === "ea") {
      sequence.push({ frame: FRAMES.C, duration: PHONEME_DURATION_MS * 1.2 });
      i += 2;
      continue;
    }
    if (pair === "oo" || pair === "ou") {
      sequence.push({ frame: FRAMES.F, duration: PHONEME_DURATION_MS * 1.2 });
      i += 2;
      continue;
    }
    if (pair === "ai" || pair === "ay") {
      sequence.push({ frame: FRAMES.D, duration: PHONEME_DURATION_MS * 1.2 });
      i += 2;
      continue;
    }

    // Single character mapping
    switch (ch) {
      case "a":
        sequence.push({ frame: FRAMES.D, duration: PHONEME_DURATION_MS });
        break;
      case "e":
      case "i":
        sequence.push({ frame: FRAMES.C, duration: PHONEME_DURATION_MS });
        break;
      case "o":
        sequence.push({ frame: FRAMES.E, duration: PHONEME_DURATION_MS });
        break;
      case "u":
        sequence.push({ frame: FRAMES.F, duration: PHONEME_DURATION_MS });
        break;
      case "m":
      case "b":
      case "p":
        sequence.push({ frame: FRAMES.B, duration: PHONEME_DURATION_MS });
        break;
      case "f":
      case "v":
        sequence.push({ frame: FRAMES.G, duration: PHONEME_DURATION_MS });
        break;
      case "l":
      case "n":
        sequence.push({ frame: FRAMES.H, duration: PHONEME_DURATION_MS });
        break;
      case "w":
      case "r":
        sequence.push({ frame: FRAMES.F, duration: PHONEME_DURATION_MS * 0.8 });
        break;
      default:
        // Other consonants → slight open
        sequence.push({ frame: FRAMES.A, duration: PHONEME_DURATION_MS * 0.7 });
        break;
    }
    i++;
  }

  return sequence;
}

// ── Playback state ─────────────────────────────────────────────
let currentSequence: Array<{ frame: string; duration: number }> = [];
let sequenceStartTime = 0;

export function startSpeaking(text: string): void {
  currentSequence = textToPhonemes(text);
  sequenceStartTime = Date.now();
}

export function advanceSpeaking(): string {
  if (currentSequence.length === 0) return FRAMES.A;

  const elapsed = Date.now() - sequenceStartTime;
  let accumulated = 0;

  for (let i = 0; i < currentSequence.length; i++) {
    accumulated += currentSequence[i].duration;
    if (elapsed < accumulated) {
      return currentSequence[i].frame as string;
    }
  }

  return FRAMES.A;
}

export function stopSpeaking(): void {
  currentSequence = [];
}

// ── Preload ────────────────────────────────────────────────────
const ALL_FRAMES = Object.values(FRAMES);

export function preloadAvatarFrames(): void {
  ALL_FRAMES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// ── State-based getters ────────────────────────────────────────
export function getIdleFrame(tick: number): string {
  // Blink occasionally
  const blinkCycle = 40 + (tick % 10);
  const isBlinking = tick % blinkCycle < 2;
  return isBlinking ? FRAMES.B : FRAMES.A;  // Use B (lips closed) for blink
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
