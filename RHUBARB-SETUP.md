# Rhubarb Lip Sync Integration

## Status: ✅ Installed & Configured

### What Changed

**New API endpoint:** `/api/lipsync`
- Accepts text input
- Generates audio via AWS Polly
- Analyzes audio with Rhubarb
- Returns precise phoneme timestamps + audio

**Updated avatar engine:**
- Now accepts timestamp-based phoneme cues
- Switches frames based on audio timing, not text guessing
- Falls back to simple animation if Rhubarb fails

**8-frame Preston Blair set:**
- A = Rest
- B = M/B/P
- C = E/I  
- D = A/AI
- E = O
- F = U/OO
- G = F/V
- H = L/TH/N

### How It Works

1. User types message
2. Chat API returns text response
3. Lipsync API:
   - Generates audio (Polly)
   - Saves to temp file
   - Runs Rhubarb CLI: `rhubarb -f json --extendedShapes GX <audio>`
   - Parses JSON output with timestamps
4. Frontend plays audio + switches avatar frames at exact timestamps

### Performance

- Adds ~500ms-1s latency per response (Rhubarb processing)
- Accurate lip sync tied to actual audio waveform
- No more guessing phonemes from text

### Dependencies Installed

- Rhubarb Lip Sync v1.13.0 (`/usr/local/bin/rhubarb`)
- FFmpeg (for MP3→WAV conversion, Rhubarb requirement)

### Cost Impact

- **Rhubarb:** Free (open source)
- **FFmpeg:** Free (open source)
- **Polly:** Same as before (~$4/1M characters)
- **Sonnet 4.5 tokens for setup:** ~40k tokens (~$0.50)

### Fallback Behavior

If Rhubarb fails (timeout, error, missing audio):
- Reverts to simple shape cycling
- Still shows captions
- No breaking errors

---

**Ready to test:** http://44.210.19.155:3000

Try asking questions with varied sounds to see precise lip sync.
