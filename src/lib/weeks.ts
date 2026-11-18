import type { Activity } from "@/types";
import { calcPetMinutes } from "./pet-calculator";

/**
 * Faixas de semana de um mês: semanas de **segunda a domingo** cortadas pelo
 * mês, como no app original. Novembro/2026 (dia 1 é domingo, dia 30 é
 * segunda) dá "Dia 1", "2 a 8", "9 a 15", "16 a 22", "23 a 29" e "Dia 30".
 *
 * Tudo é calculado sobre texto AAAA-MM-DD e o calendário em UTC (dia da
 * semana de Date.UTC): nenhuma conversão de fuso mexe no dia. "Hoje" vem do
 * relógio no fuso de Brasília (todayInBrasilia), não do fuso do aparelho.
 */
export interface WeekBand {
  /** Primeiro e último dia da faixa, AAAA-MM-DD. */
  start: string;
  end: string;
  /** "Dia 1", "2 a 8". */
  label: string;
  /** Dias da faixa (1 a 7). */
  days: number;
  /** A semana continua no mês anterior ou no seguinte. */
  partial: boolean;
  /** CH exata somada em minutos inteiros. */
  minutes: number;
  /** A faixa contém o dia de hoje (Brasília). */
  isCurrent: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Data de hoje no fuso de Brasília, AAAA-MM-DD. */
export function todayInBrasilia(now = new Date()): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getMonthWeekBands(
  monthKey: string,
  activities: Pick<Activity, "date" | "start" | "end">[] = [],
  today = "",
): WeekBand[] {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return [];
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return [];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // Dias desde a segunda-feira: 0 = segunda … 6 = domingo.
  const sinceMonday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

  // Minutos por dia do mês (só datas deste mês, comparadas como texto).
  const perDay = new Array<number>(lastDay + 1).fill(0);
  for (const activity of activities) {
    if (!activity.date?.startsWith(`${monthKey}-`)) continue;
    const day = Number(activity.date.slice(8, 10));
    if (day >= 1 && day <= lastDay)
      perDay[day] += calcPetMinutes(activity.start, activity.end);
  }
  const todayDay = today.startsWith(`${monthKey}-`) ? Number(today.slice(8, 10)) : 0;

  const bands: WeekBand[] = [];
  let startDay = 1;
  let end = Math.min(lastDay, 7 - sinceMonday);
  while (startDay <= lastDay) {
    const days = end - startDay + 1;
    let minutes = 0;
    for (let day = startDay; day <= end; day++) minutes += perDay[day];
    bands.push({
      start: `${monthKey}-${pad(startDay)}`,
      end: `${monthKey}-${pad(end)}`,
      label: days === 1 ? `Dia ${startDay}` : `${startDay} a ${end}`,
      days,
      partial: days < 7,
      minutes,
      isCurrent: todayDay >= startDay && todayDay <= end,
    });
    startDay = end + 1;
    end = Math.min(lastDay, startDay + 6);
  }
  return bands;
}
