import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PROGRAM } from "../../src/config/program";

/**
 * Regra de ouro dos dados: o estado criado pela main de 18/11/2026 (commit
 * 269f816, antes de perfis/visão semanal) abre igual e não é reescrito.
 * A fixture foi gerada pela interface daquela versão
 * (scripts/gerar-fixture-compat.mjs), com dados fictícios.
 */
const fixture = JSON.parse(
  readFileSync(path.join(__dirname, "..", "fixtures", "dados-v3-main.json"), "utf8"),
) as {
  localStorage: Record<string, string>;
  indexedDB: Array<{ key: [string, string]; attachments: Array<{ id: string; name: string; pages: number; type: string; base64: string }> }>;
};
const profiles = JSON.parse(fixture.localStorage.pet_folha_profiles_v3) as Array<{ id: string; name: string }>;
const [um, dois] = profiles;

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
});

async function seed(page: Page) {
  await page.addInitScript((local) => {
    if (localStorage.getItem("compat-seeded")) return;
    for (const [key, value] of Object.entries(local)) localStorage.setItem(key, value);
    localStorage.setItem("compat-seeded", "1");
  }, fixture.localStorage);
  await page.goto("/");
  await page.evaluate(async (entries) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("pet-folha-comprovantes", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("months");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("months", "readwrite");
      for (const { key, attachments } of entries)
        tx.objectStore("months").put(
          attachments.map(({ id, name, pages, type, base64 }) => ({
            id,
            name,
            pages,
            file: new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type }),
          })),
          key,
        );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, fixture.indexedDB);
  await page.reload();
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const local: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      local[key] = localStorage.getItem(key)!;
    }
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("pet-folha-comprovantes", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const indexed = await new Promise<Array<{ key: unknown; names: string[]; sizes: number[] }>>((resolve, reject) => {
      const out: Array<{ key: unknown; names: string[]; sizes: number[] }> = [];
      const cursor = db.transaction("months").objectStore("months").openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return resolve(out);
        out.push({ key: c.key, names: c.value.map((v: { name: string }) => v.name), sizes: c.value.map((v: { file: Blob }) => v.file.size) });
        c.continue();
      };
      cursor.onerror = () => reject(cursor.error);
    });
    db.close();
    return { local, indexed };
  });
}

test("dados da versão atual da main abrem iguais e não são reescritos", async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);

  // Entrada: os dois perfis, com os meses certos.
  const list = page.getByRole("list", { name: "Perfis neste navegador" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await expect(list.getByRole("listitem").filter({ hasText: um.name })).toContainText("2 meses com atividades");
  await expect(list.getByRole("listitem").filter({ hasText: dois.name })).toContainText("1 mês com atividades");

  // Perfil 1: CH de novembro e outubro, folha e comprovante.
  await page.getByRole("button", { name: `Abrir folha de ${um.name}`, exact: true }).click();
  await expect(page.getByLabel("Mês da folha")).toHaveValue("2026-11");
  // 11:00–13:00 + 16:30–18:00 + 08:00–12:15 = 7h45.
  await expect(page.locator(".summary-total strong")).toHaveText("7h45");
  await page.getByRole("radiogroup", { name: "Visão do resumo" }).getByRole("radio", { name: "Semanal" }).click();
  await expect(page.locator(".week-band-value")).toHaveText(["0h de 8 h", "3h30 de 8 h", "0h de 8 h", "0h de 8 h", "0h de 8 h", "4h15 de 8 h"]);
  await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
  const sheet = page.locator(".sheet-stage .official-sheet");
  await expect(sheet).toContainText("Total de CH no mês: 7h45");
  await expect(sheet).toContainText("( X ) Monitor(a)");
  await expect(sheet).toContainText("Interação em tempo real (In Loco)");
  // Comprovação desligada (PROGRAM.features.photoProof): a seção some, mas o
  // comprovante continua guardado (o snapshot do IndexedDB abaixo não muda).
  if (PROGRAM.features.photoProof)
    await expect(page.getByRole("region", { name: "Comprovação fotográfica" })).toContainText("foto-ficticia.png");
  else await expect(page.getByRole("region", { name: "Comprovação fotográfica" })).toHaveCount(0);
  await page.getByRole("button", { name: "Minha frequência", exact: true }).click();
  await page.getByLabel("Mês da folha").selectOption("2026-10");
  await expect(page.locator(".summary-total strong")).toHaveText("1h30");

  // A cópia do mês continua no formato 1.3.
  await page.evaluate(() =>
    Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined }),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar cópia", exact: true }).click();
  const download = await downloadPromise;
  const copy = JSON.parse(readFileSync((await download.path())!, "utf8"));
  expect(copy.version).toBe("1.3");
  expect(copy.activities).toEqual(JSON.parse(fixture.localStorage[`pet_folha_activities_v3_${um.id}_2026-10`]));

  // Trocar para o perfil 2 pelo menu e abrir.
  await page.getByRole("button", { name: /menu do participante/ }).click();
  await page.getByRole("menuitem", { name: "Trocar participante" }).click();
  await page.getByRole("button", { name: `Abrir folha de ${dois.name}`, exact: true }).click();
  await page.getByLabel("Mês da folha").selectOption("2026-11");
  await expect(page.locator(".summary-total strong")).toHaveText("1");

  // Nada do que já existia foi reescrito; só entram chaves novas de navegação.
  const after = await snapshot(page);
  for (const [key, value] of Object.entries(before.local)) {
    if (key === "pet_folha_active_profile_id_v3") continue;
    expect(after.local[key], key).toBe(value);
  }
  const added = Object.keys(after.local).filter((key) => !(key in before.local)).sort();
  expect(added).toEqual(["pet_folha_active_profile_id_v3", "pet_folha_summary_view"]);
  expect(after.indexed).toEqual(before.indexed);
  for (const [key, value] of Object.entries(fixture.localStorage)) expect(after.local[key], key).toBe(value);
});
