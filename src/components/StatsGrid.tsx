"use client";

import { PROGRAM } from "@/config/program";
import { formatDuration, formatTotalHours } from "@/lib/pet-calculator";

interface StatsGridProps {
  totalMinutes: number;
  activitiesCount: number;
  targetHours?: number;
  monthLabel?: string;
}

/**
 * Faixa de horas do mês: número grande, meta e barra de progresso até o
 * mínimo mensal. A CH é somada em minutos exatos (regra do PET-SD).
 */
export function StatsGrid({
  totalMinutes,
  activitiesCount,
  targetHours = PROGRAM.monthlyTargetHours,
  monthLabel,
}: StatsGridProps) {
  const targetMinutes = targetHours * 60;
  const progress = Math.min(
    100,
    Math.max(0, (totalMinutes / targetMinutes) * 100),
  );
  const reached = totalMinutes >= targetMinutes;
  // "19 horas" vira "19" + "de 32 h"; "1h30" já traz a unidade.
  const [amount] = formatTotalHours(totalMinutes).split(" ");
  return (
    <section
      className="frequency-summary"
      aria-label="Resumo da frequência"
      data-reached={reached}
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
            : `Faltam ${formatDuration(targetMinutes - totalMinutes)} para o mínimo mensal`}
        </span>
      </div>
      <div className="summary-progress">
        <div className="summary-progress-head">
          <strong>
            {activitiesCount}{" "}
            {activitiesCount === 1 ? "atividade" : "atividades"}
          </strong>
          {monthLabel && <span>{monthLabel}</span>}
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label={`CH do mês em relação ao mínimo de ${targetHours} h`}
          aria-valuenow={Math.round((totalMinutes / 60) * 10) / 10}
          aria-valuemin={0}
          aria-valuemax={Math.max(targetHours, totalMinutes / 60)}
          aria-valuetext={`${formatTotalHours(totalMinutes)} de ${targetHours} h`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="summary-rule">
          Mínimo de {targetHours} h no mês (referência de{" "}
          {PROGRAM.weeklyReferenceHours} h por semana); o excedente não passa
          para o mês seguinte. Confira a distribuição semanal antes do envio.
        </p>
      </div>
    </section>
  );
}
