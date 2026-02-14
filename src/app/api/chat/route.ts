import { NextRequest, NextResponse } from "next/server";

// ── Cost Controls ──────────────────────────────────────────────
const MAX_REQUESTS_PER_SESSION = parseInt(process.env.VELYRA_MAX_MESSAGES || "50");
const MAX_TOKENS_PER_RESPONSE = parseInt(process.env.VELYRA_MAX_TOKENS || "300");
const SESSION_TIMEOUT_MS = parseInt(process.env.VELYRA_SESSION_TIMEOUT_MS || "1800000");
const MAX_RETRIES = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;

// In-memory rate limiting (resets on server restart)
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

// ── System Prompt ──────────────────────────────────────────────
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

    // ── Rate Limiting ────────────────────────────────────────
    const session = getSession(sessionId);

    if (session.count >= MAX_REQUESTS_PER_SESSION) {
      return NextResponse.json(
        {
          reply:
            "We've had a great conversation! For more help, I'd love to connect you with the team directly. Shall I arrange that?",
          rateLimited: true,
        },
        { status: 200 }
      );
    }

    if (session.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      return NextResponse.json(
        {
          reply:
            "I'm experiencing a brief hiccup — please try again shortly, or feel free to reach out through the contact form.",
          circuitOpen: true,
        },
        { status: 200 }
      );
    }

    session.count++;

    // ── Build Messages ───────────────────────────────────────
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

    // ── Call Bedrock ─────────────────────────────────────────
    const region = process.env.AWS_REGION || "us-east-1";
    const modelId =
      process.env.VELYRA_MODEL_ID ||
      "us.anthropic.claude-3-5-sonnet-20241022-v2:0";

    const { BedrockRuntimeClient, InvokeModelCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    );

    const client = new BedrockRuntimeClient({ region });

    let reply = "";
    let retries = 0;

    while (retries < MAX_RETRIES) {
      try {
        const command = new InvokeModelCommand({
          modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify({
            messages,
            max_tokens: MAX_TOKENS_PER_RESPONSE,
            temperature: 0.7,
            top_p: 0.9,
          }),
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(
          new TextDecoder().decode(response.body)
        );

        reply =
          responseBody.content?.[0]?.text ||
          responseBody.choices?.[0]?.message?.content ||
          "I'd be happy to help — could you tell me a bit more about what you're looking for?";

        session.failures = 0;
        break;
      } catch (error) {
        retries++;
        session.failures++;

        if (retries >= MAX_RETRIES) {
          console.error("Velyra chat API error after retries:", error);
          reply =
            "I appreciate your patience — could you rephrase that? Or feel free to reach out through the contact form for immediate help.";
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retries)
          );
        }
      }
    }

    return NextResponse.json({
      reply,
      sessionId,
      remainingMessages: MAX_REQUESTS_PER_SESSION - session.count,
    });
  } catch (error) {
    console.error("Velyra chat route error:", error);
    return NextResponse.json(
      {
        reply:
          "I'm here to help — could you try that again? Or reach out through the contact form.",
      },
      { status: 200 }
    );
  }
}
