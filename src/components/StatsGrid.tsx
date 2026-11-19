"use client";

import { useId, useState } from "react";
import { PROGRAM } from "@/config/program";
import type { Activity } from "@/types";
import { formatDuration, formatTotalHours, sumSynchronousMinutes } from "@/lib/pet-calculator";
import { getMonthWeekBands, todayInBrasilia } from "@/lib/weeks";
import { ChoiceGroup } from "@/components/ui/choice-group";

interface StatsGridProps {
  totalMinutes: number;
  activitiesCount: number;
  targetHours?: number;
  monthLabel?: string;
  /** Mês (AAAA-MM) e atividades: necessários para a visão semanal. */
  monthKey?: string;
  activities?: Pick<Activity, "date" | "start" | "end" | "modality">[];
}

/** Preferência de tela (não é dado da folha): lembra Mensal ou Semanal. */
export const SUMMARY_VIEW_KEY = "pet_folha_summary_view";
type SummaryView = "monthly" | "weekly";

function readView(): SummaryView {
  try {
    if (typeof window === "undefined") return "monthly";
    return localStorage.getItem(SUMMARY_VIEW_KEY) === "weekly" ? "weekly" : "monthly";
  } catch {
    return "monthly";
  }
}

function saveView(view: SummaryView) {
  try {
    localStorage.setItem(SUMMARY_VIEW_KEY, view);
  } catch {
    // Sem armazenamento a escolha vale só nesta tela.
  }
}

/**
 * Faixa de horas do mês: número grande, meta e, ao lado, a barra até o
 * mínimo mensal (Mensal) ou as faixas de semana (Semanal). A CH é somada em
 * minutos exatos (regra do PET-SD).
 */
