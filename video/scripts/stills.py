"""Render one still per scene (at ~85% of the scene) for QA. Usage: python3 scripts/stills.py <video_id> [frac]"""
import json, math, subprocess, sys
INTRO, DELAY, TAIL, FPS = 45, 6, 10, 30
vid = sys.argv[1]; frac = float(sys.argv[2]) if len(sys.argv) > 2 else 0.85
v = next(x for x in json.load(open('src/timeline.json'))['videos'] if x['id'] == vid)
start = INTRO
frames = []
for s in v['scenes']:
    n = DELAY + math.ceil(s['seconds'] * FPS) + TAIL
    frames.append((s['key'], start + int(n * frac)))
    start += n
for key, fr in frames:
    subprocess.run(['npx', 'remotion', 'still', 'src/index.ts', vid, f'out/stills/{vid}-{key}.png', f'--frame={fr}', '--log=error', '--scale=0.5'], check=True)
print(' '.join(f'out/stills/{vid}-{k}.png' for k, _ in frames))
