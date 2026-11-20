#!/usr/bin/env python3
"""public/og-image.png (1200x630)을 만든다.

og-image.svg와 같은 배색·문구를 쓰되, SVG를 읽지 못하는 크롤러·메신저를 위해
PNG로도 같은 그림을 둔다. 실행: python3 scripts/gen-og-image.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
PAPER = "#f2efe7"
CARD = "#fffdf8"
LINE = "#e2ddd0"
INK = "#22231f"
MUTED = "#6f6b5f"
PINE = "#36654f"
SOFT = "#e7efe9"
BAR = "#a9bfb0"

FONT_CANDIDATES = [
    "/usr/share/fonts/pickle-hwp/NotoSansCJKkr-Regular.otf",
    "/usr/share/fonts/opentype/noto/NotoSansCJKkr-Regular.otf",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
]


def font(size: int) -> ImageFont.FreeTypeFont:
    for candidate in FONT_CANDIDATES:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default(size)


image = Image.new("RGB", (W, H), PAPER)
draw = ImageDraw.Draw(image)

draw.rounded_rectangle([84, 84, 84 + 1032, 84 + 462], radius=28, fill=CARD, outline=LINE, width=3)
draw.rounded_rectangle([132, 132, 132 + 36, 132 + 36], radius=8, fill=PINE)

draw.text((186, 134), "3년 다이어리", font=font(30), fill=INK)
draw.text((132, 246), "오늘과 3년 전 오늘을", font=font(64), fill=INK, stroke_width=1, stroke_fill=INK)
draw.text((132, 326), "한 화면에", font=font(64), fill=PINE, stroke_width=1, stroke_fill=PINE)
draw.text((132, 418), "하루 한 줄 블렛 일기 · 12개 시점 회고 · 브라우저에만 저장", font=font(26), fill=MUTED)

meta = font(21)
meta_y = 482
x = 132
for index, text in enumerate(["무료", "회원가입 없음", "광고로 운영"]):
    draw.text((x, meta_y), text, font=meta, fill="#8d897c")
    x += int(draw.textlength(text, font=meta)) + 24
    if index < 2:
        draw.text((x - 14, meta_y), "·", font=meta, fill="#8d897c")
        x += 12

draw.rounded_rectangle([884, 300, 884 + 160, 300 + 120], radius=16, fill=SOFT)
for row in range(3):
    top = 330 + row * 30
    draw.rounded_rectangle([912, top, 912 + 12, top + 12], radius=3, fill=PINE)
    width = [72, 58, 66][row]
    draw.rounded_rectangle([938, top + 2, 938 + width, top + 10], radius=4, fill=BAR)

target = Path(__file__).resolve().parent.parent / "public" / "og-image.png"
target.parent.mkdir(parents=True, exist_ok=True)
image.save(target, format="PNG", optimize=True)
print(f"[gen-og-image] {target} ({target.stat().st_size:,} bytes, {W}x{H})")
