type SavePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

export type SaveOutcome = "saved" | "downloaded" | "cancelled" | "failed";

/**
 * Salva um arquivo: escolha de pasta (showSaveFilePicker, Chromium/Edge)
 * quando existe; senão, download direto (Brave, Firefox, Safari, celular).
 */
export async function saveBlobFile(
  blob: Blob,
  filename: string,
  type: { description: string; mime: string; extension: string },
): Promise<SaveOutcome> {
  const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker === "function") {
    try {
      const handle = await picker.call(window, {
        suggestedName: filename,
        types: [{ description: type.description, accept: { [type.mime]: [type.extension] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved";
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
      // Sem suporte real ao seletor: segue para o download padrão.
    }
  }
  try {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  } catch {
    return "failed";
  }
}

/** Salva um JSON (cópia de segurança). */
export function saveJsonFile(json: string, filename: string): Promise<SaveOutcome> {
  return saveBlobFile(new Blob([json], { type: "application/json" }), filename, {
    description: "Cópia de segurança (.json)",
    mime: "application/json",
    extension: ".json",
  });
}

/**
 * Nome de arquivo a partir do nome do participante: sem acento, só letras,
 * números e hífen. Nomes com "/", ":" ou "?" quebravam o download no Windows.
 */
export function fileSlug(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "participante"
  );
}
