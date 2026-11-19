import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import type { Activity, UserProfile } from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  formatDayMonth,
  formatDuration,
  formatTotalHours,
  sortActivitiesChronologically,
  sumActivityMinutes,
} from "./pet-calculator";

/**
 * Ficha do PET-SD em .docx, preenchida a partir do modelo oficial em branco
 * (public/templates/…modelo-em-branco.docx). Mantém layout, fontes e a faixa
 * de logos do modelo; só escreve texto nas células. Tudo no navegador: nenhum
 * dado sai do aparelho.
 *
 * Estrutura do modelo (word/document.xml):
 * - tabela 1: Nome | GAT | Perfil | Mês de Referência (texto na 2ª célula);
 * - tabela 2: títulos, 12 linhas em branco e "Total de CH no mês".
 * As linhas em branco que sobram ficam para completar à mão.
 */

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOCUMENT_PATH = "word/document.xml";
const BLANK_ROWS = 12;
/** Linhas em branco depois das atividades, para completar à mão. */
const MIN_EMPTY_ROWS = 3;
/** Limite de segurança do arquivo de entrada (o modelo tem ~0,7 MB). */
const MAX_TEMPLATE_BYTES = 5 * 1024 * 1024;

export interface SheetDocxData {
  user: Pick<UserProfile, "name" | "gatNumber" | "role">;
  monthLabel: string;
  activities: Activity[];
}

