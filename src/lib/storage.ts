import type { BackupAttachment } from "./attachments";
import {
  Activity,
  UserProfile,
  UserRole,
  GATInfo,
  DEFAULT_GATS,
  DEFAULT_ROLES,
  ActivityTemplate,
} from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetHours,
  calcPetMinutes,
  cleanActivityDescription,
  sortActivitiesChronologically,
} from "./pet-calculator";

// Sufixo _v3: atividades ganharam Unidade/Local e Descrição; modalidades e
// perfis mudaram de nome. Os dados _v2 são copiados uma vez (migrateFromV2) e
// as chaves antigas não são apagadas.
const PROFILES_KEY = "pet_folha_profiles_v3";
const ACTIVE_PROFILE_ID_KEY = "pet_folha_active_profile_id_v3";
const ACTIVITIES_PREFIX = "pet_folha_activities_v3_";
const GATS_KEY = "pet_folha_config_gats_v3";
const ROLES_KEY = "pet_folha_config_roles_v3";
const TEMPLATES_KEY = "pet_folha_config_templates_v3";
const MIGRATION_KEY = "pet_folha_migrated_from_v2";
const V2_PROFILES_KEY = "pet_folha_profiles_v2";
const V2_ACTIVE_PROFILE_ID_KEY = "pet_folha_active_profile_id_v2";
const V2_ACTIVITIES_PREFIX = "pet_folha_activities_v2_";

export const DEFAULT_PROFILES: UserProfile[] = [];

export const DEFAULT_TEMPLATES: ActivityTemplate[] = PROGRAM.templates.map(
  (template) => ({ ...template }),
);

/**
 * Nomes antigos de modalidade (formato _v2 e cópias 1.0–1.2), mapeados por
 * nome: reordenar PROGRAM.modalities não pode mudar o que um dado antigo vira.
 */
const LEGACY_MODALITIES: Record<string, string> = {
  "Síncrona virtual": "Interação em tempo real (Síncrona)",
  "Síncrona presencial": "Interação em tempo real (In Loco)",
  "Assíncrona virtual": "Assíncrona",
};

/** Nomes antigos de perfil (formato _v2 e cópias 1.0–1.2). */
const LEGACY_ROLES: Record<string, string> = {
  Estudante: "Monitor(a)",
  "Orientador de Serviço": "Orientador(a) de serviço",
  Preceptor: "Preceptor(a)",
  Tutor: "Tutor(a)",
  "Coordenador de GAT": "Coordenador(a)",
};

const text = (value: unknown): string =>
  typeof value === "string" ? value : "";

export function normalizeModality(value: unknown): string {
  const name = text(value).trim();
  if (!name) return PROGRAM.defaultModality;
  return LEGACY_MODALITIES[name] ?? name;
}

export function normalizeRole(value: unknown): string {
  const name = text(value).trim();
  return LEGACY_ROLES[name] ?? name;
}

/** Completa um registro salvo ou importado no formato atual. */
export function normalizeActivity(raw: unknown): Activity {
  const record =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};
  const start = text(record.start);
  const end = text(record.end);
  return {
    id: text(record.id),
    date: text(record.date),
    start,
    end,
    modality: normalizeModality(record.modality),
    description: cleanActivityDescription(text(record.description)),
    local: text(record.local),
    descricao: text(record.descricao),
    hours: calcPetHours(start, end),
  };
}

// ============================================================
// FUNÇÕES DE NORMALIZAÇÃO E ANTI-DUPLICIDADE
// ============================================================

export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export function deduplicateProfiles(profiles: UserProfile[]): UserProfile[] {
  const seen = new Map<string, UserProfile>();
  for (const p of profiles) {
    const key = normalizeName(p.name);
    if (!seen.has(key)) {
      seen.set(key, p);
    }
  }
  return Array.from(seen.values());
}

function removeLegacyPin(
  profile: UserProfile & { pin?: unknown },
): UserProfile {
  const cleanProfile = { ...profile };
  delete cleanProfile.pin;
  return cleanProfile;
}

// ============================================================
// MIGRAÇÃO DO FORMATO _v2
// ============================================================

