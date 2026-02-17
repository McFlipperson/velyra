import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { randomBytes } from "crypto";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// ── Cost Controls ──────────────────────────────────────────────
const MAX_LIPSYNC_REQUESTS_PER_SESSION = 20;
const MAX_TEXT_LENGTH = 500;
const COOLDOWN_MS = 3000;

const lipsyncSessions = new Map<
  string,
  { count: number; lastRequest: number }
>();

async function callPolly(text: string): Promise<Buffer | null> {
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

async function runRhubarb(audioPath: string): Promise<any> {
  try {
    console.log('🎤 Converting MP3 to WAV...');
    // Convert MP3 to WAV (Rhubarb requirement)
    const wavPath = audioPath.replace('.mp3', '.wav');
    await execAsync(
      `ffmpeg -i "${audioPath}" -ar 16000 -ac 1 -y "${wavPath}"`,
      { timeout: 10000 }
    );

    console.log('👄 Running Rhubarb on WAV...');
    // Run Rhubarb on WAV file (allow up to 30s for processing)
    const { stdout } = await execAsync(
      `rhubarb -f json "${wavPath}"`,
      { timeout: 30000 }
    );
    
    // Clean up WAV file
    await unlink(wavPath).catch(() => {});
    
    const result = JSON.parse(stdout);
    console.log('✅ Rhubarb success:', result.mouthCues?.length, 'cues');
    return result;
  } catch (error) {
    console.error("❌ Rhubarb error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];

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
    let session = lipsyncSessions.get(sessionId);

    if (!session) {
      session = { count: 0, lastRequest: 0 };
      lipsyncSessions.set(sessionId, session);
    }

    if (session.count >= MAX_LIPSYNC_REQUESTS_PER_SESSION) {
      return NextResponse.json(
        { error: "Lip sync limit reached for this session" },
        { status: 429 }
      );
    }

    if (now - session.lastRequest < COOLDOWN_MS) {
      return NextResponse.json(
        { error: "Please wait a moment before requesting lip sync again" },
        { status: 429 }
      );
    }

    session.count++;
    session.lastRequest = now;

    const truncatedText = text.slice(0, MAX_TEXT_LENGTH);

    // Generate audio
    const audioBuffer = await callPolly(truncatedText);

    if (!audioBuffer) {
      console.log("Polly unavailable — using fallback");
      return NextResponse.json({
        cues: [],
        audio: null,
        fallback: true,
      });
    }

    // Save audio to temp file
    const tempId = randomBytes(8).toString("hex");
    const audioPath = join(tmpdir(), `velyra-${tempId}.mp3`);
    tempFiles.push(audioPath);

    await writeFile(audioPath, audioBuffer);

    // Run Rhubarb
    const rhubarbOutput = await runRhubarb(audioPath);

    if (!rhubarbOutput || !rhubarbOutput.mouthCues) {
      console.log("Rhubarb failed — returning audio only");
      // Clean up and return audio without lip sync data
      await Promise.all(tempFiles.map((f) => unlink(f).catch(() => {})));
      
      return NextResponse.json({
        cues: [],
        audio: audioBuffer.toString("base64"),
        fallback: true,
      });
    }

    // Clean up temp files
    await Promise.all(tempFiles.map((f) => unlink(f).catch(() => {})));

    // Return lip sync data + audio
    return NextResponse.json({
      cues: rhubarbOutput.mouthCues,
      audio: audioBuffer.toString("base64"),
      duration: rhubarbOutput.metadata?.duration || 0,
    });
  } catch (error) {
    console.error("Lip sync API error:", error);
    
    // Clean up temp files
    await Promise.all(tempFiles.map((f) => unlink(f).catch(() => {})));

    return NextResponse.json({
      cues: [],
      audio: null,
      fallback: true,
    });
  }
}
