import type { Activity } from "@/types";
import {
  calcPetMinutes,
  formatDayMonth,
  isValidDate,
  lastDayOfMonthKey,
  todayInBrasilia,
} from "./pet-calculator";

export { todayInBrasilia };

/**
 * Faixas de semana de uma folha: semanas de **segunda a domingo**.
 *
 * O período é o mês da folha, estendido até as atividades lançadas fora dele
 * (datas livres: há GATs que fecham a folha de 26 a 25, outros de 20 a 19).
 * Assim a soma das faixas é sempre o total da folha.
 *
 * - Só o mês: rótulos curtos, como no app original. Novembro/2026 (dia 1 é
 *   domingo) dá "Dia 1", "2 a 8", "9 a 15", "16 a 22", "23 a 29", "Dia 30".
 * - Período que passa do mês: rótulos com dia e mês ("26/10 a 01/11").
 *
 * Tudo é calculado sobre texto AAAA-MM-DD e o calendário em UTC (dia da
 * semana de Date.UTC): nenhuma conversão de fuso mexe no dia. "Hoje" vem do
 * relógio no fuso de Brasília (todayInBrasilia), não do fuso do aparelho.
 */
export interface WeekBand {
  /** Primeiro e último dia da faixa, AAAA-MM-DD. */
  start: string;
  end: string;
  /** "Dia 1", "2 a 8" ou "26/10 a 01/11". */
  label: string;
  /** Dias da faixa (1 a 7). */
  days: number;
  /** A semana continua fora do período (antes do início ou depois do fim). */
  partial: boolean;
  /** CH exata somada em minutos inteiros. */
  minutes: number;
  /** A faixa contém o dia de hoje (Brasília). */
  isCurrent: boolean;
}

const DAY_MS = 86_400_000;

function toUtc(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtc(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function getMonthWeekBands(
  monthKey: string,
  activities: Pick<Activity, "date" | "start" | "end">[] = [],
  today = "",
): WeekBand[] {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return [];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return [];

  // Minutos por dia (datas válidas) e período: o mês + as datas de fora.
  const perDay = new Map<string, number>();
  let first = `${monthKey}-01`;
  let last = lastDayOfMonthKey(monthKey);
  for (const activity of activities) {
    const date = activity.date ?? "";
    if (!isValidDate(date)) continue;
    perDay.set(date, (perDay.get(date) ?? 0) + calcPetMinutes(activity.start, activity.end));
    if (date < first) first = date;
    if (date > last) last = date;
  }
  const short = first.startsWith(`${monthKey}-`) && last.startsWith(`${monthKey}-`);
  const label = (start: string, end: string, days: number) =>
    short
      ? days === 1
        ? `Dia ${Number(start.slice(8))}`
        : `${Number(start.slice(8))} a ${Number(end.slice(8))}`
      : days === 1
        ? formatDayMonth(start)
        : `${formatDayMonth(start)} a ${formatDayMonth(end)}`;

  const bands: WeekBand[] = [];
  const lastTime = toUtc(last);
  let bandStart = toUtc(first);
  while (bandStart <= lastTime) {
    // Dias até o domingo: getUTCDay 0 = domingo … 6 = sábado.
    const toSunday = (7 - new Date(bandStart).getUTCDay()) % 7;
    const bandEnd = Math.min(lastTime, bandStart + toSunday * DAY_MS);
    const days = Math.round((bandEnd - bandStart) / DAY_MS) + 1;
    let minutes = 0;
    for (let time = bandStart; time <= bandEnd; time += DAY_MS)
      minutes += perDay.get(fromUtc(time)) ?? 0;
    const start = fromUtc(bandStart);
    const end = fromUtc(bandEnd);
    bands.push({
      start,
      end,
      label: label(start, end, days),
      days,
      partial: days < 7,
      minutes,
      isCurrent: today !== "" && today >= start && today <= end,
    });
    bandStart = bandEnd + DAY_MS;
  }
  return bands;
}
