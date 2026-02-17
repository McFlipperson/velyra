#!/bin/bash
# Replace avatar images script
# Usage: ./scripts/replace-avatars.sh /path/to/new/avatar/folder

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-new-avatar-folder>"
  echo "Example: $0 ~/Downloads/velyra-avatars-v2"
  exit 1
fi

NEW_AVATARS="$1"
TARGET="public/avatars/default"

if [ ! -d "$NEW_AVATARS" ]; then
  echo "Error: Directory $NEW_AVATARS does not exist"
  exit 1
fi

echo "🔍 Checking new avatars..."
PNG_COUNT=$(find "$NEW_AVATARS" -maxdepth 1 -name "*.png" | wc -l)
echo "Found $PNG_COUNT PNG files in $NEW_AVATARS"

if [ $PNG_COUNT -eq 0 ]; then
  echo "❌ No PNG files found in $NEW_AVATARS"
  exit 1
fi

echo ""
echo "🗑️  Backing up old avatars..."
BACKUP="public/avatars/default-backup-$(date +%Y%m%d-%H%M%S)"
cp -r "$TARGET" "$BACKUP"
echo "✓ Backup saved to $BACKUP"

echo ""
echo "🖼️  Replacing avatars..."
rm -f "$TARGET"/*.png
cp "$NEW_AVATARS"/*.png "$TARGET/"

echo ""
echo "✅ Avatar replacement complete!"
echo ""
echo "📋 New avatar files:"
ls -lh "$TARGET"/*.png

echo ""
echo "🔄 Restart dev server to see changes (Next.js should hot-reload)"
