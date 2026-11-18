import Image from "next/image";
import { PROGRAM } from "@/config/program";

// Arquivos gerados por scripts/brand/gerar-marca.py a partir do PNG oficial.
// Regra de identidade visual: não redesenhar nem mudar cores ou proporções.
export const BRAND_SYMBOL = { src: "/images/pet-sd/simbolo.png", width: 134, height: 144 };
export const BRAND_FULL = { src: "/images/pet-sd/marca-completa.png", width: 480, height: 475 };

/** Símbolo + nome curto, usado no cabeçalho. */
export function Brand() {
  return (
    <span className="brand">
      <Image
        className="brand-symbol"
        src={BRAND_SYMBOL.src}
        width={BRAND_SYMBOL.width}
        height={BRAND_SYMBOL.height}
        alt=""
        loading="eager"
      />
      <span>
        <strong>
          {PROGRAM.acronym} <span className="brand-campus">{PROGRAM.campus}</span>
        </strong>
        <small>Folha de frequência mensal</small>
      </span>
    </span>
  );
}

/** Marca completa (símbolo, “PET-Saúde” e subtítulo), usada na entrada. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`}>
      <Image
        src={BRAND_FULL.src}
        width={BRAND_FULL.width}
        height={BRAND_FULL.height}
        alt={`Logo do ${PROGRAM.name}`}
        loading="eager"
      />
    </span>
  );
}
