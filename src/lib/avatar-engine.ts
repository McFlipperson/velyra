/**
 * Avatar animation engine — sprite state machine with idle blinking and speaking mouth cycles.
 */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

// Frame mappings
const FRAMES = {
  idle: "/avatars/default/idle.png",
  neutral: "/avatars/default/neutral.png",
  blink: "/avatars/default/blink.png",
  happy: "/avatars/default/happy.png",
  smirk: "/avatars/default/smirk.png",
  serious: "/avatars/default/serious.png",
  thinking: "/avatars/default/thinking.png",
  lookingAway: "/avatars/default/looking-away.png",
  surprised: "/avatars/default/surprised.png",
  // Mouth shapes for speaking
  mouthAh: "/avatars/default/mouth-ah.png",
  mouthOh: "/avatars/default/mouth-oh.png",
  mouthFv: "/avatars/default/mouth-fv.png",
  lipsClosed: "/avatars/default/lips-closed.png",
  talking: "/avatars/default/talking.png",
  smileTeeth: "/avatars/default/smile-teeth.png",
  smileLight: "/avatars/default/smile-light.png",
} as const;

// Speaking mouth cycle — varies to look natural
const SPEAK_CYCLE = [
  FRAMES.talking,
  FRAMES.mouthAh,
  FRAMES.lipsClosed,
  FRAMES.mouthOh,
  FRAMES.talking,
  FRAMES.mouthFv,
  FRAMES.lipsClosed,
  FRAMES.smileLight,
  FRAMES.mouthAh,
  FRAMES.talking,
  FRAMES.lipsClosed,
  FRAMES.mouthOh,
];

// All frames to preload
const ALL_FRAMES = Object.values(FRAMES);

/** Preload all avatar images into browser cache */
export function preloadAvatarFrames(): void {
  ALL_FRAMES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

/** Get the current frame based on avatar state */
export function getIdleFrame(tick: number): string {
  // Blink every ~4 seconds (assuming tick increments ~every 150ms)
  const blinkInterval = 27; // ~4 sec
  const isBlinking = tick % blinkInterval === 0 || tick % blinkInterval === 1;
  return isBlinking ? FRAMES.blink : FRAMES.idle;
}

export function getListeningFrame(): string {
  return FRAMES.smileLight;
}

export function getThinkingFrame(tick: number): string {
  // Alternate between thinking poses
  return tick % 20 < 10 ? FRAMES.thinking : FRAMES.lookingAway;
}

export function getSpeakingFrame(tick: number): string {
  const idx = tick % SPEAK_CYCLE.length;
  return SPEAK_CYCLE[idx];
}

export function getFrameForState(state: AvatarState, tick: number): string {
  switch (state) {
    case "speaking":
      return getSpeakingFrame(tick);
    case "listening":
      return getListeningFrame();
    case "thinking":
      return getThinkingFrame(tick);
    case "idle":
    default:
      return getIdleFrame(tick);
  }
}
