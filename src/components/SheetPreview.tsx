"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Prévia da folha na tela. A folha tem a largura do papel (Carta paisagem,
 * 1050 px); quando a área é mais estreita (celular), a prévia é reduzida com
 * transform: scale calculado pela largura do container, para mostrar a folha
 * inteira, inclusive a faixa de logos alinhada à direita. "Ver em tamanho
 * real" volta à escala 1 com rolagem horizontal.
 *
 * Só afeta a tela: a impressão usa a cópia em .print-only-wrapper, que não
 * passa por aqui.
 */
export function SheetPreview({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, width: 0, height: 0 });
  const [realSize, setRealSize] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const paper = paperRef.current;
    if (!stage || !paper) return;
    const measure = () => {
      const style = getComputedStyle(stage);
      const available =
        stage.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const width = paper.offsetWidth;
      const height = paper.offsetHeight;
      const scale = width > 0 ? Math.min(1, available / width) : 1;
      setFit((current) =>
        current.scale === scale && current.width === width && current.height === height
          ? current
          : { scale, width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

  const reduced = fit.scale < 0.999;
  const scaled = reduced && !realSize;
  return (
    <div className="sheet-preview">
      {reduced && (
        <div className="sheet-preview-bar">
          <p>
            {realSize
              ? "Folha em tamanho real: role para os lados."
              : `Prévia reduzida a ${Math.round(fit.scale * 100)}% para caber na tela.`}
          </p>
          <button
            type="button"
            className="secondary-button"
            aria-pressed={realSize}
            onClick={() => setRealSize((value) => !value)}
          >
            {realSize ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
            Ver em tamanho real
          </button>
        </div>
      )}
      <div
        ref={stageRef}
        className="sheet-stage"
        data-scaled={scaled}
        tabIndex={realSize ? 0 : undefined}
        aria-label={realSize ? "Prévia da folha em tamanho real, com rolagem horizontal" : undefined}
        role={realSize ? "region" : undefined}
      >
        <div
          className="sheet-fit"
          style={
            scaled
              ? { width: fit.width * fit.scale, height: fit.height * fit.scale }
              : undefined
          }
        >
          <div
            ref={paperRef}
            className="sheet-paper"
            style={scaled ? { transform: `scale(${fit.scale})` } : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
