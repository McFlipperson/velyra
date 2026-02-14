#!/usr/bin/env python3
"""
MagicChat Avatar Sprite Slicer
Slices sprite sheets into individual avatar frames
"""

from PIL import Image
import os

def slice_sprite_sheet():
    """Slice the main 15-frame sprite sheet (3 rows x 5 cols)"""
    
    # Input path (Nova: copy your sprite sheet here as 'avatar_sheet.png')
    input_path = "avatar_sheet.png"
    
    if not os.path.exists(input_path):
        print(f"❌ {input_path} not found! Copy your sprite sheet here first.")
        return False
    
    # Create output directory
    output_dir = "public/avatars/default"
    os.makedirs(output_dir, exist_ok=True)
    
    # Open the sprite sheet
    sheet = Image.open(input_path)
    width, height = sheet.size
    
    # Calculate frame dimensions (3 rows x 5 cols)
    frame_width = width // 5
    frame_height = height // 3
    
    print(f"📊 Sheet: {width}x{height}")
    print(f"🎭 Frame size: {frame_width}x{frame_height}")
    
    # Frame mapping (row, col) -> filename
    frame_map = {
        # Row 1
        (0, 0): "thinking.png",        # Looking away
        (0, 1): "mouth-ah.png",        # Wide open (ah sound)
        (0, 2): "idle.png",            # Neutral/resting (main idle state)
        (0, 3): "mouth-oh.png",        # Surprised/rounded (oh sound)
        (0, 4): "happy.png",           # Big smile
        
        # Row 2
        (1, 0): "tongue-out.png",      # Tongue visible (l/th sounds)
        (1, 1): "mouth-talking.png",   # Mid-speech
        (1, 2): "mouth-open.png",      # Open talking
        (1, 3): "mouth-ee.png",        # Wide smile/teeth (ee sound)
        (1, 4): "mouth-oo.png",        # Pursed lips (oo sound)
        
        # Row 3
        (2, 0): "slight-smile.png",    # Subtle smile
        (2, 1): "grin.png",           # Big grin
        (2, 2): "concerned.png",       # Frown/worried
        (2, 3): "pouty.png",          # Pouty lips
        (2, 4): "surprised.png"        # Surprised open
    }
    
    # Slice each frame
    sliced_count = 0
    for (row, col), filename in frame_map.items():
        x = col * frame_width
        y = row * frame_height
        
        # Extract the frame
        frame = sheet.crop((x, y, x + frame_width, y + frame_height))
        
        # Save with descriptive name
        output_path = os.path.join(output_dir, filename)
        frame.save(output_path)
        
        print(f"✅ Saved: {filename}")
        sliced_count += 1
    
    print(f"🎉 Sliced {sliced_count} frames from main sheet!")
    return True

def slice_extras_sheet():
    """Slice the 3-frame extras sheet"""
    
    # Input path (Nova: copy your extras sheet here as 'avatar_extras.png')
    input_path = "avatar_extras.png"
    
    if not os.path.exists(input_path):
        print(f"❌ {input_path} not found! Copy your extras sheet here first.")
        return False
    
    # Create output directory
    output_dir = "public/avatars/default"
    os.makedirs(output_dir, exist_ok=True)
    
    # Open the extras sheet
    sheet = Image.open(input_path)
    width, height = sheet.size
    
    # Calculate frame dimensions (1 row x 3 cols)
    frame_width = width // 3
    frame_height = height
    
    print(f"📊 Extras sheet: {width}x{height}")
    print(f"🎭 Frame size: {frame_width}x{frame_height}")
    
    # Frame mapping for extras
    extra_frames = [
        "blink.png",        # Eyes closed
        "mouth-mbp.png",    # Lips pressed (m/b/p sounds)
        "mouth-fv.png"      # Bottom lip tucked (f/v sounds)
    ]
    
    # Slice each frame
    sliced_count = 0
    for i, filename in enumerate(extra_frames):
        x = i * frame_width
        y = 0
        
        # Extract the frame
        frame = sheet.crop((x, y, x + frame_width, y + frame_height))
        
        # Save with descriptive name
        output_path = os.path.join(output_dir, filename)
        frame.save(output_path)
        
        print(f"✅ Saved: {filename}")
        sliced_count += 1
    
    print(f"🎉 Sliced {sliced_count} extra frames!")
    return True

if __name__ == "__main__":
    print("🎭 MagicChat Avatar Sprite Slicer")
    print("=" * 40)
    
    # Slice main sheet
    main_success = slice_sprite_sheet()
    print()
    
    # Slice extras
    extras_success = slice_extras_sheet()
    print()
    
    if main_success and extras_success:
        print("🚀 All done! Avatar frames ready for animation.")
        print("📁 Check: public/avatars/default/")
    else:
        print("⚠️  Some files missing. Make sure you have:")
        print("   - avatar_sheet.png (15 frames)")
        print("   - avatar_extras.png (3 frames)")