/** Escapa texto para XML e remove caracteres que o XML 1.0 não aceita. */
export function xmlText(value: string): string {
  return (value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Runs de texto com quebras de linha (<w:br/>) e tabulação (<w:tab/>). */
function textRuns(value: string): string {
  return (value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .split("\t")
        .map((part) => `<w:t xml:space="preserve">${xmlText(part)}</w:t>`)
        .join("<w:tab/>"),
    )
    .join("<w:br/>");
}

/**
 * Escreve o texto no primeiro run vazio da célula. No modelo, toda célula
 * vazia tem um run só com propriedades: `<w:r …><w:rPr>…</w:rPr></w:r>`.
 * O run vazio não define fonte nem tamanho (cairia na fonte padrão do
 * documento e quebraria "24/10" em duas linhas); o texto usa as propriedades
 * da marca de parágrafo da célula (Times New Roman, 10 pt nas atividades).
 */
function fillCell(cell: string, value: string): string {
  if (!value) return cell;
  const emptyRun = /<w:r\b[^>]*>(?:<w:rPr>(?:(?!<\/w:rPr>)[\s\S])*<\/w:rPr>)?<\/w:r>/;
  if (!emptyRun.test(cell)) throw new Error("Modelo .docx inesperado: célula sem run.");
  const paragraphMark = /<w:pPr>(?:(?!<\/w:pPr>)[\s\S])*?<w:rPr>((?:(?!<\/w:rPr>)[\s\S])*)<\/w:rPr>/.exec(cell);
  const runProps = `<w:rPr>${paragraphMark?.[1] ?? ""}<w:rtl w:val="0"/></w:rPr>`;
  return cell.replace(emptyRun, () => `<w:r>${runProps}${textRuns(value)}</w:r>`);
}

function splitTables(xml: string): string[] {
  return xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? [];
}

function splitRows(table: string): string[] {
  return table.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) ?? [];
}

function splitCells(row: string): string[] {
  return row.match(/<w:tc>[\s\S]*?<\/w:tc>/g) ?? [];
}

function replaceCells(row: string, values: string[]): string {
  let index = 0;
  return row.replace(/<w:tc>[\s\S]*?<\/w:tc>/g, (cell) => fillCell(cell, values[index++] ?? ""));
}

function gatLabel(gatNumber?: string): string {
  if (!gatNumber) return "";
  const numeric = Number(gatNumber);
  return Number.isInteger(numeric) ? String(numeric) : gatNumber;
}

/** Linha de perfis com o do participante marcado: "( X ) Monitor(a)". */
export function rolesLine(role: string): string {
  return PROGRAM.roles
    .map((item) => `( ${item === role ? "X" : "  "} ) ${item}`)
    .join(" ");
}

export function activityCells(activity: Activity): string[] {
  return [
    formatDayMonth(activity.date),
    activity.local ?? "",
    activity.description ?? "",
    activity.start,
    activity.end,
    formatDuration(calcPetMinutes(activity.start, activity.end)),
    activity.modality ?? "",
    activity.descricao ?? "",
  ];
}

/** Preenche o document.xml do modelo. Lança erro se a estrutura mudar. */
export function fillDocumentXml(xml: string, data: SheetDocxData): string {
  const tables = splitTables(xml);
  if (tables.length < 2) throw new Error("Modelo .docx inesperado: faltam tabelas.");
  const [identification, activitiesTable] = tables;

  // Identificação: Nome, GAT, Perfil, Mês de Referência.
  const idRows = splitRows(identification);
  if (idRows.length !== 4 || idRows.some((row) => splitCells(row).length !== 2))
    throw new Error("Modelo .docx inesperado: identificação.");
  const name = data.user.name?.toLocaleUpperCase("pt-BR") ?? "";
  const filledId = [
    replaceCells(idRows[0], ["", name]),
    replaceCells(idRows[1], ["", gatLabel(data.user.gatNumber)]),
    idRows[2].replace(
      /(<w:tc>(?:(?!<\/w:tc>)[\s\S])*<\/w:tc>\s*<w:tc>(?:(?!<\/w:tc>)[\s\S])*?<w:t>)[^<]*(<\/w:t>)/,
      (_, open: string, close: string) => `${open}${xmlText(rolesLine(data.user.role))}${close}`,
    ),
    replaceCells(idRows[3], ["", data.monthLabel]),
  ];
  let newIdentification = identification;
  idRows.forEach((row, index) => {
    newIdentification = newIdentification.replace(row, () => filledId[index]);
  });

  // Atividades: uma linha por atividade e linhas em branco para completar.
  const rows = splitRows(activitiesTable);
  if (rows.length !== BLANK_ROWS + 2) throw new Error("Modelo .docx inesperado: atividades.");
  const header = rows[0];
  const blank = rows[1];
  const totalRow = rows[rows.length - 1];
  if (splitCells(blank).length !== 8) throw new Error("Modelo .docx inesperado: colunas.");
  const sorted = sortActivitiesChronologically(data.activities);
  const empty = Math.max(MIN_EMPTY_ROWS, BLANK_ROWS - sorted.length);
  const body = [
    ...sorted.map((activity) => replaceCells(blank, activityCells(activity))),
    ...Array.from({ length: empty }, () => blank),
  ].join("");
  const total = formatTotalHours(sumActivityMinutes(sorted));
  const newTotal = totalRow.replace(
    /(<w:t>)Total de CH no mês:[^<]*(<\/w:t>)/,
    (_, open: string, close: string) => `${open}${xmlText(`Total de CH no mês: ${total}`)}${close}`,
  );
  if (newTotal === totalRow) throw new Error("Modelo .docx inesperado: total.");
  const start = activitiesTable.indexOf(header);
  const end = activitiesTable.lastIndexOf(totalRow) + totalRow.length;
  const newActivities =
    activitiesTable.slice(0, start) + header + body + newTotal + activitiesTable.slice(end);

  return xml
    .replace(identification, () => newIdentification)
    .replace(activitiesTable, () => newActivities);
}

/** Recebe os bytes do modelo e devolve os bytes do .docx preenchido. */
export function fillSheetDocx(template: Uint8Array, data: SheetDocxData): Uint8Array {
  if (template.byteLength > MAX_TEMPLATE_BYTES) throw new Error("Modelo .docx grande demais.");
  const files = unzipSync(template);
  const documentXml = files[DOCUMENT_PATH];
  if (!documentXml) throw new Error("Modelo .docx sem word/document.xml.");
  const out: Zippable = {};
  for (const [path, bytes] of Object.entries(files)) {
    // Imagens já vêm comprimidas; XML e fontes comprimem bem.
    out[path] = [bytes, { level: /\.(png|jpe?g)$/i.test(path) ? 0 : 6 }];
  }
  out[DOCUMENT_PATH] = [strToU8(fillDocumentXml(strFromU8(documentXml), data)), { level: 6 }];
  return zipSync(out);
}

/** Nome do arquivo: folha-pet-sd-<nome>-<AAAA-MM>.docx. */
export function sheetDocxFilename(slug: string, monthKey: string): string {
  return `folha-pet-sd-${slug || "participante"}-${monthKey}.docx`;
}
