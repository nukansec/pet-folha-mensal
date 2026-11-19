import { Activity } from "@/types";
import { PROGRAM } from "@/config/program";

/** Maior duração aceita para uma atividade que passa da meia-noite. */
export const MAX_OVERNIGHT_MINUTES = 12 * 60;

function clockMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? "");
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return NaN;
  return hours * 60 + minutes;
}

/** Fim antes do início: a atividade termina no dia seguinte (23:00–03:00). */
export function crossesMidnight(startTimeStr: string, endTimeStr: string): boolean {
  const start = clockMinutes(startTimeStr);
  const end = clockMinutes(endTimeStr);
  return !Number.isNaN(start) && !Number.isNaN(end) && end < start;
}

/**
 * Carga horária (CH) do PET-SD: duração exata entre início e fim, em minutos.
 * Sem arredondamento: 16:30–18:00 = 90 min ("1h30"); 11:00–13:00 = 120 min ("2h").
 * Fim antes do início = a atividade passou da meia-noite e conta inteira no
 * dia em que começou: 23:00–03:00 = 240 min ("4h"). Para não transformar erro
 * de digitação (14:00–13:00) em 23 h, a virada só vale até 12 h de duração.
 * Início igual ao fim, virada acima de 12 h ou horário inválido valem 0.
 */
export function calcPetMinutes(startTimeStr: string, endTimeStr: string): number {
  const start = clockMinutes(startTimeStr);
  const end = clockMinutes(endTimeStr);
  if (Number.isNaN(start) || Number.isNaN(end) || end === start) return 0;
  if (end > start) return end - start;
  const overnight = end + 24 * 60 - start;
  return overnight <= MAX_OVERNIGHT_MINUTES ? overnight : 0;
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

/** CH em atividades síncronas ou In Loco (PROGRAM.synchronousModalities). */
export function sumSynchronousMinutes(
  activities: Pick<Activity, "start" | "end" | "modality">[],
): number {
  const synchronous = new Set(PROGRAM.synchronousModalities);
  return sumActivityMinutes(activities.filter((activity) => synchronous.has(activity.modality)));
}

/** Formato da coluna CH (h) da ficha: "2h", "1h30", "0h05". */
/** Célula da folha: campo vazio sai como "-" (linha de atividade, não a em branco). */
export function sheetCell(value: string | undefined | null): string {
  return value?.trim() ? value : "-";
}

/** "1 atividade", "3 atividades". */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

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

// ============================================================
// DATAS
// ============================================================
// Datas livres: cada GAT fecha a folha num dia (26 a 25, 20 a 19, mês do
// calendário…), então o app não recorta período. A atividade fica na folha
// em que foi lançada. Tudo em texto AAAA-MM-DD; "hoje" vem do relógio no fuso
// de Brasília, não do aparelho.

const pad2 = (value: number) => String(value).padStart(2, "0");

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

/** Chave AAAA-MM deslocada de `delta` meses. */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

/** Último dia (AAAA-MM-DD) do mês AAAA-MM. */
export function lastDayOfMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${monthKey}-${pad2(new Date(Date.UTC(year, month, 0)).getUTCDate())}`;
}

/** Data AAAA-MM-DD existente no calendário (rejeita 2026-02-30). */
export function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Datas aceitas no formulário: da vigência, com um mês de folga antes do
 * primeiro (folhas que começam no mês anterior, como 20/07 a 19/08). Evita só
 * erro de digitação no ano; dentro da vigência a data é livre.
 */
export const DATE_LIMITS = {
  min: `${shiftMonthKey(PROGRAM.firstMonth, -1)}-01`,
  max: lastDayOfMonthKey(PROGRAM.lastMonth),
};

export function isDateAllowed(value: string): boolean {
  return isValidDate(value) && value >= DATE_LIMITS.min && value <= DATE_LIMITS.max;
}

/** Folha do mês de hoje (Brasília), limitada à vigência. */
export function getCurrentMonth(now = new Date()): string {
  const current = todayInBrasilia(now).slice(0, 7);
  const first = PROJECT_MONTHS[0];
  const last = PROJECT_MONTHS[PROJECT_MONTHS.length - 1];
  return current < first ? first : current > last ? last : current;
}

/** Data sugerida no formulário: hoje (Brasília), se for do mês da folha; senão, o dia 1. */
export function getDefaultActivityDate(
  monthKey: string,
  now = new Date(),
): string {
  const today = todayInBrasilia(now);
  return today.startsWith(`${monthKey}-`) ? today : `${monthKey}-01`;
}
