"use client";

import { useState, type FormEvent } from "react";
import { ActivityTemplate } from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  cleanActivityDescription,
  getCurrentMonth,
  getDefaultActivityDate,
} from "@/lib/pet-calculator";
import { Plus } from "lucide-react";
import { ActivityFields, type ActivityDraft } from "./ActivityFields";

// Reexportado para quem já importava daqui.
export { fillTemplateName } from "./ActivityFields";

interface ActivityFormProps {
  onSave: (data: ActivityDraft, editingId?: string) => boolean | void;
  defaultGatNumber?: string;
  defaultGatName?: string;
  templates?: ActivityTemplate[];
  monthKey?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function ActivityForm({
  onSave,
  defaultGatNumber = PROGRAM.defaultGat,
  defaultGatName,
  templates = [],
  monthKey = getCurrentMonth(),
  onDirtyChange,
}: ActivityFormProps) {
  const [draft, setDraft] = useState<ActivityDraft>(() => ({
    date: getDefaultActivityDate(monthKey),
    start: "",
    end: "",
    modality: PROGRAM.defaultModality,
    local: "",
    description: "",
    descricao: "",
  }));
  const [error, setError] = useState("");
  const [templateId, setTemplateId] = useState("");
  const minutes = calcPetMinutes(draft.start, draft.end);

  function change(patch: Partial<ActivityDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    onDirtyChange?.(true);
    setError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const activityName = cleanActivityDescription(draft.description);
    if (!draft.date.startsWith(monthKey) || !activityName || minutes <= 0) {
      setError(
        !draft.date.startsWith(monthKey)
          ? "Escolha uma data no mês desta folha."
          : !activityName
            ? "Informe a atividade desenvolvida."
            : "O fim deve ser posterior ao início.",
      );
      return;
    }
    const saved = onSave({
      ...draft,
      local: draft.local.trim(),
      description: activityName,
      descricao: draft.descricao.trim(),
    });
    if (saved !== false) {
      setDraft((current) => ({ ...current, description: "", descricao: "" }));
      setTemplateId("");
      setError("");
      onDirtyChange?.(false);
    }
  }

  return (
    <section
      id="nova-atividade"
      className="activity-form form-panel"
      aria-labelledby="activity-form-title"
    >
      <form onSubmit={submit} className="activity-fields">
        <div className="form-panel-heading">
          <h2 id="activity-form-title">Adicionar atividade</h2>
        </div>
        <ActivityFields
          idPrefix="activity"
          draft={draft}
          onChange={change}
          templates={templates}
          templateId={templateId}
          onTemplateChange={setTemplateId}
          gatNumber={defaultGatNumber}
          gatName={defaultGatName}
          monthKey={monthKey}
          errorId={error ? "activity-error" : undefined}
        />
        {error && (
          <p id="activity-error" role="alert" className="inline-error">
            {error}
          </p>
        )}
        <button type="submit" className="primary-button w-full">
          <Plus size={18} />
          Adicionar atividade
        </button>
      </form>
    </section>
  );
}
