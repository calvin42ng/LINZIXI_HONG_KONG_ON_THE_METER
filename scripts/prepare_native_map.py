"""Keep every source pixel while packaging the large map for browser zooming."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path('dist/assets'))
args = parser.parse_args()
source = Image.open(args.source).convert('RGBA')
width, height = source.size
assert width == height and width >= 7680, 'Use the full-resolution square original.'
out = args.output / 'map-native'
out.mkdir(parents=True, exist_ok=True)
size, overlap, tiles = 1024, 1, []
for row, y in enumerate(range(0, height, size)):
    for col, x in enumerate(range(0, width, size)):
        core_w, core_h = min(size, width-x), min(size, height-y)
        left, top = max(0, x-overlap), max(0, y-overlap)
        right, bottom = min(width, x+core_w+overlap), min(height, y+core_h+overlap)
        tile = source.crop((left, top, right, bottom))
        name = f'{col}-{row}.webp'
        tile.save(out/name, lossless=True, quality=75, method=0, exact=True)
        with Image.open(out/name) as encoded:
            assert encoded.convert('RGBA').tobytes() == tile.tobytes(), f'Pixel mismatch in {name}'
        tiles.append(dict(id=f'{col}-{row}',src=f'assets/map-native/{name}',x=left,y=top,width=right-left,height=bottom-top,core=dict(x=x,y=y,width=core_w,height=core_h)))
pixels = hashlib.sha256()
for y in range(0, height, 128):
    pixels.update(source.crop((0,y,width,min(y+128,height))).tobytes())
metadata = dict(width=width,height=height,tileSize=size,overlap=overlap,preview='assets/map-original.png',previewWidth=2048,sourceName=args.source.name,sourceSha256=hashlib.sha256(args.source.read_bytes()).hexdigest(),rgbaSha256=pixels.hexdigest(),tiles=tiles)
(args.output/'map-source.json').write_text(json.dumps(metadata,ensure_ascii=False,separators=(',',':')))
print(f'{width} × {height}: {len(tiles)} lossless sections, all decoded pixels verified; {sum(p.stat().st_size for p in out.glob("*.webp")):,} bytes.')
