import type { Activity } from "@/types";
import { compareActivities } from "./pet-calculator";

/**
 * Preenchimento rápido a partir do histórico: as atividades que a pessoa já
 * registrou (em qualquer folha), uma por "Atividade desenvolvida", da mais
 * recente para a mais antiga. Escolher uma preenche o formulário com tudo,
 * menos a data, e a pessoa ainda clica em Adicionar (diferente de gravar).
 */
export interface Recommendation {
  /** Chave estável: a atividade desenvolvida normalizada. */
  id: string;
  /** Texto do chip. */
  label: string;
  /** Campos copiados para o formulário (sem a data). */
  fields: Pick<Activity, "start" | "end" | "modality" | "local" | "description" | "descricao">;
}

export const MAX_RECOMMENDATIONS = 8;

/** "  Reunião   GERAL " e "reunião geral" são a mesma atividade. */
export function recommendationKey(description: string): string {
  return (description ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function buildRecommendations(
  history: Activity[],
  limit = MAX_RECOMMENDATIONS,
): Recommendation[] {
  // Mais recente primeiro: data, depois início e fim (ordem inversa da folha).
  const newestFirst = [...history].sort((a, b) => compareActivities(b, a));
  const seen = new Set<string>();
  const out: Recommendation[] = [];
  for (const activity of newestFirst) {
    const id = recommendationKey(activity.description);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      label: activity.description.trim().replace(/\s+/g, " "),
      fields: {
        start: activity.start,
        end: activity.end,
        modality: activity.modality,
        local: activity.local ?? "",
        description: activity.description,
        descricao: activity.descricao ?? "",
      },
    });
    if (out.length >= limit) break;
  }
  return out;
}
