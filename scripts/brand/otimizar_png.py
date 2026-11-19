"""Reduz o peso dos PNGs da marca sem mudar dimensões nem cores visíveis.

Uso:
    python scripts/brand/otimizar_png.py public/images/pet-sd/*.png src/app/icon.png

Converte cada PNG para paleta de 256 cores e só grava a versão nova se ela for
menor e ficar dentro da tolerância de cor. Regra de identidade visual do
programa: não redesenhar, não mudar cores nem proporções.

Por que `kmeans`: a quantização sem refinamento (octree ou max coverage puros)
põe o fundo quase branco da faixa de logos numa cor da paleta que puxa para o
lilás (diferença média de ~3,5 em 255). Com algumas iterações de k-means a
paleta se ajusta às cores de maior área e a diferença média cai para ~1,2,
sem mudança perceptível nem na impressão.

Também é importado por gerar-marca.py.
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image, ImageChops

# Diferença média por canal (0–255) aceita entre o original e a paleta.
MAX_MEAN_DIFF = 1.5
KMEANS_STEPS = 32


def mean_diff(a: Image.Image, b: Image.Image) -> float:
    """Diferença média por pixel, em níveis de 0 a 255, entre duas imagens."""
    hist = ImageChops.difference(a, b).convert("L").histogram()
    return sum(level * count for level, count in enumerate(hist)) / sum(hist)


def to_palette(image: Image.Image) -> tuple[Image.Image, float]:
    """Paleta de 256 cores (com alfa, se houver). Devolve a imagem e o erro."""
    has_alpha = image.mode in ("RGBA", "LA") or "transparency" in image.info
    mode = "RGBA" if has_alpha else "RGB"
    base = image.convert(mode)
    # Com alfa, o Pillow só aceita octree; sem alfa, max coverage erra menos.
    method = Image.Quantize.FASTOCTREE if has_alpha else Image.Quantize.MAXCOVERAGE
    quantized = base.quantize(256, method=method, kmeans=KMEANS_STEPS, dither=Image.Dither.NONE)
    return quantized, mean_diff(base, quantized.convert(mode))


def png_bytes(image: Image.Image) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, "PNG", optimize=True)
    return buffer.getvalue()


def best_png(image: Image.Image) -> tuple[bytes, str]:
    """Bytes do menor PNG aceitável e a descrição de qual versão venceu."""
    lossless = png_bytes(image)
    quantized, diff = to_palette(image)
    candidate = png_bytes(quantized)
    if diff <= MAX_MEAN_DIFF and len(candidate) < len(lossless):
        return candidate, f"paleta, erro médio {diff:.2f}"
    return lossless, f"sem perda (paleta recusada, erro médio {diff:.2f})"


def optimize_file(path: Path) -> None:
    before = path.stat().st_size
    with Image.open(path) as image:
        image.load()
        data, how = best_png(image)
        size = image.size
    if len(data) >= before:
        print(f"{path}  {size[0]}x{size[1]}  {before // 1024} KB  mantido")
        return
    path.write_bytes(data)
    print(f"{path}  {size[0]}x{size[1]}  {before // 1024} -> {len(data) // 1024} KB  ({how})")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    for name in sys.argv[1:]:
        optimize_file(Path(name))


if __name__ == "__main__":
    main()
