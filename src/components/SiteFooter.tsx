"use client";

import { PROGRAM } from "@/config/program";

/**
 * Rodapé comum à entrada e ao painel: créditos do projeto original à esquerda
 * e links úteis à direita. “Avaliar o site” só aparece com link configurado.
 */
export function SiteFooter({
  onHelp,
  onFeedback,
}: {
  onHelp: () => void;
  onFeedback: () => void;
}) {
  const [first, second] = PROGRAM.credits.authors;
  return (
    <footer className="site-footer screen-only">
      <div className="footer-inner">
        <div className="footer-bottom">
          <p>
            {PROGRAM.acronym}/{PROGRAM.campus} · Adaptado do{" "}
            <a
              href={PROGRAM.credits.upstreamRepository}
              target="_blank"
              rel="noreferrer"
            >
              projeto original
            </a>{" "}
            de{" "}
            <a href={first.url} target="_blank" rel="noreferrer">
              {first.name}
            </a>
            {" e "}
            <a href={second.url} target="_blank" rel="noreferrer">
              {second.name}
            </a>
          </p>
          <nav className="footer-utilities" aria-label="Links do rodapé">
            <a
              href={PROGRAM.links.repository}
              target="_blank"
              rel="noreferrer"
              title="Código-fonte deste app no GitHub"
            >
              Projeto
            </a>
            <a
              href={PROGRAM.sheet.blankTemplatePdf}
              target="_blank"
              rel="noreferrer"
              title="Abrir o modelo oficial em branco (PDF)"
            >
              Modelo em branco
            </a>
            <button type="button" onClick={onHelp}>
              Ajuda
            </button>
            {PROGRAM.links.feedbackForm && (
              <button type="button" onClick={onFeedback}>
                Avaliar o site
              </button>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}
