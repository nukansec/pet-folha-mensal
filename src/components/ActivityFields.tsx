"use client";

import type { Activity, ActivityTemplate } from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  cleanActivityDescription,
  crossesMidnight,
  DATE_LIMITS,
  formatDuration,
} from "@/lib/pet-calculator";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { ModalityChoice } from "./ModalityChoice";

/** Campos editáveis de uma atividade (sem id e sem horas calculadas). */
export type ActivityDraft = Omit<Activity, "id" | "hours">;

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

export function lastDayOfMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return `${monthKey}-${new Date(year, month, 0).getDate()}`;
}

const DATE_HINT =
  "A data é livre: lance também dias do mês anterior ou do seguinte, conforme o fechamento da folha no seu GAT.";

interface ActivityFieldsProps {
  /** Prefixo dos ids: "activity" no formulário, "edit-activity" no modal. */
  idPrefix: string;
  draft: ActivityDraft;
  onChange: (patch: Partial<ActivityDraft>) => void;
  templates?: ActivityTemplate[];
  templateId: string;
  onTemplateChange: (id: string) => void;
  gatNumber?: string;
  gatName?: string;
  /** Mês da folha (AAAA-MM): limita a data ao mês. */
  monthKey?: string;
  /** id da mensagem de erro, ligado aos horários por aria-describedby. */
  errorId?: string;
}

/**
 * Campos de uma atividade, os mesmos no formulário "Adicionar atividade" e no
 * modal "Editar atividade": preenchimento rápido em pílulas, Data em linha
 * inteira, Início | Fim | CH numa linha, modalidade em grupo de opções,
 * Unidade/Local, Atividade desenvolvida e Descrição. Rótulo sempre acima do
 * campo. Um só componente evita que os dois formulários divirjam.
 */
export function ActivityFields({
  idPrefix,
  draft,
  onChange,
  templates = [],
  templateId,
  onTemplateChange,
  gatNumber = PROGRAM.defaultGat,
  gatName,
  monthKey,
  errorId,
}: ActivityFieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const minutes = calcPetMinutes(draft.start, draft.end);
  return (
    <>
      {templates.length > 0 && (
        <div className="field template-field">
          <span className="field-legend" id={id("template-label")}>
            Preenchimento rápido <span className="field-optional">· opcional</span>
          </span>
          <ChoiceGroup
            name={id("template")}
            labelledBy={id("template-label")}
            variant="chips"
            value={templateId}
            onChange={(value) => {
              onTemplateChange(value);
              const template = templates.find((item) => item.id === value);
              // "Em branco" depois de um modelo: limpa o que o modelo preencheu.
              if (!value) onChange({ description: "", local: "" });
              else if (template)
                onChange({
                  description: fillTemplateName(template.name, gatNumber, gatName),
                  modality: template.modality,
                  // Modelo sem local limpa o campo: não herda o do modelo anterior.
                  local: template.local,
                });
            }}
            options={[
              { value: "", label: "Em branco" },
              ...templates.map((template) => ({
                value: template.id,
                label: fillTemplateName(template.name, gatNumber, gatName),
              })),
            ]}
          />
        </div>
      )}
      <div className="field">
        <label htmlFor={id("date")}>Data</label>
        <input
          id={id("date")}
          type="date"
          required
          // Datas livres (cada GAT fecha a folha num dia); o limite é só a
          // vigência, contra erro de digitação no ano.
          min={DATE_LIMITS.min}
          max={DATE_LIMITS.max}
          title={monthKey ? DATE_HINT : undefined}
          value={draft.date}
          onChange={(event) => onChange({ date: event.target.value })}
        />
      </div>
      <div className="time-fields">
        <div className="field">
          <label htmlFor={id("start")}>Início</label>
          <input
            id={id("start")}
            type="time"
            required
            value={draft.start}
            onChange={(event) => onChange({ start: event.target.value })}
            aria-describedby={errorId}
          />
        </div>
        <div className="field">
          <label htmlFor={id("end")}>Fim</label>
          <input
            id={id("end")}
            type="time"
            required
            value={draft.end}
            onChange={(event) => onChange({ end: event.target.value })}
            aria-describedby={errorId}
          />
        </div>
        <div className="hours-preview" aria-live="polite">
          <span>CH</span>
          {/* Sem início ou fim ainda não há CH: traço neutro, sem laranja. */}
          {draft.start && draft.end ? (
            <strong>{formatDuration(minutes)}</strong>
          ) : (
            <strong className="is-empty">
              <span aria-hidden="true">—</span>
              <span className="sr-only">a calcular</span>
            </strong>
          )}
        </div>
      </div>
      {crossesMidnight(draft.start, draft.end) && (
        <p className="field-hint" aria-live="polite">
          {minutes > 0
            ? "Termina no dia seguinte: a CH conta inteira no dia em que começou."
            : "Passa da meia-noite com mais de 12 h: confira o início e o fim."}
        </p>
      )}
      <ModalityChoice
        id={id("modality")}
        value={draft.modality}
        onChange={(value) => onChange({ modality: value })}
      />
      <div className="field">
        <label htmlFor={id("local")}>Unidade/Local</label>
        <input
          id={id("local")}
          placeholder="Ex.: unidade de saúde, sala ou on-line"
          maxLength={300}
          value={draft.local}
          onChange={(event) => onChange({ local: event.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={id("description")}>Atividade desenvolvida</label>
        <input
          id={id("description")}
          required
          placeholder="Ex.: Reunião Geral"
          value={draft.description}
          onChange={(event) => {
            onChange({ description: event.target.value });
            onTemplateChange("");
          }}
        />
      </div>
      <div className="field">
        <label htmlFor={id("descricao")}>Descrição</label>
        <textarea
          id={id("descricao")}
          rows={3}
          maxLength={4000}
          placeholder="Pautas, conteúdos estudados ou produtos"
          value={draft.descricao}
          onChange={(event) => onChange({ descricao: event.target.value })}
        />
      </div>
    </>
  );
}
