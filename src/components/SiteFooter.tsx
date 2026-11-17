"use client";

import { PROGRAM } from "@/config/program";

export function SiteFooter({
  compact = false,
  onHelp,
  onFeedback,
}: {
  compact?: boolean;
  onHelp: () => void;
  onFeedback: () => void;
}) {
  const [first, second] = PROGRAM.credits.authors;
  return (
    <footer className="site-footer screen-only compact">
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
            {!compact && (
              <>
                <a
                  href={PROGRAM.links.repository}
                  target="_blank"
                  rel="noreferrer"
                >
                  Código-fonte
                </a>
                <a href={PROGRAM.sheet.blankTemplateDocx} download>
                  Modelo em branco
                </a>
              </>
            )}
            <button onClick={onHelp}>Ajuda</button>
            {PROGRAM.links.feedbackForm && (
              <button onClick={onFeedback}>Avaliar</button>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}
