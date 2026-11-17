import json, sys
from PIL import Image
tl = json.load(open('src/timeline.json'))
for vid in sys.argv[1:]:
    v = next(x for x in tl['videos'] if x['id'] == vid)
    ims = [Image.open(f'out/stills/{vid}-{s["key"]}.png') for s in v['scenes']]
    w, h = ims[0].size
    sheet = Image.new('RGB', (w * 4, h * 2), 'white')
    for i, im in enumerate(ims): sheet.paste(im, ((i % 4) * w, (i // 4) * h))
    sheet.save(f'out/stills/sheet-{vid}.jpg', quality=80)
