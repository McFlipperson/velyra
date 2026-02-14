/**
 * Voice playback utility — fetches TTS from /api/voice and plays via Audio API.
 * Gracefully handles demo mode (no AWS keys) by simulating speech timing.
 */

type VoicePlayerCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
};

export function createVoicePlayer(
  sessionId: string,
  callbacks: VoicePlayerCallbacks = {}
) {
  let audioRef: HTMLAudioElement | null = null;
  let currentUrl: string | null = null;
  let demoTimer: ReturnType<typeof setTimeout> | null = null;

  async function play(text: string): Promise<void> {
    stop();

    try {
      callbacks.onStart?.();

      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId }),
      });

      // 204 = demo mode, no audio. Simulate speaking duration.
      if (response.status === 204 || !response.ok) {
        const duration = Math.max(1500, text.length * 50); // ~50ms per character
        demoTimer = setTimeout(() => {
          callbacks.onEnd?.();
        }, duration);
        return;
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        const duration = Math.max(1500, text.length * 50);
        demoTimer = setTimeout(() => {
          callbacks.onEnd?.();
        }, duration);
        return;
      }

      const url = URL.createObjectURL(blob);
      currentUrl = url;

      const audio = new Audio(url);
      audioRef = audio;

      audio.onended = () => {
        cleanup();
        callbacks.onEnd?.();
      };

      audio.onerror = () => {
        cleanup();
        // Fall back to demo timing
        const duration = Math.max(1500, text.length * 50);
        demoTimer = setTimeout(() => {
          callbacks.onEnd?.();
        }, duration);
      };

      await audio.play();
    } catch (error) {
      cleanup();
      // Demo fallback
      const duration = Math.max(1500, text.length * 50);
      demoTimer = setTimeout(() => {
        callbacks.onEnd?.();
      }, duration);
      callbacks.onError?.(error);
    }
  }

  function stop(): void {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      audioRef = null;
    }
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }
    if (demoTimer) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
  }

  function cleanup(): void {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }
    audioRef = null;
  }

  function isPlaying(): boolean {
    if (demoTimer) return true;
    return audioRef !== null && !audioRef.paused;
  }

  return { play, stop, isPlaying };
}
