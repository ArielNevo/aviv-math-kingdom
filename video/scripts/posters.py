"""Render a poster (720x1280 JPEG ≤120 KB) for each video from its key scene. Run from video/."""
import json, math, os, subprocess
INTRO, DELAY, TAIL, FPS = 45, 6, 10, 30
KEY = {'pyth-hypotenuse': ('squares', 0.9), 'pyth-leg': ('mistake', 0.9), 'ratio-parts': ('three', 0.9),
       'proportion-cross': ('cross', 0.9), 'scale-map': ('multiply', 0.85), 'scale-area': ('areas', 0.9),
       'combo-map-pyth': ('spot', 0.9)}
tl = json.load(open('src/timeline.json'))
for v in tl['videos']:
    key, frac = KEY[v['id']]
    start = INTRO
    for s in v['scenes']:
        n = DELAY + math.ceil(s['seconds'] * FPS) + TAIL
        if s['key'] == key:
            frame = start + int(n * frac); break
        start += n
    png = f"out/{v['id']}-poster.png"
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', v['id'], png, f'--frame={frame}', '--log=error'], check=True)
    out = f"../public/videos/{v['id']}.jpg"
    for q in (6, 8, 10, 13, 16):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', png, '-q:v', str(q), out], check=True)
        if os.path.getsize(out) <= 120_000: break
    print(v['id'], frame, os.path.getsize(out))
