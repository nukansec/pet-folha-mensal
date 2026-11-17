"use client";

import { PROGRAM } from "@/config/program";
import { formatDuration, formatTotalHours } from "@/lib/pet-calculator";

interface StatsGridProps {
  totalMinutes: number;
  activitiesCount: number;
  targetHours?: number;
}

export function StatsGrid({
  totalMinutes,
  activitiesCount,
  targetHours = PROGRAM.monthlyTargetHours,
}: StatsGridProps) {
  const targetMinutes = targetHours * 60;
  const progress = Math.min(
    100,
    Math.max(0, (totalMinutes / targetMinutes) * 100),
  );
  const [amount, unit] = formatTotalHours(totalMinutes).split(" ");
  return (
    <section className="frequency-summary" aria-label="Resumo da frequência"
      title={`Mínimo de ${targetHours}h no mês; o excedente não passa para o mês seguinte. Referência: ${PROGRAM.weeklyReferenceHours}h por semana. Confira a distribuição semanal antes do envio.`}>
      <div className="summary-total">
        <span>CH no mês</span>
        <p>
          <strong>{amount}</strong>
          {unit && <span>{unit}</span>}
        </p>
      </div>
      <div className="summary-progress">
        <div>
          <strong>
            {activitiesCount}{" "}
            {activitiesCount === 1 ? "atividade" : "atividades"}
          </strong>
          <span>
            {totalMinutes >= targetMinutes
              ? "Mínimo mensal alcançado"
              : `${formatDuration(targetMinutes - totalMinutes)} para o mínimo mensal`}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Mínimo mensal de horas"
          aria-valuenow={Math.round((totalMinutes / 60) * 10) / 10}
          aria-valuemin={0}
          aria-valuemax={Math.max(targetHours, totalMinutes / 60)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
