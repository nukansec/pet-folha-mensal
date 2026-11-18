"use client";

import { useEffect, useState } from "react";
import { Download, Trash2, X } from "lucide-react";
import type { UserProfile } from "@/types";
import { pluralize } from "@/lib/pet-calculator";
import { Modal } from "./Modal";

export interface DeleteProfileSummary {
  months: number;
  activities: number;
  /** null = o navegador não conseguiu ler os comprovantes. */
  attachments: number | null;
}

interface DeleteProfileModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  summary: DeleteProfileSummary | null;
  onClose: () => void;
  onSaveCopy: () => Promise<boolean>;
  onConfirm: () => Promise<boolean>;
}

/**
 * Confirmação de exclusão de perfil: mostra o que será apagado, oferece a
 * cópia do perfil inteiro antes e só exclui pelo botão de perigo.
 */
export function DeleteProfileModal({
  isOpen,
  profile,
  summary,
  onClose,
  onSaveCopy,
  onConfirm,
}: DeleteProfileModalProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Each profile starts without a copy.
    setCopied(false);
  }, [profile?.id]);

  if (!isOpen || !profile || !summary) return null;

  async function run(action: () => Promise<boolean>, onDone?: () => void) {
    if (busy) return;
    setBusy(true);
    try {
      if (await action()) onDone?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Excluir perfil">
      <section className="conclusion-panel delete-profile-panel">
        <div className="form-panel-heading">
          <div>
            <h2>Excluir o perfil de {profile.name}?</h2>
            <p className="access-hint">
              {profile.role} · GAT {profile.gatNumber}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <p>Serão apagados deste navegador, sem como desfazer:</p>
        <ul className="delete-profile-list">
          <li>a identificação do perfil;</li>
          <li>
            {pluralize(summary.activities, "atividade", "atividades")} em{" "}
            {pluralize(summary.months, "mês", "meses")};
          </li>
          <li>
            {summary.attachments === null
              ? "os comprovantes (o navegador não conseguiu contá-los agora)."
              : `${pluralize(summary.attachments, "comprovante", "comprovantes")}.`}
          </li>
        </ul>
        <p className="access-hint">Os outros perfis deste navegador não mudam.</p>
        <div className="conclusion-option">
          <Download size={24} aria-hidden="true" />
          <div>
            <h3>Salvar cópia antes</h3>
            <p>
              Um arquivo .json com o perfil inteiro: todos os meses e
              comprovantes. Com ele, “Restaurar cópia” traz tudo de volta.
            </p>
            {copied && (
              <p role="status">Cópia acionada. Confira o arquivo antes de excluir.</p>
            )}
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={() => void run(onSaveCopy, () => setCopied(true))}
          >
            {copied ? "Salvar outra cópia" : "Salvar cópia antes"}
          </button>
        </div>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="danger-button"
            disabled={busy}
            onClick={() => void run(onConfirm)}
          >
            <Trash2 size={18} aria-hidden="true" />
            Excluir perfil
          </button>
        </div>
      </section>
    </Modal>
  );
}
