"""
Crops all PNGs in this folder to their non-transparent pixel bounding box.
Run from the demo/ directory:  python3 crop_transparent.py
"""
from pathlib import Path
from PIL import Image

PADDING = 4  # px of transparent padding to leave on each side

folder = Path(__file__).parent
pngs = [p for p in folder.glob("*.png") if p.name != Path(__file__).name]

for path in sorted(pngs):
    img = Image.open(path).convert("RGBA")
    bbox = img.getbbox()  # tight bounding box of non-zero pixels (any channel)
    if bbox is None:
        print(f"  skip (fully transparent): {path.name}")
        continue

    l, t, r, b = bbox
    w, h = img.size
    # Add padding without exceeding image bounds
    l = max(0, l - PADDING)
    t = max(0, t - PADDING)
    r = min(w, r + PADDING)
    b = min(h, b + PADDING)

    cropped_box = (l, t, r, b)
    if cropped_box == (0, 0, w, h):
        print(f"  already tight: {path.name}")
        continue

    cropped = img.crop(cropped_box)
    cropped.save(path)
    print(f"  cropped {w}x{h} → {r-l}x{b-t}: {path.name}")

print("Done.")
