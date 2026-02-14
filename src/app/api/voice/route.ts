import { NextRequest, NextResponse } from "next/server";

// ── Cost Controls ──────────────────────────────────────────────
const MAX_VOICE_REQUESTS_PER_SESSION = 20;
const MAX_TEXT_LENGTH = 500;
const COOLDOWN_MS = 3000;

const voiceSessions = new Map<
  string,
  { count: number; lastRequest: number }
>();

async function callPolly(
  text: string
): Promise<Buffer | null> {
  try {
    const { PollyClient, SynthesizeSpeechCommand } = await import(
      "@aws-sdk/client-polly"
    );

    const region = process.env.AWS_REGION || "us-east-1";
    const polly = new PollyClient({ region });

    const command = new SynthesizeSpeechCommand({
      Engine: "neural",
      LanguageCode: "en-US",
      OutputFormat: "mp3",
      SampleRate: "24000",
      Text: text,
      TextType: "text",
      VoiceId: (process.env.VELYRA_VOICE_ID || "Danielle") as import("@aws-sdk/client-polly").VoiceId,
    });

    const response = await polly.send(command);

    if (!response.AudioStream) return null;

    const chunks: Uint8Array[] = [];
    const stream = response.AudioStream as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

// Generate a simple silent MP3 frame for demo mode
// This is a minimal valid MP3 so the browser Audio API doesn't error
function generateSilentMp3(): Buffer {
  // Minimal MP3 frame header + silence (~0.5s)
  // Using a tiny valid mp3 with silence
  const header = Buffer.from([
    0xff, 0xfb, 0x90, 0x00, // MP3 frame header (MPEG1, Layer3, 128kbps, 44100Hz, stereo)
  ]);
  // Pad with zeros for ~0.5 seconds of silence
  const silence = Buffer.alloc(4000, 0);
  return Buffer.concat([header, silence]);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sessionId = "anonymous" } = body as {
      text: string;
      sessionId: string;
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // ── Rate Limiting ────────────────────────────────────────
    const now = Date.now();
    let session = voiceSessions.get(sessionId);

    if (!session) {
      session = { count: 0, lastRequest: 0 };
      voiceSessions.set(sessionId, session);
    }

    if (session.count >= MAX_VOICE_REQUESTS_PER_SESSION) {
      return NextResponse.json(
        { error: "Voice limit reached for this session" },
        { status: 429 }
      );
    }

    if (now - session.lastRequest < COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Please wait a moment before requesting voice again" },
        { status: 429 }
      );
    }

    session.count++;
    session.lastRequest = now;

    const truncatedText = text.slice(0, MAX_TEXT_LENGTH);

    // Try Polly, fall back to demo mode
    let audioBuffer = await callPolly(truncatedText);

    if (!audioBuffer) {
      console.log("Polly unavailable — using demo mode (no voice)");
      // Return 204 so frontend knows there's no audio but it's not an error
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Velyra voice API error:", error);
    return new NextResponse(null, { status: 204 });
  }
}
