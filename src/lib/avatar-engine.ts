/**
 * Avatar animation engine v2 — text-driven viseme lip sync.
 *
 * Instead of random mouth cycling, we map the actual response text
 * to phoneme groups (visemes) and play them in sequence timed to
 * approximate natural speech rhythm.
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

// ── Frame paths ────────────────────────────────────────────────
const FRAMES = {
  // Idle / expressions
  idle: "/avatars/default/idle.png",
  neutral: "/avatars/default/neutral.png",
  blink: "/avatars/default/blink.png",
  happy: "/avatars/default/happy.png",
  smirk: "/avatars/default/smirk.png",
  serious: "/avatars/default/serious.png",
  thinking: "/avatars/default/thinking.png",
  lookingAway: "/avatars/default/looking-away.png",
  surprised: "/avatars/default/surprised.png",
  // Viseme mouth shapes
  mouthAh: "/avatars/default/mouth-ah.png",       // A, I — wide open
  mouthOh: "/avatars/default/mouth-oh.png",        // O, U — rounded
  mouthFv: "/avatars/default/mouth-fv.png",        // F, V — lip tucked
  lipsClosed: "/avatars/default/lips-closed.png",   // M, B, P — lips pressed
  talking: "/avatars/default/talking.png",           // E, schwa — mid open
  smileTeeth: "/avatars/default/smile-teeth.png",   // EE, big smile
  smileLight: "/avatars/default/smile-light.png",   // soft consonants, rest
} as const;

// ── Viseme definitions ─────────────────────────────────────────
// Map character sequences to mouth shapes (simplified English phoneme groups)
type Viseme = keyof typeof VISEME_MAP;

const VISEME_MAP = {
  // Wide open mouth — "ah", "ai", "ay"
  AH: FRAMES.mouthAh,
  // Rounded mouth — "oh", "oo", "ow", "u"
  OH: FRAMES.mouthOh,
  // Teeth/smile — "ee", "ea", "i" (long)
  EE: FRAMES.smileTeeth,
  // Mid open — "eh", "e" (short), schwa sounds
  EH: FRAMES.talking,
  // Lip tucked — "f", "v"
  FV: FRAMES.mouthFv,
  // Lips pressed — "m", "b", "p"
  MBP: FRAMES.lipsClosed,
  // Soft/neutral — "t", "d", "n", "l", "s", "z", "th"
  REST: FRAMES.smileLight,
  // Closed rest between words
  CLOSED: FRAMES.neutral,
} as const;

// ── Text to viseme sequence ────────────────────────────────────
// Approximate duration per viseme in ms (natural speech ~150ms per phoneme)
const VISEME_DURATION_MS = 120;
const PAUSE_DURATION_MS = 80; // Between words

/**
 * Convert text to a sequence of visemes with timing.
 * This is a simplified English text-to-viseme mapper.
 */
