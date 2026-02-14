/**
 * Web Speech API wrapper — hold-to-talk pattern.
 * Browser-native, free, no API key needed.
 */

type SpeechCallbacks = {
  onResult: (transcript: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

export function createSpeechRecognizer(callbacks: SpeechCallbacks) {
  const SpeechAPI =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechAPI) {
    return {
      start: () =>
        callbacks.onError?.(
          "Speech recognition not supported in this browser."
        ),
      stop: () => {},
    };
  }

  const recognition = new SpeechAPI();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) {
      callbacks.onResult(transcript);
    }
  };

  recognition.onstart = () => callbacks.onStart?.();
  recognition.onend = () => callbacks.onEnd?.();
  recognition.onerror = (event: any) => {
    if (event.error !== "aborted") {
      callbacks.onError?.(event.error);
    }
    callbacks.onEnd?.();
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // Already started
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped
      }
    },
  };
}
