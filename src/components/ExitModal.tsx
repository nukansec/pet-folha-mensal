"use client";

import { useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  ClipboardList,
  PenLine,
  Printer,
  X,
  ArrowRight,
  Check,
} from "lucide-react";
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
  /** Resumo da CH ("CH completa" ou o que falta), abaixo do nome. */
  hoursStatus?: string;
  hasChanges?: boolean;
  /** Texto do botão principal no menu do topo: "Trocar participante" ou "Sair". */
  leaveLabel?: string;
  /**
   * Concluir (botão do topo): o principal vira "Concluir" e volta para Minha
   * frequência sem encerrar a sessão (sair e trocar ficam no menu do topo).
   */
  onConclude?: () => void;
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
  hoursStatus,
  hasChanges = false,
  leaveLabel = "Sair / trocar participante",
  onConclude,
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
            {hoursStatus && <p className="access-hint">{hoursStatus}</p>}
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
              Imprima ou salve em PDF (papel Carta, horizontal), ou baixe em
              Word para completar à mão.
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
              title="Imprimir ou salvar em PDF (na janela de impressão, escolha Salvar como PDF)"
            >
              <Printer size={16} aria-hidden="true" /> Imprimir
            </button>
            {onDownloadDocx && (
              <button
                className="secondary-button"
                disabled={busy}
                onClick={() => void download("docx")}
              >
                <Download size={16} aria-hidden="true" /> Baixar .docx
              </button>
            )}
          </div>
        </div>
        {/* Assinatura separada: vem depois de gerar o PDF ou o .docx. */}
        <div className="conclusion-option">
          <PenLine size={24} aria-hidden="true" />
          <div>
            <h3>Assinatura eletrônica</h3>
            <p>Assine o documento online após gerar o arquivo PDF ou .docx.</p>
          </div>
          <a
            className="secondary-button"
            href={PROGRAM.links.govSignature}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Assinar no gov.br (abre em nova aba)"
          >
            <ExternalLink size={16} aria-hidden="true" /> Assinar no gov.br
          </a>
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
        {/* No Concluir, a Cópia de segurança já diz isso; sobra espaço no celular. */}
        {!onConclude && (
          <p className="local-note">
            Salve a cópia para proteger seus dados e continuar em outro aparelho.
          </p>
        )}
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
          {onConclude ? (
            <button className="primary-button" disabled={busy} onClick={onConclude}>
              <Check size={18} aria-hidden="true" /> Concluir
            </button>
          ) : (
            <button className="primary-button" disabled={busy} onClick={leave}>
              {leaveLabel} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </section>
    </Modal>
  );
}
