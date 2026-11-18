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
 * Salva um JSON: escolha de pasta (showSaveFilePicker, Chromium/Edge) quando
 * existe; senão, download direto (Brave, Firefox, Safari, celular).
 */
export async function saveJsonFile(json: string, filename: string): Promise<SaveOutcome> {
  const blob = new Blob([json], { type: "application/json" });
  const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker === "function") {
    try {
      const handle = await picker.call(window, {
        suggestedName: filename,
        types: [
          {
            description: "Cópia de segurança (.json)",
            accept: { "application/json": [".json"] },
          },
        ],
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

/** Nome de arquivo a partir do nome do participante. */
export function fileSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}
