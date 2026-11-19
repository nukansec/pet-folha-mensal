"use client";

import { useState } from "react";
import { Download, FileText, ClipboardList, X, ArrowRight } from "lucide-react";
import { PROGRAM } from "@/config/program";
import { Modal } from "./Modal";

interface ExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  onDownloadJson: () => Promise<boolean> | boolean | void;
  onDownloadPdf: () => Promise<boolean> | boolean | void;
  /** Folha preenchida em Word (.docx). Sem a função, a opção não aparece. */
  onDownloadDocx?: () => Promise<boolean> | boolean | void;
  userName: string;
  hasChanges?: boolean;
  /** Texto do botão principal: Concluir usa o padrão; o menu do topo, "Trocar participante" ou "Sair". */
  leaveLabel?: string;
}

export function ExitModal(props: ExitModalProps) {
  if (!props.isOpen) return null;
  return <Conclusion {...props} />;
}

function Conclusion({
  isOpen,
  onClose,
  onConfirmExit,
  onDownloadJson,
  onDownloadPdf,
  onDownloadDocx,
  userName,
  hasChanges = false,
  leaveLabel = "Sair / trocar participante",
}: ExitModalProps) {
  const [jsonTriggered, setJsonTriggered] = useState(false);
  const [pdfTriggered, setPdfTriggered] = useState(false);
  const [docxTriggered, setDocxTriggered] = useState(false);
  const [exitWarning, setExitWarning] = useState(false);
  const [busy, setBusy] = useState(false);
  async function download(kind: "json" | "pdf" | "docx") {
    if (busy) return;
    setBusy(true);
    try {
      const result = await (kind === "json"
        ? onDownloadJson()
        : kind === "pdf"
          ? onDownloadPdf()
          : onDownloadDocx?.());
      if (result !== false) {
        if (kind === "json") setJsonTriggered(true);
        else if (kind === "pdf") setPdfTriggered(true);
        else setDocxTriggered(true);
      }
    } finally {
      setBusy(false);
    }
  }
  function leave() {
    if (hasChanges && !jsonTriggered) {
      setExitWarning(true);
      return;
    }
    onConfirmExit();
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Salvar folha e concluir">
      <section className="conclusion-panel">
        <div className="form-panel-heading">
          <div>
            <h2>Guarde sua folha</h2>
            <p className="access-hint">{userName}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="conclusion-option">
          <Download size={24} aria-hidden="true" />
          <div>
            <h3>Cópia de segurança</h3>
            <p>
              Guarde uma cópia para continuar editando em outro aparelho.
            </p>
            {jsonTriggered && (
              <p role="status">
                Ação de salvar acionada. Confira o arquivo na pasta escolhida.
              </p>
            )}
          </div>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => void download("json")}
          >
            {jsonTriggered ? "Salvar outra cópia" : "Salvar cópia"}
          </button>
        </div>
        <div className="conclusion-option">
          <FileText size={24} aria-hidden="true" />
          <div>
            <h3>Folha para assinatura</h3>
            <p>
              Salve o PDF em papel Carta na horizontal (ou em Word, para
              completar à mão) e assine pelo gov.br.
            </p>
            {pdfTriggered && (
              <p role="status">
                Impressão aberta. Salve o PDF ou imprima na janela do navegador.
              </p>
            )}
            {docxTriggered && (
              <p role="status">Download da folha em Word acionado.</p>
            )}
          </div>
          <div className="conclusion-buttons">
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => void download("pdf")}
            >
              Imprimir / salvar PDF
            </button>
            {onDownloadDocx && (
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => void download("docx")}
              >
                Baixar .docx (Word)
              </button>
            )}
            <a
              className="secondary-button"
              href={PROGRAM.links.govSignature}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Assinar no gov.br (abre em nova aba)"
            >
              Assinar no gov.br
            </a>
          </div>
        </div>
        {PROGRAM.links.activityForm && (
          <div className="conclusion-option">
            <ClipboardList size={24} aria-hidden="true" />
            <div>
              <h3>Formulário de atividades</h3>
              <p>Registre as atividades do mês no formulário do programa.</p>
            </div>
            <a className="secondary-button" href={PROGRAM.links.activityForm}
              target="_blank" rel="noopener noreferrer"
              aria-label="Abrir formulário de atividades">
              Abrir formulário
            </a>
          </div>
        )}
        <p className="local-note">
          Salve a cópia para proteger seus dados e continuar em outro aparelho.
        </p>
        {exitWarning && (
          <div className="operation-notice" role="alert">
            <p>
              Há alterações nesta sessão e você ainda não acionou a cópia.
              Deseja sair mesmo assim?
            </p>
            <button className="secondary-button" onClick={onConfirmExit}>
              {leaveLabel === "Trocar participante" ? "Trocar sem salvar cópia" : "Sair sem salvar cópia"}
            </button>
            <button
              className="secondary-button"
              onClick={() => setExitWarning(false)}
            >
              Voltar e salvar
            </button>
          </div>
        )}
        <div className="conclusion-actions">
          <button className="secondary-button" onClick={onClose}>
            Continuar editando
          </button>
          <button className="primary-button" disabled={busy} onClick={leave}>
            {leaveLabel} <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </Modal>
  );
}
