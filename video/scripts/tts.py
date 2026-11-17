"""Generate per-scene Hebrew narration with edge-tts (he-IL-HilaNeural) and write src/timings.json.
Usage: <venv-python> scripts/tts.py [video_id ...]   (run from video/)"""
import asyncio, json, re, subprocess, sys, os
import edge_tts

VOICE = 'he-IL-HilaNeural'
RATE = '+4%'
NIQQUD = re.compile(r'[֑-ׇ]')

def ts(t):
    h, m, s = t.replace(',', '.').split(':')
    return int(h) * 3600 + int(m) * 60 + float(s)

def parse_srt(path):
    cues = []
    blocks = open(path, encoding='utf-8').read().strip().split('\n\n')
    for b in blocks:
        lines = b.strip().split('\n')
        if len(lines) < 3: continue
        a, z = lines[1].split(' --> ')
        cues.append({'start': round(ts(a), 3), 'end': round(ts(z), 3),
                     'text': NIQQUD.sub('', ' '.join(lines[2:])).replace('איקס', 'x')})
    return cues

async def gen(text, mp3, srt):
    com = edge_tts.Communicate(text, VOICE, rate=RATE)
    sub = edge_tts.SubMaker()
    with open(mp3, 'wb') as f:
        async for chunk in com.stream():
            if chunk['type'] == 'audio': f.write(chunk['data'])
            elif chunk['type'] in ('WordBoundary', 'SentenceBoundary'): sub.feed(chunk)
    open(srt, 'w', encoding='utf-8').write(sub.get_srt())

def dur(path):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).decode())

def main():
    data = json.load(open('src/scripts.json'))
    tpath = 'src/timings.json'
    timings = json.load(open(tpath)) if os.path.exists(tpath) else {}
    only = set(sys.argv[1:])
    for v in data['videos']:
        if only and v['id'] not in only: continue
        os.makedirs(f"public/audio/{v['id']}", exist_ok=True)
        out = []
        for s in v['scenes']:
            mp3 = f"public/audio/{v['id']}/{s['key']}.mp3"; srt = mp3.replace('.mp3', '.srt')
            asyncio.run(gen(s['tts'], mp3, srt))
            out.append({'key': s['key'], 'duration': round(dur(mp3), 3), 'cues': parse_srt(srt)})
            print(v['id'], s['key'], out[-1]['duration'], len(out[-1]['cues']))
        timings[v['id']] = out
    json.dump(timings, open(tpath, 'w'), ensure_ascii=False, indent=1)

main()
