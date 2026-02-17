# Avatar Frame Requirements

## Current Frame Names
All frames must be named exactly as shown below (case-sensitive, .png extension):

### Idle / Expressions
- `idle.png` - Default resting expression
- `neutral.png` - Neutral/calm expression  
- `blink.png` - Eyes closed
- `happy.png` - Happy/joyful
- `smirk.png` - Slight smirk
- `serious.png` - Serious/focused
- `thinking.png` - Thinking/pondering
- `looking-away.png` - Looking to the side
- `surprised.png` - Surprised expression

### Mouth Shapes (Visemes for lip sync)
- `mouth-ah.png` - Wide open mouth (A, I sounds)
- `mouth-oh.png` - Rounded mouth (O, U sounds)
- `mouth-fv.png` - Lip tucked (F, V sounds)
- `lips-closed.png` - Lips pressed (M, B, P sounds)
- `talking.png` - Mid-open mouth (E, schwa)
- `smile-teeth.png` - Big smile with teeth (EE sounds)
- `smile-light.png` - Soft smile (consonants, rest)

### Additional (optional for variety)
- `looking-away-2.png` - Alternate looking away
- `surprised-2.png` - Alternate surprised
- `tongue.png` - (not currently used in engine)

---

## Technical Requirements

1. **Size:** All images MUST be exactly **512×512 pixels**
2. **Format:** PNG with transparency (RGBA)
3. **Cropping:** Consistent framing across all images
   - Same head position
   - Same shoulder line (if included)
   - Same scale/zoom level
4. **File size:** Under 200KB per image (optimize after export)
5. **Naming:** Exact lowercase filenames as listed above

---

## Framing Guidelines

**Consistent elements across ALL frames:**
- Head centered horizontally
- Eyes at approximately same Y position
- Shoulders cropped at same height (or excluded entirely)
- Background transparent
- No shadows or glow effects (added via CSS)

**What changes between frames:**
- Facial expression
- Mouth shape
- Eye position/blink state
- Head tilt (subtle, < 5°)

---

## Replacement Process

Once you have all frames ready:

1. Put all PNG files in a folder (e.g., `~/Downloads/velyra-avatars-v2/`)
2. Run the replacement script:
   ```bash
   cd /home/ssm-user/.openclaw/workspace/magicchat
   ./scripts/replace-avatars.sh ~/Downloads/velyra-avatars-v2
   ```
3. The script will:
   - Backup old avatars
   - Copy new ones
   - List all files for verification
4. Next.js dev server should auto-reload
5. Refresh browser to see new avatars

---

## Testing Checklist

After replacement:
- [ ] Idle state cycles normally (with blinks)
- [ ] Listening state looks attentive
- [ ] Thinking state shows pondering
- [ ] Speaking animates mouth shapes smoothly
- [ ] No size glitching or jumping
- [ ] All frames load without errors (check browser console)