// Fingerprints dos cinco perfis de exemplo distribuídos pela versão original
// (commit 208e663). Na migração, só são copiados se tiverem sido usados.
const LEGACY_EXAMPLES = new Set([
  "eb49f6bb",
  "c5c2db38",
  "85a70284",
  "759ff299",
  "78136f57",
]);

function isUntouchedLegacyExample(
  profile: Record<string, unknown>,
  activityKeys: string[],
  activeId: string | null,
): boolean {
  if (profile.id === activeId) return false;
  // Um campo extra ou qualquer chave de atividades indica uso do perfil.
  if (
    Object.keys(profile).some(
      (key) =>
        !["id", "name", "role", "gatNumber", "gatName", "createdAt", "email"].includes(key),
    )
  )
    return false;
  if (activityKeys.some((key) => key.startsWith(`${V2_ACTIVITIES_PREFIX}${profile.id}_`)))
    return false;
  const signature = JSON.stringify([
    profile.id, profile.name, profile.role, profile.gatNumber,
    profile.gatName, profile.createdAt, profile.email,
  ]);
  let hash = 2166136261;
  for (let i = 0; i < signature.length; i++) {
    hash = Math.imul(hash ^ signature.charCodeAt(i), 16777619);
  }
  return LEGACY_EXAMPLES.has((hash >>> 0).toString(16));
}

/**
 * Copia perfis e atividades do formato _v2 para o _v3 uma única vez.
 * Não apaga chaves _v2 e não sobrescreve chaves _v3 existentes.
 * GATs, perfis e modelos personalizados no _v2 pertenciam ao programa anterior
 * e não são copiados: o _v3 começa com os padrões de src/config/program.ts.
 */
export function migrateFromV2(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(MIGRATION_KEY)) return false;
    const keys = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.key(i),
    ).filter((key): key is string => typeof key === "string");
    const activityKeys = keys.filter((key) => key.startsWith(V2_ACTIVITIES_PREFIX));
    if (!keys.includes(V2_PROFILES_KEY) && activityKeys.length === 0) return false;

    const activeId = localStorage.getItem(V2_ACTIVE_PROFILE_ID_KEY);
    let legacyProfiles: unknown = [];
    try {
      legacyProfiles = JSON.parse(localStorage.getItem(V2_PROFILES_KEY) || "[]");
    } catch {
      legacyProfiles = [];
    }
    const migratedProfiles: UserProfile[] = (
      Array.isArray(legacyProfiles) ? legacyProfiles : []
    )
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null &&
          typeof item.id === "string" && typeof item.name === "string",
      )
      .filter((item) => !isUntouchedLegacyExample(item, activityKeys, activeId))
      .map((item) => {
        const profile = removeLegacyPin(item as unknown as UserProfile);
        // O nome do GAT no _v2 era do programa anterior: usa o do PET-SD.
        const gatName = DEFAULT_GATS[text(profile.gatNumber)]?.name;
        return {
          ...profile,
          role: normalizeRole(profile.role),
          ...(gatName ? { gatName } : {}),
        };
      });

    let current: unknown = [];
    try {
      current = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
    } catch {
      current = [];
    }
    localStorage.setItem(
      PROFILES_KEY,
      JSON.stringify(
        deduplicateProfiles([
          ...(Array.isArray(current)
            ? (current as unknown[]).filter(
                (item): item is UserProfile =>
                  typeof item === "object" && item !== null &&
                  typeof (item as UserProfile).name === "string",
              )
            : []),
          ...migratedProfiles,
        ]),
      ),
    );
    if (
      activeId &&
      !localStorage.getItem(ACTIVE_PROFILE_ID_KEY) &&
      migratedProfiles.some((profile) => profile.id === activeId)
    )
      localStorage.setItem(ACTIVE_PROFILE_ID_KEY, activeId);

    for (const key of activityKeys) {
      const target = ACTIVITIES_PREFIX + key.slice(V2_ACTIVITIES_PREFIX.length);
      if (localStorage.getItem(target) !== null) continue;
      let records: unknown;
      try {
        records = JSON.parse(localStorage.getItem(key) || "[]");
      } catch {
        continue;
      }
      if (!Array.isArray(records)) continue;
      const activities = records
        .filter((item) => typeof item === "object" && item !== null)
        .map(normalizeActivity);
      localStorage.setItem(
        target,
        JSON.stringify(sortActivitiesChronologically(activities)),
      );
    }
    localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// GESTÃO DE PERFIS (USUÁRIOS)
