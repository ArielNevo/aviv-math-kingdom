#!/bin/bash
# Render one explainer and encode it for the app.  Usage (from video/): scripts/render.sh <video_id>
set -euo pipefail
id="$1"
mkdir -p out ../public/videos
npx remotion render src/index.ts "$id" "out/$id.raw.mp4" --concurrency=12 --crf=18 --log=error
ffmpeg -v error -y -i "out/$id.raw.mp4" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 112k -ar 48000 -movflags +faststart "../public/videos/$id.mp4"
ls -la "../public/videos/$id.mp4"
