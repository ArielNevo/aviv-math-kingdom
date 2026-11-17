"""Build src/timeline.json from scripts/lines.tsv + chosen narration takes.

Usage (from video/):
  python3 scripts/build_timeline.py --estimate        # no audio yet: durations estimated from text length
  python3 scripts/build_timeline.py                   # uses vo/choices.json {cid: "vo/takes/<file>.wav"}
Copies each chosen take to public/vo/<cid>.wav and stores its duration and a per-frame loudness envelope
(drives the mascot's beak).
"""
import json, os, re, shutil, subprocess, sys
import numpy as np

FPS = 30
PREFIX = {'pyth-hypotenuse': 'p1', 'pyth-leg': 'p2', 'ratio-parts': 'r3', 'proportion-cross': 'c4',
          'scale-map': 's5', 'scale-area': 'a6', 'combo-map-pyth': 'b7'}
NIQQUD = re.compile(r'[֑-ׇ]')


def caption(text):
    t = NIQQUD.sub('', text)
    t = t.replace('אי בריבוע', 'a בריבוע').replace('בי בריבוע', 'b בריבוע').replace('סי בריבוע', 'c בריבוע')
    t = t.replace('איקס', 'x')
    return t


def envelope(wav):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', wav, '-ac', '1', '-ar', '12000', '-f', 's16le', '-'])
    a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    hop = 12000 // FPS
    n = len(a) // hop
    rms = np.array([np.sqrt(np.mean(a[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    ref = np.percentile(rms, 95) or 1
    env = np.clip(rms / ref, 0, 1)
    env = np.convolve(env, [0.25, 0.5, 0.25], mode='same')
    return [round(float(x), 2) for x in env], len(a) / 12000


def main():
    estimate = '--estimate' in sys.argv
    lines = dict(l.rstrip('\n').split('\t', 1) for l in open('scripts/lines.tsv', encoding='utf-8') if l.strip())
    caps = dict(l.rstrip('\n').split('\t', 1) for l in open('scripts/captions.tsv', encoding='utf-8') if l.strip())
    meta = json.load(open('src/scripts.json'))
    choices = {} if estimate else json.load(open('vo/choices.json'))
    os.makedirs('public/vo', exist_ok=True)
    out = []
    for v in meta['videos']:
        scenes = []
        for i, s in enumerate(v['scenes']):
            cid = f"{PREFIX[v['id']]}_{i + 1}"
            text = caps[cid]  # plain spelling, word for word with the narration
            if estimate:
                scenes.append({'key': s['key'], 'cid': cid, 'audio': None, 'seconds': round(len(text) / 11.5, 2), 'text': text, 'env': []})
            else:
                dst = f'public/vo/{cid}.wav'
                # shorten pauses > 0.6 s to 0.4 s and tighten the pace by 8% (pitch kept) (studio rule: no silence > 0.8 s)
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', choices[cid], '-af',
                                'silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-40dB:stop_silence=0.35,atempo=1.08',
                                '-ar', '48000', '-ac', '1', dst], check=True)
                env, secs = envelope(dst)
                scenes.append({'key': s['key'], 'cid': cid, 'audio': f'vo/{cid}.wav', 'seconds': round(secs, 3), 'text': text, 'env': env})
        total = sum(s['seconds'] for s in scenes)
        print(f"{v['id']}: {len(scenes)} scenes, narration {total:.1f}s")
        out.append({'id': v['id'], 'title': v['title'], 'subtitle': v['subtitle'], 'scenes': scenes})
    json.dump({'videos': out}, open('src/timeline.json', 'w'), ensure_ascii=False)


main()
