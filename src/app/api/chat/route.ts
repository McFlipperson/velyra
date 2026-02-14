import { NextRequest, NextResponse } from "next/server";

// ── Cost Controls ──────────────────────────────────────────────
const MAX_REQUESTS_PER_SESSION = parseInt(process.env.VELYRA_MAX_MESSAGES || "50");
const MAX_TOKENS_PER_RESPONSE = parseInt(process.env.VELYRA_MAX_TOKENS || "300");
const SESSION_TIMEOUT_MS = parseInt(process.env.VELYRA_SESSION_TIMEOUT_MS || "1800000");
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;

const sessions = new Map<
  string,
  { count: number; startedAt: number; failures: number }
>();

function getSession(sessionId: string) {
  const now = Date.now();
  let session = sessions.get(sessionId);
  if (!session || now - session.startedAt > SESSION_TIMEOUT_MS) {
    session = { count: 0, startedAt: now, failures: 0 };
    sessions.set(sessionId, session);
  }
  return session;
}

function buildSystemPrompt() {
  const custom = process.env.VELYRA_SYSTEM_PROMPT;
  if (custom) return custom;

  return `You are Velyra, a friendly and knowledgeable AI concierge.

PERSONALITY:
- Warm, approachable, and professional
- Conversational but concise — 2-4 sentences max per response
- Helpful and proactive — anticipate follow-up questions
- Subtly guide users toward taking action (booking, contacting, exploring)

BEHAVIOR:
- Keep responses short and natural — this is a voice conversation, not an essay
- Never fabricate information you don't have
- If you can't help with something, say so gracefully and suggest alternatives
- Be personable — light humor is welcome when appropriate`;
}

// ── Mock responses for demo mode (no AWS keys) ─────────────────
const MOCK_RESPONSES = [
  "That's a great question! I'd love to help you explore that further. What specifically are you most curious about?",
  "Absolutely! Let me break that down for you. The key thing to know is that we're here to make this as easy as possible.",
  "I hear you! That's something a lot of people ask about. The short answer is — we've got you covered.",
  "Interesting! I can definitely help with that. Would you like me to go into more detail, or shall we look at some options?",
  "Great thinking! There are a few ways to approach this. Want me to walk you through the most popular option?",
  "Of course! I'm glad you asked. Let me share what I know — and if you need more detail, just say the word.",
  "That's exactly what I'm here for! Let me pull together some info for you. One moment...",
  "Love that question! Here's what I'd suggest — and feel free to tell me if you'd like to explore a different angle.",
];

function getMockResponse(): string {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

async function callBedrock(
  messages: Array<{ role: string; content: string }>
): Promise<string | null> {
  const region = process.env.AWS_REGION || "us-east-1";
  const modelId =
    process.env.VELYRA_MODEL_ID ||
    "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

  try {
    const { BedrockRuntimeClient, InvokeModelCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    );

    const client = new BedrockRuntimeClient({ region });

    const command = new InvokeModelCommand({
      modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        messages,
        max_tokens: MAX_TOKENS_PER_RESPONSE,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      message,
      history = [],
      sessionId = "anonymous",
    } = body as {
      message: string;
      history: Array<{ role: string; content: string }>;
      sessionId: string;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const session = getSession(sessionId);

    if (session.count >= MAX_REQUESTS_PER_SESSION) {
      return NextResponse.json({
        reply:
          "We've had a great conversation! For more help, I'd love to connect you with the team directly.",
        rateLimited: true,
      });
    }

    if (session.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      return NextResponse.json({
        reply:
          "I'm experiencing a brief hiccup — please try again shortly.",
        circuitOpen: true,
      });
    }

    session.count++;

    const messages = [
      { role: "user" as const, content: buildSystemPrompt() },
      {
        role: "assistant" as const,
        content: "Understood. I am Velyra, ready to assist.",
      },
      ...history.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Try Bedrock, fall back to mock
    let reply: string | null = null;
    let retries = 0;

    while (retries < MAX_RETRIES && !reply) {
      reply = await callBedrock(messages);
      if (!reply) {
        retries++;
        session.failures++;
        if (retries < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * retries));
        }
      } else {
        session.failures = 0;
      }
    }

    // Fallback to demo mode
    if (!reply) {
      console.log("Bedrock unavailable — using demo mode");
      reply = getMockResponse();
      session.failures = 0; // Don't trip circuit breaker for demo mode
    }

    return NextResponse.json({
      reply,
      sessionId,
      remainingMessages: MAX_REQUESTS_PER_SESSION - session.count,
      demo: !process.env.AWS_ACCESS_KEY_ID, // Let frontend know
    });
  } catch (error) {
    console.error("Velyra chat route error:", error);
    return NextResponse.json({
      reply: getMockResponse(),
      demo: true,
    });
  }
}
