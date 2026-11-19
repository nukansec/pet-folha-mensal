"use client";

import { Modal } from "./Modal";
import React, { useState, useEffect } from "react";
import { Activity, ActivityTemplate } from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  cleanActivityDescription,
  isDateAllowed,
} from "@/lib/pet-calculator";
import { X, Check, Edit3 } from "lucide-react";
import { useDialog } from "@/context/DialogContext";
import { ActivityFields, type ActivityDraft } from "./ActivityFields";

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onSave: (data: ActivityDraft, editingId?: string) => boolean | void;
  defaultGatNumber?: string;
  defaultGatName?: string;
  templates?: ActivityTemplate[];
  monthKey?: string;
}

function toDraft(activity: Activity): ActivityDraft {
  return {
    date: activity.date,
    start: activity.start,
    end: activity.end,
    modality: activity.modality,
    local: activity.local ?? "",
    description: cleanActivityDescription(activity.description),
    descricao: activity.descricao ?? "",
  };
}

/**
 * Edição de uma atividade com os mesmos campos do formulário principal
 * (ActivityFields). Cabeçalho e botões ficam fixos; só o meio rola.
 */
export function EditActivityModal({
  isOpen,
  onClose,
  activity,
  onSave,
  defaultGatNumber = PROGRAM.defaultGat,
  defaultGatName,
  templates = [],
  monthKey,
}: EditActivityModalProps) {
  const { alert } = useDialog();
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    if (activity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset modal fields when the selected record or open state changes.
      setDraft(toDraft(activity));
      setTemplateId("");
    }
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;
  // Primeiro render antes do efeito: usa o registro direto.
  const values = draft ?? toDraft(activity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDesc = cleanActivityDescription(values.description);

    if (!cleanDesc) {
      await alert({
        title: "Atividade obrigatória",
        message: "Informe a atividade desenvolvida.",
        variant: "warning",
      });
      return;
    }

    if (calcPetMinutes(values.start, values.end) <= 0) {
      await alert({
        title: "Horário inválido",
        message: "Confira os horários: o fim não pode ser igual ao início, e uma atividade que passa da meia-noite pode durar até 12 h.",
        variant: "warning",
      });
      return;
    }

    if (!isDateAllowed(values.date)) {
      await alert({
        title: "Confira a data",
        message: "Informe uma data válida dentro da vigência do programa.",
        variant: "warning",
      });
      return;
    }

    const saved = onSave(
      {
        ...values,
        local: values.local.trim(),
        description: cleanDesc,
        descricao: values.descricao.trim(),
      },
      activity.id,
    );

    if (saved !== false) onClose();
    else
      await alert({
        title: "Atividade não salva",
        message:
          "Não foi possível gravar. O preenchimento foi mantido. Verifique o armazenamento do navegador e tente novamente.",
        variant: "warning",
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Editar atividade">
      {/* O diálogo (nome e modal) é o <Modal>; aqui é só o painel. */}
      <div className="dialog-panel edit-activity-panel">
        <div className="dialog-head">
          <span className="dialog-head-icon" aria-hidden="true">
            <Edit3 size={16} />
          </span>
          <div className="dialog-head-text">
            <h3>Editar atividade</h3>
            <p>Atualize horários, local, modalidade ou descrição.</p>
          </div>
          <button
            aria-label="Fechar"
            type="button"
            onClick={onClose}
            className="icon-button dialog-close"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-body activity-fields">
            <ActivityFields
              idPrefix="edit-activity"
              draft={values}
              onChange={(patch) => setDraft({ ...values, ...patch })}
              templates={templates}
              templateId={templateId}
              onTemplateChange={setTemplateId}
              gatNumber={defaultGatNumber}
              gatName={defaultGatName}
              monthKey={monthKey}
            />
          </div>
          <div className="dialog-actions dialog-footer">
            <button type="button" onClick={onClose} className="secondary-button">
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              <Check size={16} />
              <span>Salvar alterações</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