// ============================================================

export function getStoredProfiles(): UserProfile[] {
  if (typeof window === "undefined") return DEFAULT_PROFILES;
  migrateFromV2();
  try {
    const data = localStorage.getItem(PROFILES_KEY);
    if (!data) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return DEFAULT_PROFILES;

    // Remove o PIN legado de perfil e desduplica os registros locais.
    const hadLegacyPin = parsed.some(
      (profile) =>
        typeof profile === "object" && profile !== null && "pin" in profile,
    );
    const sanitized = parsed.map(removeLegacyPin);
    const deduplicated = deduplicateProfiles(sanitized);
    if (hadLegacyPin || deduplicated.length !== parsed.length) {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(deduplicated));
    }
    return deduplicated;
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveProfiles(profiles: UserProfile[]): void {
  if (typeof window === "undefined") return;
  const clean = deduplicateProfiles(profiles.map(removeLegacyPin));
  localStorage.setItem(PROFILES_KEY, JSON.stringify(clean));
}

/** Perfis oferecidos na entrada. Exemplos antigos sem uso ficam fora na migração. */
export function getProfilesForAccess(profiles: UserProfile[]): UserProfile[] {
  return profiles;
}

export function getActiveProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const profiles = getStoredProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  if (!activeId) return null;
  return profiles.find((p) => p.id === activeId) || null;
}

export function setActiveProfileId(profileId: string | null): void {
  if (typeof window === "undefined") return;
  if (profileId) {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
  } else {
    localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
  }
}

export function registerProfile(data: {
  name: string;
  email?: string;
  role: UserRole;
  gatNumber: string;
}): {
  success: boolean;
  user?: UserProfile;
  existingUser?: UserProfile;
  error?: string;
} {
  const profiles = getStoredProfiles();
  const trimmedName = data.name.trim();

  // Validação Anti-Duplicidade por Nome
  const normalizedNew = normalizeName(trimmedName);
  const existingUser = profiles.find(
    (p) => normalizeName(p.name) === normalizedNew,
  );
  if (existingUser) {
    return {
      success: false,
      existingUser,
      error: `Já existe um participante cadastrado como "${trimmedName}".`,
    };
  }

  // Validação Anti-Duplicidade por E-mail (se informado)
  if (data.email) {
    const cleanEmail = data.email.trim().toLowerCase();
    if (profiles.some((p) => p.email && p.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: "Já existe um participante cadastrado com este e-mail.",
      };
    }
  }

  const gats = getStoredGats();
  const gatInfo = gats[data.gatNumber] || { name: `GAT ${data.gatNumber}` };
  const baseId = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const uniqueId = `${baseId}-${Date.now().toString(36).slice(-4)}`;

  const newProfile: UserProfile = {
    id: uniqueId,
    name: trimmedName,
    email: data.email?.trim().toLowerCase(),
    role: data.role,
    gatNumber: data.gatNumber,
    gatName: gatInfo.name,
    createdAt: new Date().toISOString(),
  };

  const updated = [...profiles, newProfile];
  saveProfiles(updated);
  setActiveProfileId(newProfile.id);

  return { success: true, user: newProfile };
}

export function deleteUserProfile(profileId: string): void {
  if (typeof window === "undefined") return;
  const profiles = getStoredProfiles().filter((p) => p.id !== profileId);
  saveProfiles(profiles);

  const activeId = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  if (activeId === profileId) {
    if (profiles.length > 0) {
      setActiveProfileId(profiles[0].id);
    } else {
      setActiveProfileId(null);
    }
  }
}