export function textToVisemes(text: string): Array<{ frame: string; duration: number }> {
  const sequence: Array<{ frame: string; duration: number }> = [];
  const lower = text.toLowerCase();
  let i = 0;

  while (i < lower.length) {
    const ch = lower[i];
    const next = lower[i + 1] || "";
    const pair = ch + next;

    // Skip non-alpha
    if (!/[a-z]/.test(ch)) {
      if (ch === " " || ch === "," || ch === "." || ch === "!" || ch === "?") {
        // Pause — close mouth briefly
        const pauseLen = (ch === " ") ? PAUSE_DURATION_MS : PAUSE_DURATION_MS * 2;
        sequence.push({ frame: VISEME_MAP.CLOSED, duration: pauseLen });
      }
      i++;
      continue;
    }

    // Two-character patterns first
    if (pair === "th" || pair === "sh" || pair === "ch") {
      sequence.push({ frame: VISEME_MAP.REST, duration: VISEME_DURATION_MS });
      i += 2;
      continue;
    }
    if (pair === "oo" || pair === "ou" || pair === "ow") {
      sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS * 1.3 });
      i += 2;
      continue;
    }
    if (pair === "ee" || pair === "ea") {
      sequence.push({ frame: VISEME_MAP.EE, duration: VISEME_DURATION_MS * 1.2 });
      i += 2;
      continue;
    }
    if (pair === "ai" || pair === "ay" || pair === "ah") {
      sequence.push({ frame: VISEME_MAP.AH, duration: VISEME_DURATION_MS * 1.2 });
      i += 2;
      continue;
    }
    if (pair === "oh") {
      sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS * 1.3 });
      i += 2;
      continue;
    }

    // Single character mapping
    switch (ch) {
      case "a":
        sequence.push({ frame: VISEME_MAP.AH, duration: VISEME_DURATION_MS });
        break;
      case "e":
        sequence.push({ frame: VISEME_MAP.EH, duration: VISEME_DURATION_MS });
        break;
      case "i":
        // Long i = "eye" sound
        sequence.push({ frame: VISEME_MAP.AH, duration: VISEME_DURATION_MS * 0.8 });
        break;
      case "o":
        sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS });
        break;
      case "u":
        sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS * 0.9 });
        break;
      case "y":
        sequence.push({ frame: VISEME_MAP.EE, duration: VISEME_DURATION_MS * 0.7 });
        break;
      case "f":
      case "v":
        sequence.push({ frame: VISEME_MAP.FV, duration: VISEME_DURATION_MS });
        break;
      case "m":
      case "b":
      case "p":
        sequence.push({ frame: VISEME_MAP.MBP, duration: VISEME_DURATION_MS * 0.8 });
        break;
      case "w":
        sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS * 0.7 });
        break;
      case "r":
        sequence.push({ frame: VISEME_MAP.EH, duration: VISEME_DURATION_MS * 0.8 });
        break;
      default:
        // t, d, n, l, s, z, k, g, h, j, c, q, x
        sequence.push({ frame: VISEME_MAP.REST, duration: VISEME_DURATION_MS * 0.6 });
        break;
    }
    i++;
  }

  return sequence;
}

// ── Viseme playback state (module-level singleton) ─────────────
let currentSequence: Array<{ frame: string; duration: number }> = [];
let sequenceIndex = 0;
let sequenceStartTime = 0;
let currentSpeakFrame: string = FRAMES.neutral;

/**
 * Start a new viseme sequence for the given text.
 * Call this when a new response comes in.
 */
export function startSpeaking(text: string): void {
  currentSequence = textToVisemes(text);
  sequenceIndex = 0;
  sequenceStartTime = Date.now();
  currentSpeakFrame = currentSequence[0]?.frame || FRAMES.neutral;
}

/**
 * Advance the viseme playback based on elapsed time.
 * Call this on each animation tick.
 * Returns the current frame to display.
 */
export function advanceSpeaking(): string {
  if (currentSequence.length === 0) return FRAMES.neutral;

  const elapsed = Date.now() - sequenceStartTime;
  let accumulated = 0;

  for (let i = 0; i < currentSequence.length; i++) {
    accumulated += currentSequence[i].duration;
    if (elapsed < accumulated) {
      currentSpeakFrame = currentSequence[i].frame as string;
      sequenceIndex = i;
      return currentSpeakFrame;
    }
  }

  // Sequence finished — return to neutral
  return FRAMES.neutral;
}

export function stopSpeaking(): void {
  currentSequence = [];
  sequenceIndex = 0;
  currentSpeakFrame = FRAMES.neutral;
}

// ── Preload ────────────────────────────────────────────────────
const ALL_FRAMES = Object.values(FRAMES);

export function preloadAvatarFrames(): void {
  ALL_FRAMES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// ── State-based frame getters ──────────────────────────────────
export function getIdleFrame(tick: number): string {
  // Blink every ~4 seconds randomly
  const blinkCycle = 25 + (tick % 7); // Varies between 25-31 ticks
  const isBlinking =
    tick % blinkCycle === 0 || tick % blinkCycle === 1;
  return isBlinking ? FRAMES.blink : FRAMES.idle;
}

export function getListeningFrame(tick: number): string {
  // Subtle alternation — attentive look
  return tick % 40 < 30 ? FRAMES.smileLight : FRAMES.neutral;
}

export function getThinkingFrame(tick: number): string {
  const phase = tick % 30;
  if (phase < 12) return FRAMES.thinking;
  if (phase < 20) return FRAMES.lookingAway;
  return FRAMES.serious;
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
