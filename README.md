# Velyra (V) - AI Concierge Widget

Real-time AI avatar with professional lip sync powered by Rhubarb.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **State:** Zustand
- **AI:** AWS Bedrock (Claude Sonnet 4.5)
- **Voice:** AWS Polly Neural (Danielle voice)
- **Lip Sync:** Rhubarb Lip Sync v1.13.0 (open source)
- **Avatar:** 8-frame Preston Blair phoneme set (A-H)

## Project Structure

```
magicchat/
├── public/
│   ├── avatars/default/    # 8 phoneme frames (A-H)
│   └── lamp.png           # Trigger icon
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/      # Text chat (Bedrock)
│   │   │   └── lipsync/   # Voice + phoneme timing (Polly + Rhubarb)
│   │   ├── page.tsx       # Demo page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── LampTrigger.tsx       # Floating lamp button
│   │   ├── AvatarModal.tsx       # Main modal container
│   │   ├── AvatarDisplay.tsx     # Avatar + animation
│   │   ├── Captions.tsx          # Floating subtitles
│   │   └── InputBar.tsx          # Text/mic input
│   ├── lib/
│   │   ├── avatar-engine.ts      # Rhubarb timestamp playback
│   │   └── speech-recognition.ts # Web Speech API
│   └── store/
│       └── velyra-store.ts       # Zustand state
├── scripts/
│   └── replace-avatars.sh        # Swap avatar sets
├── AVATAR-FRAMES.md              # Frame naming spec
├── RHUBARB-SETUP.md             # Lip sync docs
└── package.json
```

## How Lip Sync Works

1. User sends message
2. **Chat API** (`/api/chat`) returns text response
3. **Lipsync API** (`/api/lipsync`):
   - Generates audio via Polly
   - Converts MP3 → WAV
   - Runs Rhubarb CLI to analyze waveform
   - Returns phoneme timestamps + audio
4. **Frontend**:
   - Plays audio
   - Switches avatar frames at exact timestamps
   - Perfect sync between sound and visuals

## API Routes

### `/api/chat` (POST)
- **Input:** `{ message: string, history: [], sessionId: string }`
- **Output:** `{ reply: string, remainingMessages: number }`
- **Rate limit:** 50 messages per session

### `/api/lipsync` (POST)
- **Input:** `{ text: string, sessionId: string }`
- **Output:** `{ cues: [], audio: base64, duration: number }`
- **Rate limit:** 20 requests per session, 3s cooldown
- **Processing time:** ~500ms-1s (Rhubarb analysis)

## Avatar Frames (Preston Blair Set)

| Frame | Phonemes | Description |
|-------|----------|-------------|
| A | Rest, silence | Mouth closed, relaxed |
| B | M, B, P | Lips pressed together |
| C | E, I | Wide smile, teeth showing |
| D | A, AI | Jaw dropped, wide open |
| E | O | Rounded lips, medium |
| F | U, OO | Tight pucker |
| G | F, V | Bottom lip under teeth |
| H | L, TH, N | Tongue visible |

## Environment Variables

```env
AWS_REGION=us-east-1
VELYRA_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
VELYRA_VOICE_ID=Danielle
VELYRA_MAX_TOKENS=300
VELYRA_MAX_MESSAGES=50
```

## Development

```bash
npm install
npm run dev
```

Server runs on http://localhost:3000

## Dependencies

- **Runtime:** Rhubarb (`/usr/local/bin/rhubarb`)
- **Runtime:** ffmpeg (MP3→WAV conversion)
- **AWS:** Polly + Bedrock access via credentials or instance profile

## Cost

- **Polly:** ~$4 per 1M characters
- **Bedrock (Sonnet 4.5):** ~$3 input / $15 output per 1M tokens
- **Rhubarb:** Free (open source)
- **FFmpeg:** Free (open source)

## Performance

- **Chat latency:** ~500ms-1s (Bedrock response time)
- **Lip sync latency:** +500ms-1s (Rhubarb processing)
- **Total:** ~1-2s from user input to avatar speaking

## Known Issues

- Avatar body shifts slightly between frames (sprite generation inconsistency)
- Mic input (speech recognition) not fully wired yet
- Greeting animation requires full page refresh to replay

## Next Steps

- [ ] Fix avatar sprite consistency (regenerate with ControlNet or manual creation)
- [ ] Optimize Rhubarb processing (cache common phrases)
- [ ] Add loading indicator during Rhubarb processing
- [ ] Wire up speech recognition for mic input
- [ ] Create embeddable widget version
- [ ] Add RAG/knowledge base integration
- [ ] Multi-avatar system
- [ ] Production deployment
