"""Gera os arquivos de marca do app a partir do PNG oficial do PET-SD.

Uso:
    python scripts/brand/gerar-marca.py "<caminho>/Marca_do_PETSaude.png"

O original (1024x1024, RGBA, ~1,4 MB) fica fora do repositório; só os derivados
são versionados. Regra de identidade visual do programa: não redesenhar, não
mudar cores nem proporções. Aqui só se recorta, redimensiona e comprime.

A faixa de logos da ficha (public/images/pet-sd/cabecalho-ficha.png) vem do
modelo oficial e não é gerada aqui; para recomprimi-la, use otimizar_png.py.

Saídas (cada uma <= 150 KB):
    public/images/pet-sd/simbolo.png        símbolo (sem o texto), navbar
    public/images/pet-sd/marca-completa.png símbolo + "PET-Saúde" + subtítulo
    src/app/icon.png                        512x512, símbolo transparente
    src/app/apple-icon.png                  180x180, símbolo sobre branco
    src/app/favicon.ico                     16, 32 e 48 px
    public/images/pet-sd/compartilhamento.png  1200x630, Open Graph sobre branco
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

from otimizar_png import best_png

ROOT = Path(__file__).resolve().parents[2]
LIMIT = 150 * 1024


def alpha_rows(image: Image.Image) -> list[bool]:
    """True para cada linha que tem algum pixel visível (alfa > 8)."""
    alpha = image.getchannel("A").point(lambda v: 255 if v > 8 else 0)
    width, height = image.size
    data = alpha.tobytes()
    return [any(data[y * width:(y + 1) * width]) for y in range(height)]


def split_symbol(image: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Separa o símbolo (bloco de cima) da marca completa recortada.

    O símbolo termina na primeira faixa de linhas transparentes com pelo menos
    1 % da altura, abaixo da metade de cima da imagem.
    """
    rows = alpha_rows(image)
    height = image.height
    min_gap = max(4, height // 100)
    gap_start = None
    for y in range(height // 3, height):
        if not rows[y]:
            gap_start = y if gap_start is None else gap_start
            if y - gap_start + 1 >= min_gap:
                break
        else:
            gap_start = None
    if gap_start is None:
        raise SystemExit("Não achei a separação entre símbolo e texto.")
    symbol = image.crop((0, 0, image.width, gap_start))
    symbol = symbol.crop(symbol.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    full = image.crop(image.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    return symbol, full


def fit(image: Image.Image, size: tuple[int, int], padding: float, background=None) -> Image.Image:
    """Centraliza a imagem num quadro, mantendo a proporção."""
    canvas = Image.new("RGBA", size, background or (0, 0, 0, 0))
    box_w = int(size[0] * (1 - 2 * padding))
    box_h = int(size[1] * (1 - 2 * padding))
    scale = min(box_w / image.width, box_h / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
    offset = ((size[0] - resized.width) // 2, (size[1] - resized.height) // 2)
    canvas.alpha_composite(resized, offset)
    return canvas


def save_png(image: Image.Image, path: Path, opaque: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    out = image.convert("RGB") if opaque else image
    # Paleta de 256 cores refinada por k-means quando o erro de cor é
    # imperceptível; senão, PNG sem perda (ver otimizar_png.py).
    data, how = best_png(out)
    path.write_bytes(data)
    size = len(data)
    if size > LIMIT:
        raise SystemExit(f"{path} ficou com {size // 1024} KB (limite 150 KB).")
    print(f"{path.relative_to(ROOT)}  {image.width}x{image.height}  {size // 1024} KB  ({how})")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    source = Path(sys.argv[1])
    original = Image.open(source).convert("RGBA")
    symbol, full = split_symbol(original)

    images = ROOT / "public" / "images" / "pet-sd"
    app = ROOT / "src" / "app"
    white = (255, 255, 255, 255)

    # Navbar: 40 px de altura em tela 2x/3x -> 144 px de altura basta.
    save_png(fit(symbol, (round(144 * symbol.width / symbol.height), 144), 0), images / "simbolo.png")
    # Página de entrada: até ~240 px de largura em tela 2x.
    save_png(fit(full, (480, round(480 * full.height / full.width)), 0), images / "marca-completa.png")

    save_png(fit(symbol, (512, 512), 0.06), app / "icon.png")
    save_png(fit(symbol, (180, 180), 0.12, white), app / "apple-icon.png", opaque=True)

    ico = fit(symbol, (256, 256), 0.02)
    ico.save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"src/app/favicon.ico  16/32/48  {(app / 'favicon.ico').stat().st_size // 1024} KB")

    og = Image.new("RGBA", (1200, 630), white)
    og.alpha_composite(fit(full, (1200, 630), 0.1))
    # Declarada no metadata (layout.tsx) com texto alternativo explícito.
    save_png(og, images / "compartilhamento.png", opaque=True)


if __name__ == "__main__":
    main()
