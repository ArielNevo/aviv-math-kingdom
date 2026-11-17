"""Pick the best take per line from screen_takes output (vo/screen.txt) + a long-silence check.
Writes vo/choices.json and prints a table. Usage: python3 scripts/choose.py"""
import json, re, subprocess

def longest_silence(wav):
    err = subprocess.run(['ffmpeg', '-v', 'info', '-i', wav, '-af', 'silencedetect=noise=-38dB:d=0.5', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    durs = [float(x) for x in re.findall(r'silence_duration: ([\d.]+)', err)]
    return max(durs, default=0.0)

caps = dict(l.rstrip('\n').split('\t', 1) for l in open('scripts/captions.tsv', encoding='utf-8') if l.strip())
rows = {}
for line in open('vo/screen.txt', encoding='utf-8'):
    parts = line.rstrip('\n').split('\t')
    if len(parts) < 5 or '-take' not in parts[0]:
        continue
    name, dur, sim, wps, text = parts[:5]
    cid = name.split('-')[0]
    wav = f'vo/takes/{name}.wav'
    rows.setdefault(cid, []).append({'name': name, 'dur': float(dur[:-1]), 'sim': float(sim[4:]), 'sil': longest_silence(wav), 'wav': wav, 'text': text})

choices, report = {}, []
for cid in caps:
    takes = rows.get(cid, [])
    if not takes:
        report.append(f'{cid}\tMISSING'); continue
    expected = len(caps[cid]) / 11.5
    def score(t):
        s = t['sim']
        if t['sil'] > 0.8: s -= 0.3
        if t['dur'] > expected * 1.45: s -= 0.2
        return s
    best = max(takes, key=score)
    choices[cid] = best['wav']
    flag = '' if best['sim'] >= 0.9 and best['sil'] <= 0.8 else '  <-- check'
    report.append(f"{cid}\t{best['name']}\tsim={best['sim']:.2f}\tdur={best['dur']:.1f}s\tsil={best['sil']:.2f}{flag}")
json.dump(choices, open('vo/choices.json', 'w'), indent=1)
print('\n'.join(report))