export function updateUserProfileAdmin(updated: UserProfile): {
  success: boolean;
  error?: string;
} {
  const profiles = getStoredProfiles();
  const normalizedNew = normalizeName(updated.name);

  // Verifica duplicidade com outro usuário que não seja ele mesmo
  if (
    profiles.some(
      (p) => p.id !== updated.id && normalizeName(p.name) === normalizedNew,
    )
  ) {
    return {
      success: false,
      error: `Já existe outro participante com o nome "${updated.name}".`,
    };
  }

  const gats = getStoredGats();
  const gatInfo = gats[updated.gatNumber];
  const finalUser = {
    ...updated,
    name: updated.name.trim(),
    gatName: gatInfo?.name || updated.gatName || `GAT ${updated.gatNumber}`,
  };

  const updatedProfiles = profiles.map((p) =>
    p.id === updated.id ? finalUser : p,
  );
  saveProfiles(updatedProfiles);
  return { success: true };
}

// ============================================================
// GESTÃO DINÂMICA DE GATS (ADMIN)
// ============================================================

export function getStoredGats(): Record<string, GATInfo> {
  if (typeof window === "undefined") return DEFAULT_GATS;
  try {
    const raw = localStorage.getItem(GATS_KEY);
    if (!raw) return DEFAULT_GATS;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? parsed
      : DEFAULT_GATS;
  } catch {
    return DEFAULT_GATS;
  }
}

export function saveGats(gats: Record<string, GATInfo>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GATS_KEY, JSON.stringify(gats));
}

export function updateGatInfo(oldNumber: string, updatedGat: GATInfo): void {
  if (typeof window === "undefined") return;
  const gats = getStoredGats();
  if (oldNumber !== updatedGat.number) {
    delete gats[oldNumber];
  }
  gats[updatedGat.number] = updatedGat;
  saveGats(gats);

  const profiles = getStoredProfiles();
  const updatedProfiles = profiles.map((p) => {
    if (p.gatNumber === oldNumber) {
      return {
        ...p,
        gatNumber: updatedGat.number,
        gatName: updatedGat.name,
      };
    }
    return p;
  });
  saveProfiles(updatedProfiles);
}

// ============================================================
// GESTÃO DINÂMICA DE PERFIS / ROLES (ADMIN)
// ============================================================

export function getStoredRoles(): string[] {
  if (typeof window === "undefined") return DEFAULT_ROLES;
  try {
    const raw = localStorage.getItem(ROLES_KEY);
    if (!raw) return DEFAULT_ROLES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ROLES;
  } catch {
    return DEFAULT_ROLES;
  }
}

