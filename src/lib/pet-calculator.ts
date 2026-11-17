import { Activity } from "@/types";
import { PROGRAM } from "@/config/program";

/**
 * Carga horária (CH) do PET-SD: duração exata entre início e fim, em minutos.
 * Sem arredondamento: 16:30–18:00 = 90 min ("1h30"); 11:00–13:00 = 120 min ("2h").
 * Fim igual ou anterior ao início, ou horário inválido, vale 0.
 */
export function calcPetMinutes(startTimeStr: string, endTimeStr: string): number {
  const toMinutes = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
    if (!match) return NaN;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return NaN;
    return hours * 60 + minutes;
  };
  const start = toMinutes(startTimeStr);
  const end = toMinutes(endTimeStr);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return end - start;
}

/** CH em horas decimais (ex.: 1.5). Para somar, prefira minutos. */
export function calcPetHours(startTimeStr: string, endTimeStr: string): number {
  return calcPetMinutes(startTimeStr, endTimeStr) / 60;
}

/** Soma da CH do mês em minutos inteiros (evita erro de ponto flutuante). */
export function sumActivityMinutes(activities: Pick<Activity, "start" | "end">[]): number {
  return activities.reduce(
    (total, activity) => total + calcPetMinutes(activity.start, activity.end),
    0,
  );
}

/** Formato da coluna CH (h) da ficha: "2h", "1h30", "0h05". */
export function formatDuration(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  return minutes ? `${hours}h${String(minutes).padStart(2, "0")}` : `${hours}h`;
}

/** Total do mês: "34 horas", "1 hora" ou "33h30" quando há minutos. */
export function formatTotalHours(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  if (safe % 60) return formatDuration(safe);
  const hours = safe / 60;
  return `${hours} ${hours === 1 ? "hora" : "horas"}`;
}

/** Data no formato da ficha: "dd/mm". */
export function formatDayMonth(dateStr: string): string {
  const parts = (dateStr || "").split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getMonthYearLabel(monthKey: string): string {
  // monthKey: "2026-09"
  const [year, month] = monthKey.split("-");
  const monthNames: Record<string, string> = {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  };
  return `${monthNames[month] || month}/${year}`;
}

/**
 * Normaliza e limpa a descrição da atividade removendo sufixo redundante de modalidade
 * Ex: "Reunião de alinhamento (Assíncrona)" -> "Reunião de alinhamento"
 * "Reunião do GAT 01 (frente de TI)" -> "Reunião do GAT 01 (frente de TI)" (preserva parênteses legítimos)
 */
export function cleanActivityDescription(desc: string): string {
  if (!desc) return "";
  return desc
    .replace(
      /\s*\(\s*(s[íi]ncrona\s+virtual|s[íi]ncrona\s+presencial|ass[íi]ncrona\s+virtual|ass[íi]ncrona|intera[çc][ãa]o em tempo real \(s[íi]ncrona\))\s*\)\s*$/i,
      "",
    )
    .trim();
}

/**
 * Compara duas atividades por critério estritamente cronológico:
 * 1. Data (YYYY-MM-DD)
 * 2. Horário de início / entrada (HH:MM)
 * 3. Horário de término / saída (HH:MM)
 */
export function compareActivities(a: Activity, b: Activity): number {
  if (a.date !== b.date) {
    return a.date.localeCompare(b.date);
  }
  if (a.start !== b.start) {
    return a.start.localeCompare(b.start);
  }
  return a.end.localeCompare(b.end);
}

/**
 * Ordenação cronológica estável utilizando o algoritmo Merge Sort (Divisão e Conquista).
 * Complexidade temporal: O(n log n) garantida.
 */
export function sortActivitiesChronologically(
  activities: Activity[],
): Activity[] {
  if (activities.length <= 1) return [...activities];

  const mid = Math.floor(activities.length / 2);
  const left = sortActivitiesChronologically(activities.slice(0, mid));
  const right = sortActivitiesChronologically(activities.slice(mid));

  return mergeActivities(left, right);
}

function mergeActivities(left: Activity[], right: Activity[]): Activity[] {
  const result: Activity[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (compareActivities(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }

  while (i < left.length) {
    result.push(left[i]);
    i++;
  }

  while (j < right.length) {
    result.push(right[j]);
    j++;
  }

  return result;
}

/** Meses selecionáveis, do primeiro ao último mês da vigência (config). */
export const PROJECT_MONTHS: string[] = (() => {
  const [firstYear, firstMonth] = PROGRAM.firstMonth.split("-").map(Number);
  const months: string[] = [];
  for (let index = 0; ; index++) {
    const date = new Date(firstYear, firstMonth - 1 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push(key);
    if (key >= PROGRAM.lastMonth || index > 120) break;
  }
  return months;
})();

export function getCurrentMonth(now = new Date()): string {
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const first = PROJECT_MONTHS[0];
  const last = PROJECT_MONTHS[PROJECT_MONTHS.length - 1];
  return current < first ? first : current > last ? last : current;
}

export function getDefaultActivityDate(
  monthKey: string,
  now = new Date(),
): string {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return today.startsWith(monthKey) ? today : `${monthKey}-01`;
}
