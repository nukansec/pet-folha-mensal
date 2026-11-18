"use client";

import { useState, type FormEvent } from "react";
import { Activity, ModalityType, ActivityTemplate } from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  cleanActivityDescription,
  formatDuration,
  getCurrentMonth,
  getDefaultActivityDate,
} from "@/lib/pet-calculator";
import { Plus } from "lucide-react";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { ModalityChoice } from "./ModalityChoice";

interface ActivityFormProps {
  onSave: (
    data: Omit<Activity, "id" | "hours">,
    editingId?: string,
  ) => boolean | void;
  defaultGatNumber?: string;
  defaultGatName?: string;
  templates?: ActivityTemplate[];
  monthKey?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function fillTemplateName(
  name: string,
  gatNumber: string,
  gatName?: string,
) {
  return cleanActivityDescription(
    name
      .replaceAll("{gatNumber}", gatNumber)
      .replaceAll("{gatName}", gatName || `GAT ${gatNumber}`),
  );
}

export function ActivityForm({
  onSave,
  defaultGatNumber = PROGRAM.defaultGat,
  defaultGatName,
  templates = [],
  monthKey = getCurrentMonth(),
  onDirtyChange,
}: ActivityFormProps) {
  const [date, setDate] = useState(() => getDefaultActivityDate(monthKey));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [modality, setModality] = useState<ModalityType>(
    PROGRAM.defaultModality,
  );
  const [local, setLocal] = useState("");
  const [description, setDescription] = useState("");
  const [descricao, setDescricao] = useState("");
  const [error, setError] = useState("");
  const [templateId, setTemplateId] = useState("");
  const minutes = calcPetMinutes(start, end);
  const [year, month] = monthKey.split("-").map(Number);
  const lastDate = `${monthKey}-${new Date(year, month, 0).getDate()}`;
  function dirty() {
    onDirtyChange?.(true);
    setError("");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const activityName = cleanActivityDescription(description);
    if (!date.startsWith(monthKey) || !activityName || minutes <= 0) {
      setError(
        !date.startsWith(monthKey)
          ? "Escolha uma data no mês desta folha."
          : !activityName
            ? "Informe a atividade desenvolvida."
            : "O fim deve ser posterior ao início.",
      );
      return;
    }
    const saved = onSave({
      date,
      start,
      end,
      modality,
      local: local.trim(),
      description: activityName,
      descricao: descricao.trim(),
    });
    if (saved !== false) {
      setDescription("");
      setDescricao("");
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
        {templates.length > 0 && (
          <div className="field template-field">
            <span className="field-legend" id="activity-template-label">
              Preenchimento rápido <span className="field-optional">· opcional</span>
            </span>
            <ChoiceGroup
              name="activity-template"
              labelledBy="activity-template-label"
              variant="chips"
              value={templateId}
              onChange={(value) => {
                setTemplateId(value);
                const template = templates.find((item) => item.id === value);
                if (template) {
                  setDescription(
                    fillTemplateName(
                      template.name,
                      defaultGatNumber,
                      defaultGatName,
                    ),
                  );
                  setModality(template.modality);
                  // Modelo sem local limpa o campo: não herda o do modelo anterior.
                  setLocal(template.local);
                  dirty();
                }
              }}
              options={[
                { value: "", label: "Em branco" },
                ...templates.map((template) => ({
                  value: template.id,
                  label: fillTemplateName(
                    template.name,
                    defaultGatNumber,
                    defaultGatName,
                  ),
                })),
              ]}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="activity-date">Data</label>
          <input
            id="activity-date"
            type="date"
            required
            min={`${monthKey}-01`}
            max={lastDate}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              dirty();
            }}
          />
        </div>
        <div className="time-fields">
          <div className="field">
            <label htmlFor="activity-start">Início</label>
            <input
              id="activity-start"
              type="time"
              required
              value={start}
              onChange={(event) => {
                setStart(event.target.value);
                dirty();
              }}
              aria-describedby={error ? "activity-error" : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="activity-end">Fim</label>
            <input
              id="activity-end"
              type="time"
              required
              value={end}
              onChange={(event) => {
                setEnd(event.target.value);
                dirty();
              }}
              aria-describedby={error ? "activity-error" : undefined}
            />
          </div>
          <div className="hours-preview" aria-live="polite">
            <span>CH</span>
            {/* Sem início ou fim ainda não há CH: traço neutro, sem laranja. */}
            {start && end ? (
              <strong>{formatDuration(minutes)}</strong>
            ) : (
              <strong className="is-empty">
                <span aria-hidden="true">—</span>
                <span className="sr-only">a calcular</span>
              </strong>
            )}
          </div>
        </div>
        <ModalityChoice
          id="activity-modality"
          value={modality}
          onChange={(value) => {
            setModality(value);
            dirty();
          }}
        />
        <div className="field">
          <label htmlFor="activity-local">Unidade/Local</label>
          <input
            id="activity-local"
            placeholder="Ex.: unidade de saúde, sala ou on-line"
            maxLength={300}
            value={local}
            onChange={(event) => {
              setLocal(event.target.value);
              dirty();
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="activity-description">Atividade desenvolvida</label>
          <input
            id="activity-description"
            required
            placeholder="Ex.: Reunião Geral"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setTemplateId("");
              dirty();
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="activity-descricao">Descrição</label>
          <textarea
            id="activity-descricao"
            rows={3}
            maxLength={4000}
            placeholder="Pautas, conteúdos estudados ou produtos"
            value={descricao}
            onChange={(event) => {
              setDescricao(event.target.value);
              dirty();
            }}
          />
        </div>
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
