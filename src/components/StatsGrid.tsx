"use client";

import { PROGRAM } from "@/config/program";

interface StatsGridProps {
  totalHours: number;
  activitiesCount: number;
  targetHours?: number;
}

export function StatsGrid({
  totalHours,
  activitiesCount,
  targetHours = PROGRAM.monthlyTargetHours,
}: StatsGridProps) {
  const progress = Math.min(100, Math.max(0, (totalHours / targetHours) * 100));
  return (
    <section className="frequency-summary" aria-label="Resumo da frequência"
      title={`Mínimo de ${PROGRAM.monthlyTargetHours}h no mês; o excedente não passa para o mês seguinte. Referência: ${PROGRAM.weeklyReferenceHours}h por semana. Confira a distribuição semanal antes do envio.`}>
      <div className="summary-total">
        <span>Horas no mês</span>
        <p>
          <strong>{totalHours}</strong>
          <span>{totalHours === 1 ? "hora" : "horas"}</span>
        </p>
      </div>
      <div className="summary-progress">
        <div>
          <strong>
            {activitiesCount}{" "}
            {activitiesCount === 1 ? "atividade" : "atividades"}
          </strong>
          <span>
            {totalHours >= targetHours
              ? "Referência mensal alcançada"
              : `${targetHours - totalHours}h para a referência mensal`}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Referência mensal de horas"
          aria-valuenow={totalHours}
          aria-valuemin={0}
          aria-valuemax={Math.max(targetHours, totalHours)}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}
