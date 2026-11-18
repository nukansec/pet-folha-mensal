import type { UserProfile } from "@/types";
import {
  encodeAttachments,
  listProfileAttachments,
  replaceMonthsAttachments,
  type Attachment,
  type BackupAttachment,
} from "./attachments";
import {
  applyUserData,
  exportProfileData,
  restoreFailure,
  type RestoreResult,
} from "./storage";

/**
 * Restaura atividades (localStorage) e comprovantes (IndexedDB) juntos. Só os
 * meses presentes em attachmentsByMonth têm os comprovantes substituídos; os
 * demais ficam como estão.
 */
export async function restoreWithAttachments(
  preview: RestoreResult,
  attachmentsByMonth: Record<string, Attachment[]>,
): Promise<RestoreResult> {
  let result = restoreFailure("STORAGE_FAILED");
  let rollback: (() => boolean) | undefined;
  try {
    // A localStorage failure aborts IndexedDB. An IndexedDB abort rolls back localStorage.
    await replaceMonthsAttachments(preview.user!.id, attachmentsByMonth, () => {
      result = applyUserData(preview, (undo) => { rollback = undo; });
      if (!result.success) throw new Error("Restauração interrompida.");
    });
    return result;
  } catch {
    if (rollback && !rollback()) return restoreFailure("ROLLBACK_FAILED");
    return result.success ? restoreFailure("STORAGE_FAILED") : result;
  }
}

/** JSON (formato 1.4) do perfil inteiro: todos os meses e comprovantes. */
export async function buildProfileBackup(user: UserProfile): Promise<string> {
  const stored = await listProfileAttachments(user.id);
  const encoded: Record<string, BackupAttachment[]> = {};
  for (const [monthKey, items] of Object.entries(stored))
    encoded[monthKey] = await encodeAttachments(items);
  return exportProfileData(user, encoded);
}