export function StatsGrid({
  totalMinutes,
  activitiesCount,
  targetHours = PROGRAM.monthlyTargetHours,
  monthLabel,
  monthKey,
  activities = [],
}: StatsGridProps) {
  const [view, setView] = useState<SummaryView>(readView);
  const toggleId = useId();
  const targetMinutes = targetHours * 60;
  // Um só valor arredondado: aria-valuenow nunca passa de aria-valuemax
  // (32h05 dava 32,1 contra máximo de 32,08).
  const currentHours = Math.round((totalMinutes / 60) * 10) / 10;
  const progress = Math.min(
    100,
    Math.max(0, (totalMinutes / targetMinutes) * 100),
  );
  // Das 32 h, no mínimo 16 h síncronas/In Loco: a meta só fecha com as duas.
  const syncTargetHours = PROGRAM.synchronousTargetHours;
  const syncTargetMinutes = syncTargetHours * 60;
  const syncMinutes = sumSynchronousMinutes(activities);
  const syncHours = Math.round((syncMinutes / 60) * 10) / 10;
  // Mesma escala da barra (32 h): o trecho síncrono fica por cima do total.
  const syncProgress = Math.min(progress, Math.max(0, (syncMinutes / targetMinutes) * 100));
  const syncMarker = Math.min(100, (syncTargetMinutes / targetMinutes) * 100);
  const syncReached = syncMinutes >= syncTargetMinutes;
  const totalReached = totalMinutes >= targetMinutes;
  const reached = totalReached && syncReached;
  // "19 horas" vira "19" + "de 32 h"; "1h30" já traz a unidade.
  const [amount] = formatTotalHours(totalMinutes).split(" ");
  const weekly = PROGRAM.weeklyReferenceHours;
  const weekMinutes = weekly * 60;
  const bands =
    view === "weekly" && monthKey
      ? getMonthWeekBands(monthKey, activities, todayInBrasilia())
      : [];
  return (
    <section
      className="frequency-summary"
      aria-label="Resumo da frequência"
      data-reached={reached}
      data-view={view}
    >
      <div className="summary-total">
        <span>CH no mês</span>
        <p>
          <strong>{amount}</strong>
          <span className="summary-target">de {targetHours} h</span>
        </p>
        <span className="summary-remaining">
          {reached
            ? "Mínimo mensal alcançado"
            : totalReached
              ? `${targetHours} h alcançadas; faltam ${formatDuration(syncTargetMinutes - syncMinutes)} síncronas/In Loco`
              : `Faltam ${formatDuration(targetMinutes - totalMinutes)} para o mínimo mensal`}
        </span>
      </div>
      <div className="summary-progress">
        <div className="summary-progress-head">
          <strong>
            {activitiesCount}{" "}
            {activitiesCount === 1 ? "atividade" : "atividades"}
          </strong>
          {monthKey && (
            <>
              <span className="sr-only" id={toggleId}>
                Visão do resumo
              </span>
              <ChoiceGroup
                name="summary-view"
                labelledBy={toggleId}
                variant="toggle"
                className="summary-view-toggle"
                value={view}
                onChange={(value) => {
                  const next = value === "weekly" ? "weekly" : "monthly";
                  setView(next);
                  saveView(next);
                }}
                options={[
                  { value: "monthly", label: "Mensal" },
                  { value: "weekly", label: "Semanal" },
                ]}
              />
            </>
          )}
        </div>
        {view === "weekly" && monthKey ? (
          <>
            <ol className="week-bands" aria-label={`CH por semana em ${monthLabel ?? monthKey}`}>
              {bands.map((band) => {
                const width = Math.min(100, (band.minutes / weekMinutes) * 100);
                return (
                  <li
                    key={band.start}
                    className="week-band"
                    data-current={band.isCurrent}
                    data-partial={band.partial}
                    aria-current={band.isCurrent ? "date" : undefined}
                  >
                    <div className="week-band-head">
                      <strong>
                        <span className="sr-only">Semana: </span>
                        {band.label}
                      </strong>
                      {band.isCurrent && <span className="week-band-tag">Semana atual</span>}
                      <span className="week-band-value">
                        {formatDuration(band.minutes)} de {weekly} h
                      </span>
                    </div>
                    <div className="week-band-track" aria-hidden="true">
                      <span style={{ width: `${width}%` }} />
                    </div>
                    {band.partial && (
                      <small className="week-band-note">Semana parcial</small>
                    )}
                  </li>
                );
              })}
            </ol>
            {/* Meta síncrona também na Semanal: barra única de 16 h, mesma cor da Mensal. */}
            <div
              className="progress-track progress-track--sync"
              role="progressbar"
              aria-label={`CH síncrona/In Loco em relação ao mínimo de ${syncTargetHours} h`}
              aria-valuenow={syncHours}
              aria-valuemin={0}
              aria-valuemax={Math.max(syncTargetHours, syncHours)}
              aria-valuetext={`${formatTotalHours(syncMinutes)} de ${syncTargetHours} h`}
            >
              {syncMinutes > 0 && (
                <span
                  className="progress-sync"
                  style={{ width: `${Math.min(100, (syncMinutes / syncTargetMinutes) * 100)}%` }}
                />
              )}
            </div>
            <p className="summary-sync" data-reached={syncReached}>
              <span className="summary-swatch summary-swatch--sync" aria-hidden="true" />
              Síncronas/In Loco no mês: <strong>{formatDuration(syncMinutes)}</strong> de{" "}
              {syncTargetHours} h
            </p>
            <p className="summary-rule">
              Semanas de segunda a domingo, com a CH exata de cada uma. Nas
              semanas parciais do início e do fim do mês, a semana continua no
              mês vizinho: a referência de {weekly} h vale para a semana
              inteira e não é reduzida. Para a folha vale o mínimo de{" "}
              {targetHours} h no mês.
            </p>
          </>
        ) : (
          <>
            <div
              className="progress-track"
              role="progressbar"
              aria-label={`CH do mês em relação ao mínimo de ${targetHours} h`}
              aria-valuenow={currentHours}
              aria-valuemin={0}
              aria-valuemax={Math.max(targetHours, currentHours)}
              aria-valuetext={`${formatTotalHours(totalMinutes)} de ${targetHours} h`}
            >
              <span className="progress-total" style={{ width: `${progress}%` }} />
              {syncMinutes > 0 && (
                <span className="progress-sync" style={{ width: `${syncProgress}%` }} />
              )}
              <i className="progress-marker" style={{ left: `${syncMarker}%` }} aria-hidden="true" />
            </div>
            <div
              className="sr-only"
              role="progressbar"
              aria-label={`CH síncrona/In Loco em relação ao mínimo de ${syncTargetHours} h`}
              aria-valuenow={syncHours}
              aria-valuemin={0}
              aria-valuemax={Math.max(syncTargetHours, syncHours)}
              aria-valuetext={`${formatTotalHours(syncMinutes)} de ${syncTargetHours} h`}
            />
            <p className="summary-sync" data-reached={syncReached}>
              <span className="summary-swatch summary-swatch--sync" aria-hidden="true" />
              Síncronas/In Loco: <strong>{formatDuration(syncMinutes)}</strong> de{" "}
              {syncTargetHours} h
              <span className="summary-swatch summary-swatch--total" aria-hidden="true" />
              Total
            </p>
            <p className="summary-rule">
              Mínimo de {targetHours} h no mês, das quais {syncTargetHours} h
              em atividades síncronas ou In Loco (a marca na barra); referência
              de {PROGRAM.weeklyReferenceHours} h por semana. O excedente não
              passa para o mês seguinte. Confira a distribuição semanal antes do
              envio.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
