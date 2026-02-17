/**
 * Avatar animation engine v3 — complete viseme lip sync.
 * 18 frames total: refined phonemes + core expressions.
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

// ── Frame paths ────────────────────────────────────────────────
const FRAMES = {
  // Idle / neutral states
  idle: "/avatars/default/idle.png",
  neutral: "/avatars/default/neutral.png",
  blink: "/avatars/default/blink.png",
  
  // Core viseme mouth shapes
  mouthAh: "/avatars/default/mouth-ah.png",           // A, I — wide open
  mouthOh: "/avatars/default/mouth-oh.png",            // O, U — rounded
  mouthOhSmall: "/avatars/default/mouth-oh-small.png", // Small O variant
  mouthW: "/avatars/default/mouth-w.png",              // W, R — puckered
  mouthFv: "/avatars/default/mouth-fv.png",            // F, V — lip tucked
  mouthL: "/avatars/default/mouth-l.png",              // L — tongue to teeth
  mouthTh: "/avatars/default/mouth-th.png",            // TH — tongue between teeth
  lipsClosed: "/avatars/default/lips-closed.png",      // Closed neutral
  lipsClosedMbp: "/avatars/default/lips-closed-mbp.png", // M, B, P — pressed
  talking: "/avatars/default/talking.png",              // E, schwa — mid open
  mouthIh: "/avatars/default/mouth-ih.png",            // IH — narrow open
  mouthUh: "/avatars/default/mouth-uh.png",            // UH — medium open
  smileTeeth: "/avatars/default/smile-teeth.png",      // EE — big smile
  mouthEeHard: "/avatars/default/mouth-ee-hard.png",   // Hard E — stretched
  smileLight: "/avatars/default/smile-light.png",      // S, Z, soft consonants
} as const;

// ── Viseme mapping ─────────────────────────────────────────────
const VISEME_MAP = {
  AH: FRAMES.mouthAh,           // Wide open
  OH: FRAMES.mouthOh,           // Rounded O
  OH_SMALL: FRAMES.mouthOhSmall, // Small O
  W: FRAMES.mouthW,             // W, R puckered
  EE: FRAMES.smileTeeth,        // Big smile
  EE_HARD: FRAMES.mouthEeHard,  // Hard E stretched
  EH: FRAMES.talking,           // Mid open
  IH: FRAMES.mouthIh,           // Narrow open
  UH: FRAMES.mouthUh,           // Medium open
  FV: FRAMES.mouthFv,           // F, V lip tuck
  MBP: FRAMES.lipsClosedMbp,    // M, B, P pressed
  L: FRAMES.mouthL,             // L tongue
  TH: FRAMES.mouthTh,           // TH tongue
  REST: FRAMES.smileLight,      // S, Z, soft consonants
  CLOSED: FRAMES.lipsClosed,    // Closed neutral
} as const;

const VISEME_DURATION_MS = 180;  // Increased from 120ms for slower, more visible changes
const PAUSE_DURATION_MS = 150;   // Increased pauses between words

export function textToVisemes(text: string): Array<{ frame: string; duration: number }> {
  const sequence: Array<{ frame: string; duration: number }> = [];
  const lower = text.toLowerCase();
  
  // DEBUG: Log what we're processing
  console.log('🎤 Lip sync input:', text);
  
  let i = 0;

  while (i < lower.length) {
    const ch = lower[i];
    const next = lower[i + 1] || "";
    const pair = ch + next;

    if (!/[a-z]/.test(ch)) {
      if (ch === " " || ch === "," || ch === "." || ch === "!" || ch === "?") {
        const pauseLen = (ch === " ") ? PAUSE_DURATION_MS : PAUSE_DURATION_MS * 2;
        sequence.push({ frame: VISEME_MAP.CLOSED, duration: pauseLen });
        console.log('  PAUSE');
      }
      i++;
      continue;
    }

    // Two-character patterns
    if (pair === "th") {
      sequence.push({ frame: VISEME_MAP.TH, duration: VISEME_DURATION_MS });
      console.log('  TH');
      i += 2;
      continue;
    }
    if (pair === "sh" || pair === "ch") {
      sequence.push({ frame: VISEME_MAP.REST, duration: VISEME_DURATION_MS });
      console.log('  SH/CH');
      i += 2;
      continue;
    }
    if (pair === "oo" || pair === "ou" || pair === "ow") {
      sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS * 1.5 });
      console.log('  OO/OU/OW');
      i += 2;
      continue;
    }
    if (pair === "ee" || pair === "ea") {
      sequence.push({ frame: VISEME_MAP.EE, duration: VISEME_DURATION_MS * 1.5 });
      console.log('  EE/EA');
      i += 2;
      continue;
    }
    if (pair === "ai" || pair === "ay" || pair === "ah") {
      sequence.push({ frame: VISEME_MAP.AH, duration: VISEME_DURATION_MS * 1.5 });
      console.log('  AI/AY/AH');
      i += 2;
      continue;
    }
    if (pair === "oh") {
      sequence.push({ frame: VISEME_MAP.OH, duration: VISEME_DURATION_MS * 1.5 });
      console.log('  OH');
      i += 2;
      continue;
    }

    // Single character mapping
    switch (ch) {
      case "a":
        sequence.push({ frame: VISEME_MAP.AH, duration: VISEME_DURATION_MS });
        console.log('  a → AH');
        break;
      case "e":
        sequence.push({ frame: VISEME_MAP.EH, duration: VISEME_DURATION_MS });
        console.log('  e → EH');
        break;
      case "i":
        sequence.push({ frame: VISEME_MAP.IH, duration: VISEME_DURATION_MS });
        console.log('  i → IH');
        break;
      case "o":
        sequence.push({ frame: VISEME_MAP.OH_SMALL, duration: VISEME_DURATION_MS });
        console.log('  o → OH_SMALL');
        break;
      case "u":
        sequence.push({ frame: VISEME_MAP.UH, duration: VISEME_DURATION_MS });
        console.log('  u → UH');
        break;
      case "l":
        sequence.push({ frame: VISEME_MAP.L, duration: VISEME_DURATION_MS });
        console.log('  l → L');
        break;
      case "m":
      case "b":
      case "p":
        sequence.push({ frame: VISEME_MAP.MBP, duration: VISEME_DURATION_MS });
        console.log(`  ${ch} → MBP`);
        break;
      case "f":
      case "v":
        sequence.push({ frame: VISEME_MAP.FV, duration: VISEME_DURATION_MS });
        console.log(`  ${ch} → FV`);
        break;
      case "w":
        sequence.push({ frame: VISEME_MAP.W, duration: VISEME_DURATION_MS });
        console.log('  w → W');
        break;
      case "r":
        sequence.push({ frame: VISEME_MAP.W, duration: VISEME_DURATION_MS });
        console.log('  r → W');
        break;
      default:
        sequence.push({ frame: VISEME_MAP.REST, duration: VISEME_DURATION_MS * 0.8 });
        console.log(`  ${ch} → REST`);
        break;
    }
    i++;
  }
  
  console.log(`👄 Generated ${sequence.length} visemes`);
  return sequence;
}

// ── Viseme playback state ──────────────────────────────────────
let currentSequence: Array<{ frame: string; duration: number }> = [];
let sequenceStartTime = 0;

export function startSpeaking(text: string): void {
  currentSequence = textToVisemes(text);
  sequenceStartTime = Date.now();
}

export function advanceSpeaking(): string {
  if (currentSequence.length === 0) return FRAMES.neutral;

  const elapsed = Date.now() - sequenceStartTime;
  let accumulated = 0;

  for (let i = 0; i < currentSequence.length; i++) {
    accumulated += currentSequence[i].duration;
    if (elapsed < accumulated) {
      return currentSequence[i].frame as string;
    }
  }

  return FRAMES.neutral;
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

// ── State-based frame getters ──────────────────────────────────
export function getIdleFrame(tick: number): string {
  const blinkCycle = 25 + (tick % 7);
  const isBlinking = tick % blinkCycle === 0 || tick % blinkCycle === 1;
  return isBlinking ? FRAMES.blink : FRAMES.idle;
}

export function getListeningFrame(tick: number): string {
  return tick % 40 < 30 ? FRAMES.smileLight : FRAMES.neutral;
}

export function getThinkingFrame(tick: number): string {
  const phase = tick % 30;
  if (phase < 12) return FRAMES.neutral;
  if (phase < 20) return FRAMES.idle;
  return FRAMES.lipsClosed;
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
