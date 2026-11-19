"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Recommendation } from "@/lib/recommendations";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  cleanActivityDescription,
  getCurrentMonth,
  getDefaultActivityDate,
  isDateAllowed,
} from "@/lib/pet-calculator";
import { Plus } from "lucide-react";
import { ActivityFields, type ActivityDraft } from "./ActivityFields";


interface ActivityFormProps {
  onSave: (data: ActivityDraft, editingId?: string) => boolean | void;
  /** Atividades já registradas, para o preenchimento rápido. */
  recommendations?: Recommendation[];
  monthKey?: string;
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * Cópia de uma atividade (Duplicar): o formulário abre com esses campos, já
   * como rascunho, e o foco vai para a Data para ajustar o dia.
   */
  initialDraft?: ActivityDraft;
  /** Avisa que a cópia já entrou no formulário (não reaparece ao remontar). */
  onInitialDraftUsed?: () => void;
}

export function ActivityForm({
  onSave,
  recommendations = [],
  monthKey = getCurrentMonth(),
  onDirtyChange,
  initialDraft,
  onInitialDraftUsed,
}: ActivityFormProps) {
  const [draft, setDraft] = useState<ActivityDraft>(() => initialDraft ?? {
    date: getDefaultActivityDate(monthKey),
    start: "",
    end: "",
    modality: PROGRAM.defaultModality,
    local: "",
    description: "",
    descricao: "",
  });
  const formRef = useRef<HTMLFormElement>(null);
  // Cópia aberta pelo Duplicar: conta como rascunho e leva o foco para a Data.
  const duplicated = useRef(Boolean(initialDraft));
  useEffect(() => {
    if (!duplicated.current) return;
    duplicated.current = false;
    onDirtyChange?.(true);
    onInitialDraftUsed?.();
    const date = formRef.current?.querySelector<HTMLInputElement>('input[type="date"]');
    date?.scrollIntoView({ block: "center" });
    date?.focus();
  }, [onDirtyChange, onInitialDraftUsed]);
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
    const dateOk = isDateAllowed(draft.date);
    if (!dateOk || !activityName || minutes <= 0) {
      setError(
        !dateOk
          ? "Informe uma data válida dentro da vigência do programa."
          : !activityName
            ? "Informe a atividade desenvolvida."
            : "Confira os horários: o fim não pode ser igual ao início, e uma atividade que passa da meia-noite pode durar até 12 h.",
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
      <form ref={formRef} onSubmit={submit} className="activity-fields">
        <div className="form-panel-heading">
          <h2 id="activity-form-title">Adicionar atividade</h2>
        </div>
        <ActivityFields
          idPrefix="activity"
          draft={draft}
          onChange={change}
          recommendations={recommendations}
          templateId={templateId}
          onTemplateChange={setTemplateId}
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
