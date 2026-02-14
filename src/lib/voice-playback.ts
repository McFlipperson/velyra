/**
 * Voice playback utility — fetches TTS from /api/voice and plays via Audio API.
 * Extracted from Sophia's proven playback pattern.
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

  async function play(text: string): Promise<void> {
    // Stop any current playback first
    stop();

    try {
      callbacks.onStart?.();

      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId }),
      });

      if (!response.ok) {
        callbacks.onEnd?.();
        return;
      }

      const blob = await response.blob();
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
        callbacks.onEnd?.();
      };

      await audio.play();
    } catch (error) {
      cleanup();
      callbacks.onError?.(error);
      callbacks.onEnd?.();
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
  }

  function cleanup(): void {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      currentUrl = null;
    }
    audioRef = null;
  }

  function isPlaying(): boolean {
    return audioRef !== null && !audioRef.paused;
  }

  return { play, stop, isPlaying };
}
