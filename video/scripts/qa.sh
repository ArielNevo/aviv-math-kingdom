#!/bin/bash
# QA one encoded video: streams, loudness, 8 sampled frames → out/qa/<id>.jpg  (run from video/)
id="$1"; f="../public/videos/$id.mp4"; mkdir -p out/qa
ffprobe -v error -show_entries stream=codec_name -show_entries format=duration,size -of compact "$f"
ffmpeg -v info -i "$f" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
python3 - "$f" "$dur" "$id" <<'PY'
import subprocess, sys
from PIL import Image
f, dur, vid = sys.argv[1], float(sys.argv[2]), sys.argv[3]
ts = [2 + i * (dur - 4) / 7 for i in range(8)]
ims = []
for i, t in enumerate(ts):
    p = f'out/qa/{vid}-{i}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', f, '-frames:v', '1', '-vf', 'scale=360:-1', p], check=True)
    ims.append(Image.open(p))
w, h = ims[0].size
s = Image.new('RGB', (w * 4, h * 2), 'white')
for i, im in enumerate(ims): s.paste(im, ((i % 4) * w, (i // 4) * h))
s.save(f'out/qa/{vid}.jpg', quality=80)
PY
