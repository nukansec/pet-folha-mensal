"""Monta imagens lado a lado (Clima | PET-SD antes | PET-SD depois).

Uso:
    python scripts/montar-comparacao.py docs/validation/design-20261118

Lê <pasta>/antes/clima, <pasta>/antes/pet-sd e <pasta>/depois/pet-sd (geradas
por scripts/capturar-telas.mjs) e grava em <pasta>/comparacao/. Capturas de
1440 px entram com metade do tamanho; a altura é limitada a 2400 px.
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw

COLUMNS = [
    ("antes/clima", "Clima (referencia)"),
    ("antes/pet-sd", "PET-SD antes"),
    ("depois/pet-sd", "PET-SD depois"),
]


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    base = Path(sys.argv[1])
    out = base / "comparacao"
    out.mkdir(exist_ok=True)
    for screen in ("entrada", "painel", "folha"):
        for theme in ("claro", "escuro"):
            for width in ("1440", "390"):
                name = f"{screen}-{theme}-{width}.jpg"
                scale = 0.5 if width == "1440" else 1.0
                images = []
                for folder, _ in COLUMNS:
                    image = Image.open(base / folder / name).convert("RGB")
                    images.append(image.resize((int(image.width * scale), int(image.height * scale))))
                height = min(max(image.height for image in images), 2400)
                canvas = Image.new("RGB", (sum(i.width for i in images) + 40, height + 36), "white")
                draw = ImageDraw.Draw(canvas)
                x = 0
                for (_, label), image in zip(COLUMNS, images):
                    canvas.paste(image.crop((0, 0, image.width, min(image.height, height))), (x, 36))
                    draw.text((x + 8, 10), label, fill="black")
                    x += image.width + 20
                canvas.save(out / name, quality=70, optimize=True)
                print(out / name)


if __name__ == "__main__":
    main()
