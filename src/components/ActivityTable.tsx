"use client";

import { useState } from "react";
import { Activity, UserProfile } from "@/types";
import {
  calcPetMinutes,
  cleanActivityDescription,
  formatDateBR,
  formatDuration,
  formatTotalHours,
  pluralize,
} from "@/lib/pet-calculator";
import { Pencil, Trash2, ListChecks } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

interface ActivityTableProps {
  activities: Activity[];
  totalMinutes: number;
  editingId: string | null;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
  user: UserProfile;
  monthLabel: string;
  onLoadSamples: () => void;
  onClearMonth: () => void;
}

export function ActivityTable({
  activities,
  totalMinutes,
  editingId,
  onEdit,
  onDelete,
  user,
  monthLabel,
  onLoadSamples,
  onClearMonth,
}: ActivityTableProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const visibleActivities = activities;
  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Descrição em até 2 linhas; “ver mais” só quando o texto passa do limite.
  const detail = (activity: Activity, place: "card" | "row") => {
    if (!activity.descricao) return null;
    const id = `detail-${place}-${activity.id}`;
    const open = expanded.has(activity.id);
    const long = activity.descricao.length > 90 || activity.descricao.includes("\n");
    const Tag = place === "card" ? "p" : "small";
    return (
      <>
        <Tag id={id} className="record-detail" data-expanded={open}>
          {activity.descricao}
        </Tag>
        {long && (
          <button
            type="button"
            className="detail-toggle"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => toggle(activity.id)}
          >
            {open ? "ver menos" : "ver mais"}
          </button>
        )}
      </>
    );
  };
  const actions = (activity: Activity) => {
    return (
      <div className="record-actions">
        <button
          className="icon-button"
          onClick={() => onEdit(activity)}
          aria-label={`Editar atividade: ${cleanActivityDescription(activity.description)}`}
          title="Editar"
        >
          <Pencil size={18} />
        </button>
        <button
          className="icon-button"
          onClick={() => onDelete(activity.id)}
          aria-label={`Excluir atividade: ${cleanActivityDescription(activity.description)}`}
          title="Excluir"
        >
          <Trash2 size={18} />
        </button>
      </div>
    );
  };
  return (
    <section className="activity-list" aria-labelledby="records-title">
      <div className="records-heading">
        <div>
          <ListChecks size={20} aria-hidden="true" />
          <h2 id="records-title">Atividades do mês</h2>
          <span>{activities.length}</span>
        </div>
        {activities.length > 0 && (
          <div className="records-tools">
            <button
              className="text-button"
              onClick={() => setConfirmClear(true)}
              title={`Remover ${pluralize(activities.length, "atividade", "atividades")} de ${monthLabel}`}
            >
              Limpar mês
            </button>
          </div>
        )}
      </div>
      {activities.length === 0 ? (
        <div className="records-empty">
          <p>Use “Adicionar atividade” para começar a folha.</p>
          <a
            className="secondary-button"
            href="#nova-atividade"
            onClick={() => document.getElementById("activity-date")?.focus()}
          >
            Registrar primeira atividade
          </a>
          <details>
            <summary>Precisa de um exemplo?</summary>
            <p>
              Os exemplos são fictícios. Substitua-os pelas atividades que você
              realizou.
            </p>
            <button className="secondary-button" onClick={onLoadSamples}>
              Carregar exemplos do GAT {user.gatNumber}
            </button>
          </details>
        </div>
      ) : (
        <>
          <div className="record-cards">
            {visibleActivities.map((activity) => (
              <article
                className="record-card"
                key={activity.id}
                data-editing={editingId === activity.id}
              >
                <div className="record-meta">
                  <time dateTime={activity.date}>
                    {formatDateBR(activity.date)}
                  </time>
                  <strong>{formatDuration(calcPetMinutes(activity.start, activity.end))}</strong>
                </div>
                <h3>{cleanActivityDescription(activity.description)}</h3>
                <p>
                  {activity.start} às {activity.end} · {activity.modality}
                  {activity.local && <> · {activity.local}</>}
                </p>
                {detail(activity, "card")}
                {actions(activity)}
              </article>
            ))}
          </div>
          <div className="records-table">
            <table>
              <caption className="sr-only">Atividades de {monthLabel}</caption>
              <thead>
                <tr>
                  <th>Data e horário</th>
                  <th>Unidade/Local</th>
                  <th>Atividade</th>
                  <th>CH</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    data-editing={editingId === activity.id}
                  >
                    <td>
                      <time dateTime={activity.date}>
                        {formatDateBR(activity.date)}
                      </time>
                      <small>
                        {activity.start} às {activity.end}
                      </small>
                    </td>
                    <td>{activity.local || "-"}</td>
                    <td>
                      <strong>
                        {cleanActivityDescription(activity.description)}
                      </strong>
                      <small>{activity.modality}</small>
                      {detail(activity, "row")}
                    </td>
                    <td className="record-hours">
                      {formatDuration(calcPetMinutes(activity.start, activity.end))}
                    </td>
                    <td>{actions(activity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="records-total">
            <span>Total do mês</span>
            <strong>{formatTotalHours(totalMinutes)}</strong>
          </div>
        </>
      )}
      <ConfirmModal
        isOpen={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          onClearMonth();
          setConfirmClear(false);
        }}
        title="Limpar atividades deste mês?"
        message={`${
          activities.length === 1
            ? `A atividade de ${monthLabel} será removida.`
            : `As ${activities.length} atividades de ${monthLabel} serão removidas.`
        } Os outros meses serão preservados. Salve uma cópia antes de continuar.`}
        confirmLabel="Limpar mês"
        isDestructive
      />
    </section>
  );
}
