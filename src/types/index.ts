import { PROGRAM } from "@/config/program";

export type UserRole = string;

/** Perfis da ficha oficial, na ordem das caixas. */
export const DEFAULT_ROLES: string[] = [...PROGRAM.roles];

export interface GATInfo {
  number: string;
  name: string;
  fullName: string;
  axis: string;
  description: string;
}

export const DEFAULT_GATS: Record<string, GATInfo> = Object.fromEntries(
  Object.values(PROGRAM.gats).map((gat) => [
    gat.number,
    { ...gat, fullName: `GAT ${gat.number} (${gat.name})` },
  ]),
);

export const GATS = DEFAULT_GATS;

/** Modalidade da atividade; os valores válidos vêm de PROGRAM.modalities. */
export type ModalityType = string;

export interface ActivityTemplate {
  id: string;
  name: string; // nome da atividade (ex.: "Reunião semanal do GAT {gatNumber}")
  modality: ModalityType;
  local: string; // Unidade/Local sugerido
  isGatSpecific?: boolean;
}

export interface Activity {
  id: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  modality: ModalityType;
  /** Coluna "Atividade Desenvolvida" da ficha. */
  description: string;
  /** Coluna "Unidade/Local" da ficha ("" quando não se aplica). */
  local: string;
  /** Coluna "Descrição" da ficha (detalhes, pautas, produtos). */
  descricao: string;
  /** CH em horas decimais (minutos / 60). O total do mês soma minutos. */
  hours: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  gatNumber: string;
  gatName?: string;
  createdAt: string;
}

export interface MonthRecord {
  monthYear: string; // ex: "Outubro/2026"
  monthKey: string; // ex: "2026-10"
  activities: Activity[];
}