export function saveRoles(roles: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

export function updateRoleName(oldRole: string, newRole: string): void {
  if (typeof window === "undefined") return;
  const roles = getStoredRoles();
  const updatedRoles = roles.map((r) => (r === oldRole ? newRole.trim() : r));
  saveRoles(updatedRoles);

  const profiles = getStoredProfiles();
  const updatedProfiles = profiles.map((p) =>
    p.role === oldRole ? { ...p, role: newRole.trim() } : p,
  );
  saveProfiles(updatedProfiles);
}

// ============================================================
// GESTÃO DINÂMICA DE MODELOS DE ATIVIDADES (ADMIN)
// ============================================================

const templateSignature = (templates: ActivityTemplate[]) =>
  JSON.stringify(
    templates.map((tpl) => [
      tpl.id,
      tpl.name,
      tpl.modality,
      tpl.local,
      Boolean(tpl.isGatSpecific),
    ]),
  );
const LEGACY_TEMPLATES_SIGNATURE = templateSignature(
  PROGRAM.legacyTemplates.map((tpl) => ({ ...tpl })),
);

/**
 * Lê os modelos salvos. A lista padrão antiga, sem edição, é lida como a lista
 * padrão atual; a chave salva não é reescrita (a troca acontece na leitura).
 * Lista editada pela pessoa (qualquer id, nome, modalidade ou local diferente)
 * é mantida.
 */
export function getStoredTemplates(): ActivityTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TEMPLATES;
    const stored = normalizeTemplates(parsed);
    return templateSignature(stored) === LEGACY_TEMPLATES_SIGNATURE
      ? DEFAULT_TEMPLATES
      : stored;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

function normalizeTemplates(parsed: unknown[]): ActivityTemplate[] {
  return parsed.map((item: unknown, idx: number) => {
    const stored =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : {};
    const name = text(stored.name).trim() || `Atividade modelo ${idx + 1}`;
    return {
      id: text(stored.id) || `tpl-${idx + 1}`,
      name,
      modality: normalizeModality(stored.modality),
      local: text(stored.local),
      isGatSpecific:
        Boolean(stored.isGatSpecific) || name.includes("{gatNumber}"),
    };
  });
}

export function saveTemplates(templates: ActivityTemplate[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ============================================================
// GERAÇÃO E CARREGAMENTO DE ATIVIDADES
// ============================================================

/** Exemplos fictícios para conhecer a folha; o participante substitui pelos reais. */
export function generateSeedActivities(
  gatNumber: string,
  gatName: string,
  monthKey: string,
): Activity[] {
  const templates = getStoredTemplates();
  const defaultSlots = [
    { day: 3, start: "11:00", end: "13:00" },
    { day: 4, start: "14:00", end: "15:30" },
    { day: 5, start: "13:00", end: "14:00" },
    { day: 10, start: "18:00", end: "20:00" },
    { day: 12, start: "09:00", end: "11:00" },
    { day: 17, start: "08:00", end: "12:00" },
    { day: 19, start: "16:30", end: "18:00" },
  ];
  const generated = templates.map((tpl, index) => {
    const slot = defaultSlots[index % defaultSlots.length];
    return normalizeActivity({
      id: `act-seed-${index + 1}-${Date.now().toString(36).slice(-3)}`,
      date: `${monthKey}-${String(slot.day).padStart(2, "0")}`,
      start: slot.start,
      end: slot.end,
      modality: tpl.modality,
      description: tpl.name
        .replaceAll("{gatNumber}", gatNumber)
        .replaceAll("{gatName}", gatName),
      local: tpl.local,
      descricao:
        "Exemplo fictício. Substitua pela descrição da atividade realizada.",
    });
  });
  return sortActivitiesChronologically(generated);
}

export function getActivitiesForMonth(
  profileId: string,
  monthKey: string,
): Activity[] {
  if (typeof window === "undefined") return [];
  migrateFromV2();
  const key = `${ACTIVITIES_PREFIX}${profileId}_${monthKey}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? sortActivitiesChronologically(
          parsed
            .filter((item) => typeof item === "object" && item !== null)
            .map(normalizeActivity),
        )
      : [];
  } catch {
    return [];
  }
}

export function loadSampleActivitiesForUser(
  profileId: string,
  monthKey: string,
): Activity[] {
  const profiles = getStoredProfiles();
  const user = profiles.find((p) => p.id === profileId);
  const gats = getStoredGats();
  const gatNumber = user?.gatNumber || PROGRAM.defaultGat;
  const gatName = user?.gatName || gats[gatNumber]?.name || PROGRAM.acronym;
  const samples = generateSeedActivities(gatNumber, gatName, monthKey);
  saveActivitiesForMonth(profileId, monthKey, samples);
  return samples;
}

export function clearActivitiesForMonth(
  profileId: string,
  monthKey: string,
): void {
  if (typeof window === "undefined") return;
  const key = `${ACTIVITIES_PREFIX}${profileId}_${monthKey}`;
  localStorage.setItem(key, JSON.stringify([]));
}

export function saveActivitiesForMonth(
  profileId: string,
  monthKey: string,
  activities: Activity[],
): void {
  if (typeof window === "undefined") return;
  const key = `${ACTIVITIES_PREFIX}${profileId}_${monthKey}`;
  const sorted = sortActivitiesChronologically(activities);
  localStorage.setItem(key, JSON.stringify(sorted));
}

// ============================================================
// EXPORTAÇÃO / IMPORTAÇÃO LOCAL
// ============================================================

/** 1.3: atividades com local e descricao. 1.0–1.2 continuam restaurando. */
export const BACKUP_VERSION = "1.3";
const SUPPORTED_VERSIONS = ["1.0", "1.1", "1.2", "1.3"];

export function exportUserData(
  user: UserProfile,
  monthKey: string,
  attachments?: BackupAttachment[],
): string {
  const activities = getActivitiesForMonth(user.id, monthKey);
  // Sem comprovantes informados, a cópia não leva o campo e a restauração
  // preserva os comprovantes já salvos neste navegador.
  const data = {
    version: BACKUP_VERSION,
    attachments,
    exportedAt: new Date().toISOString(),
    user: removeLegacyPin(user),
    monthKey,
    activities,
  };
  return JSON.stringify(data, null, 2);
}

export type RestoreCode =
  | "RESTORED"
  | "INVALID_JSON"
  | "INVALID_BACKUP"
  | "UNSUPPORTED_VERSION"
  | "PROFILE_CONFLICT"
  | "STORAGE_FAILED"
  | "ROLLBACK_FAILED";
export type RestoreResult = {
  success: boolean;
  user?: UserProfile;
  monthKey?: string;
  activities?: Activity[];
  attachmentData?: unknown[];
  error?: string;
  code: RestoreCode;
};

const restoreMessages: Record<RestoreCode, string> = {
  RESTORED: "Cópia restaurada.",
  INVALID_JSON:
    "Não foi possível ler esta cópia. Selecione o arquivo .json salvo pelo sistema; o PDF não restaura os registros.",
  INVALID_BACKUP:
    "A cópia está incompleta ou contém registros inválidos. Selecione outra cópia. Seus registros não foram alterados.",
  UNSUPPORTED_VERSION:
    "Esta versão de cópia não é compatível. Use uma cópia no formato 1.0 a 1.3. Seus registros não foram alterados.",
  PROFILE_CONFLICT:
    "Já existe um perfil com este nome e outra identificação neste navegador. Continue com o perfil local ou peça ajuda antes de restaurar.",
  STORAGE_FAILED:
    "O navegador não conseguiu guardar a cópia. Verifique o espaço disponível e as permissões de armazenamento. Os registros anteriores foram preservados.",
  ROLLBACK_FAILED:
    "A restauração não foi concluída e não foi possível recuperar todo o estado anterior. Guarde seu arquivo original e peça ajuda antes de continuar.",
};

export function restoreFailure(code: RestoreCode): RestoreResult {
  return { success: false, code, error: restoreMessages[code] };
}

const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const validDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const validTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const optionalText = (value: unknown, max: number) =>
  value === undefined || (typeof value === "string" && value.length <= max);

// Validate the shared fields before any browser write. Files are validated separately.
export function inspectUserData(jsonStr: string): RestoreResult {
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch {
    return restoreFailure("INVALID_JSON");
  }
  if (!data || typeof data !== "object")
    return restoreFailure("INVALID_BACKUP");
  if (data.version !== undefined && !SUPPORTED_VERSIONS.includes(data.version))
    return restoreFailure("UNSUPPORTED_VERSION");
  if (["1.1", "1.2"].includes(data.version) && !Array.isArray(data.attachments))
    return restoreFailure("INVALID_BACKUP");
  if (
    data.version === "1.3" &&
    data.attachments !== undefined &&
    !Array.isArray(data.attachments)
  )
    return restoreFailure("INVALID_BACKUP");
  const profile = data.user;
  if (
    !profile ||
    !["id", "name", "role", "gatNumber", "createdAt"].every((key) =>
      nonempty(profile[key]),
    ) ||
    typeof data.monthKey !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(data.monthKey) ||
    !Array.isArray(data.activities)
  )
    return restoreFailure("INVALID_BACKUP");
  const ids = new Set<string>();
  const activities: Activity[] = [];
  for (const record of data.activities) {
    if (
      !record ||
      !nonempty(record.id) ||
      ids.has(record.id) ||
      !validDate(record.date) ||
      !validTime(record.start) ||
      !validTime(record.end) ||
      calcPetMinutes(record.start, record.end) <= 0 ||
      !nonempty(record.description) ||
      !nonempty(record.modality) ||
      record.modality.length > 120 ||
      !optionalText(record.local, 300) ||
      !optionalText(record.descricao, 4000)
    )
      return restoreFailure("INVALID_BACKUP");
    ids.add(record.id);
    // Cópias 1.2 podiam trazer "formReport" (Forms do programa anterior): ignorado.
    activities.push(normalizeActivity(record));
  }
  const user: UserProfile = {
    id: profile.id,
    name: profile.name.trim(),
    role: normalizeRole(profile.role),
    gatNumber: profile.gatNumber,
    createdAt: profile.createdAt,
  };
  if (typeof profile.gatName === "string") user.gatName = profile.gatName;
  if (typeof profile.email === "string") user.email = profile.email;
  const hasAttachments =
    ["1.1", "1.2"].includes(data.version) ||
    (data.version === "1.3" && Array.isArray(data.attachments));
  return {
    success: true,
    code: "RESTORED",
    user,
    monthKey: data.monthKey,
    activities: sortActivitiesChronologically(activities),
    ...(hasAttachments && { attachmentData: data.attachments }),
  };
}

export function importUserData(jsonStr: string): RestoreResult {
  const result = inspectUserData(jsonStr);
  if (result.attachmentData) return restoreFailure("INVALID_BACKUP");
  return applyUserData(result);
}

export function applyUserData(
  result: RestoreResult,
  registerRollback?: (rollback: () => boolean) => void,
): RestoreResult {
  if (!result.success || !result.user || !result.monthKey || !result.activities)
    return result;
  if (typeof window === "undefined") return restoreFailure("STORAGE_FAILED");
  const { user, monthKey, activities } = result;
  const activityKey = `${ACTIVITIES_PREFIX}${user.id}_${monthKey}`;
  const keys = [activityKey, PROFILES_KEY, ACTIVE_PROFILE_ID_KEY];
  const previous = new Map<string, string | null>();
  const written: Array<{ key: string; value: string }> = [];
  const rollback = () => {
    let complete = true;
    for (const { key, value: importedValue } of [...written].reverse()) {
      try {
        const value = previous.get(key);
        const current = localStorage.getItem(key);
        // Leave newer writes from another tab intact.
        if (current !== importedValue) {
          if (current !== value) complete = false;
          continue;
        }
        if (value == null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        complete = false;
      }
    }
    return complete;
  };
  try {
    for (const key of keys) previous.set(key, localStorage.getItem(key));
    // Read without running migration writes inside this transaction.
    const rawProfiles = previous.get(PROFILES_KEY);
    const profiles: UserProfile[] = rawProfiles ? JSON.parse(rawProfiles) : [];
    if (!Array.isArray(profiles)) return restoreFailure("STORAGE_FAILED");
    if (
      profiles.some(
        (profile) =>
          profile.id !== user.id &&
          normalizeName(profile.name) === normalizeName(user.name),
      )
    )
      return restoreFailure("PROFILE_CONFLICT");
    const updated = profiles.some((profile) => profile.id === user.id)
      ? profiles.map((profile) =>
          profile.id === user.id ? user : removeLegacyPin(profile),
        )
      : [...profiles.map(removeLegacyPin), user];
    const values = [
      JSON.stringify(activities),
      JSON.stringify(updated),
      user.id,
    ];
    for (let index = 0; index < keys.length; index++) {
      localStorage.setItem(keys[index], values[index]);
      written.push({ key: keys[index], value: values[index] });
    }
    registerRollback?.(rollback);
    return result;
  } catch {
    return restoreFailure(rollback() ? "STORAGE_FAILED" : "ROLLBACK_FAILED");
  }
}

// Allowlisted, local support details. Never include file content or raw exceptions.
export function getRestoreDiagnostic(code: RestoreCode): string {
  const safeCode = Object.hasOwn(restoreMessages, code)
    ? code
    : "INVALID_BACKUP";
  return JSON.stringify(
    { operation: "restore_backup", code: safeCode, supportedSchema: BACKUP_VERSION },
    null,
    2,
  );
}
