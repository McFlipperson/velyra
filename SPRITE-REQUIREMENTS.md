# Exact Sprite Requirements for Rhubarb Lip Sync

## Critical Constraints

**EVERY frame MUST have:**
- ✅ Identical canvas size (512x512px recommended)
- ✅ Identical body position (shoulders, neck, head placement)
- ✅ Identical lighting/shadows
- ✅ Identical framing (same crop, same scale)
- ✅ Transparent background
- ✅ ONLY the mouth/lips should differ between frames

**If the body shifts even slightly between frames, the animation will look glitchy.**

## 8 Required Mouth Shapes (Preston Blair Phoneme Set)

| Frame | Phoneme | Mouth Shape | Used For |
|-------|---------|-------------|----------|
| **A.png** | A/X | Lips closed, relaxed | Rest, silence, N, M |
| **B.png** | B | Lips pressed together | M, B, P sounds |
| **C.png** | C | Wide smile, teeth showing | E, I, K, N, Y |
| **D.png** | D | Jaw dropped, mouth open wide | A, AI sounds |
| **E.png** | E | Lips rounded, medium open | O sounds |
| **F.png** | F | Lips tight pucker | U, OO, W sounds |
| **G.png** | G | Bottom lip under top teeth | F, V sounds |
| **H.png** | H | Tongue visible between teeth | L, TH, N, D, T |

## Example Workflow

### Option 1: Manual Creation (Most Reliable)
1. Create ONE master portrait (512x512, transparent BG)
2. Duplicate 7 times
3. Manually edit ONLY the mouth in each copy
4. Save as A.png through H.png

### Option 2: AI Generation with ControlNet
1. Generate base portrait
2. Use ControlNet with locked pose/composition
3. Generate 8 variations with mouth-only prompts
4. Manual touch-up if body drifts

### Option 3: Commission Artist
- Fiverr/Upwork: $5-20 for simple character sprite sheet
- Provide this spec document
- Request: "8-frame mouth animation, identical body"

## Current Problem

Our AI-generated sprites have:
- ❌ Body position drift between frames
- ❌ Shoulder crop differences
- ❌ Slight scale variations
- ❌ Different framing

**This causes visual "glitching" even though the code and Rhubarb timing are perfect.**

## Testing Your Sprites

1. Open all 8 PNGs in separate tabs
2. Rapidly switch between tabs (Ctrl+Tab)
3. If the body/head "jumps" between frames → BAD
4. If ONLY the mouth changes → GOOD

## File Naming (Exact)

```
/public/avatars/default/A.png
/public/avatars/default/B.png
/public/avatars/default/C.png
/public/avatars/default/D.png
/public/avatars/default/E.png
/public/avatars/default/F.png
/public/avatars/default/G.png
/public/avatars/default/H.png
```

## Reference Images

See `/home/ssm-user/.openclaw/media/inbound/file_6*` for current frames (they have body drift issues).

## Rhubarb Output Example

```json
{
  "cues": [
    {"start": 0.00, "end": 0.18, "value": "X"},  // Uses A.png
    {"start": 0.18, "end": 0.24, "value": "C"},  // Uses C.png
    {"start": 0.24, "end": 0.37, "value": "E"},  // Uses E.png
    ...
  ]
}
```

The code switches images at exact timestamps. If images have body drift, the switching looks broken.

## Bottom Line

**Rhubarb is working perfectly. The code is working perfectly. We need better source images with zero body drift.**
