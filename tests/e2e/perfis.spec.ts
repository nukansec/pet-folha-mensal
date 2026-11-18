import { test, expect, type Page } from "@playwright/test";

// Dados 100% fictícios.
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
});

export async function createProfile(page: Page, name = "Participante sintético") {
  await page.goto("/");
  const first = page.getByRole("button", { name: "Primeiro acesso", exact: true });
  if (await first.getAttribute("aria-pressed").catch(() => null) === "false") await first.click();
  await page.getByLabel("Nome completo", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Abrir minha folha", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Minha frequência", exact: true })).toBeVisible();
}

function menuButton(page: Page) {
  return page.getByRole("button", { name: /menu do participante/ });
}

test.describe("menu do participante", () => {
  test("abre por clique e teclado, navega com setas, Esc fecha e devolve o foco", async ({ page }) => {
    await createProfile(page);
    const button = menuButton(page);
    await expect(button).toHaveAttribute("aria-haspopup", "menu");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const items = page.getByRole("menu", { name: "Menu do participante" }).getByRole("menuitem");
    await expect(items).toHaveText(["Editar identificação", "Trocar participante", "Salvar cópia", "Sair"]);
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(items.last()).toBeFocused();
    await page.keyboard.press("Home");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    // Teclado: seta para baixo no botão abre o menu; Enter no item executa.
    await page.keyboard.press("ArrowDown");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Identificação do participante" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Salvar alterações" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(button).toBeFocused();
    // Clique fora fecha.
    await button.click();
    await page.mouse.click(4, page.viewportSize()!.height - 4);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("itens têm alvo de 44 px e, no celular, o menu ocupa a largura útil", async ({ page }, testInfo) => {
    await createProfile(page);
    await menuButton(page).click();
    const boxes = await page.getByRole("menuitem").evaluateAll((items) =>
      items.map((item) => item.getBoundingClientRect().height),
    );
    expect(boxes.every((height) => height >= 44)).toBe(true);
    if (testInfo.project.name === "mobile") {
      const menu = await page.getByRole("menu").boundingBox();
      const viewport = page.viewportSize()!;
      expect(menu!.width).toBeGreaterThanOrEqual(viewport.width - 2 * 16 - 1);
      expect(menu!.x + menu!.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test("Trocar participante: aviso de rascunho, depois entrada na aba Continuar", async ({ page }) => {
    await createProfile(page);
    await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Rascunho sintético");
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Trocar participante" }).click();
    await expect(page.getByText("Atividade ainda não adicionada", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Continuar editando", exact: true }).click();
    await expect(page.getByLabel("Atividade desenvolvida", { exact: true })).toHaveValue("Rascunho sintético");
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Trocar participante" }).click();
    await page.getByRole("button", { name: "Descartar preenchimento", exact: true }).click();
    // Sem alterações salvas na sessão: vai direto à entrada, aba Continuar.
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Vamos começar" })).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("pet_folha_active_profile_id_v3"))).toBeNull();
  });

  test("Sair com alterações sem cópia lembra de Salvar cópia sem bloquear", async ({ page }) => {
    await createProfile(page);
    await page.getByLabel("Data", { exact: true }).fill("2026-11-02");
    await page.getByLabel("Início", { exact: true }).fill("09:00");
    await page.getByLabel("Fim", { exact: true }).fill("10:30");
    await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Atividade sintética");
    await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();
    const dialog = page.getByRole("dialog", { name: "Salvar folha e concluir" });
    await expect(dialog.getByRole("button", { name: "Salvar cópia", exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: /^Sair/ }).last().click();
    await expect(dialog.getByText(/ainda não acionou a cópia/)).toBeVisible();
    await dialog.getByRole("button", { name: "Sair sem salvar cópia", exact: true }).click();
    await expect(page.getByText("Sessão encerrada com sucesso.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vamos começar" })).toBeVisible();
  });

  test("Salvar cópia pelo menu baixa o JSON do mês", async ({ page }) => {
    await createProfile(page);
    await page.evaluate(() =>
      Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined }),
    );
    await menuButton(page).click();
    const download = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Salvar cópia" }).click();
    expect((await download).suggestedFilename()).toMatch(/^backup-frequencia-.*-2026-11\.json$/);
  });

  test("Concluir continua com o fluxo de antes", async ({ page }) => {
    await createProfile(page);
    await page.getByRole("button", { name: /^Concluir/ }).click();
    await page.getByRole("button", { name: "Sair / trocar participante", exact: true }).click();
    await expect(page.getByText("Sessão encerrada com sucesso.")).toBeVisible();
  });

  test("GAT do modal de identificação fica em uma linha, com o nome inteiro no title", async ({ page }) => {
    await createProfile(page);
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Editar identificação" }).click();
    const dialog = page.getByRole("dialog", { name: "Identificação do participante" });
    const select = dialog.locator(".full-select").first();
    await expect(select).toHaveAttribute("title", "GAT 01 · Alerta de violências com IA");
    const display = select.locator(".full-select-display");
    const height = await display.evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeLessThan(56);
  });
});

// ============================================================
// E3: gerenciar perfis na entrada
// ============================================================
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAMklEQVR4nGP4T2PAQCcLFPoCqI5GLRi1YNSCUQtGLRi1YNSCUQtGLRi1gBwLaAdobgEAXUfXXDidab8AAAAASUVORK5CYII=";
const ana = { id: "ana-ficticia", name: "Ana Fictícia", role: "Monitor(a)", gatNumber: "03", gatName: "Telecuidado farmacoterapêutico", createdAt: "2026-10-01T00:00:00.000Z" };
const bia = { id: "bia-ficticia", name: "Bia Fictícia", role: "Preceptor(a)", gatNumber: "12", gatName: "Saúde mental digital", createdAt: "2026-10-02T00:00:00.000Z" };
const act = (id: string, date: string, start = "09:00", end = "10:30") => ({
  id, date, start, end, modality: "Assíncrona", description: "Atividade sintética", local: "Online", descricao: "Teste", hours: 1.5,
});

async function seedTwoProfiles(page: Page) {
  await page.addInitScript(
    ({ ana, bia, a, b }) => {
      if (localStorage.getItem("test-seeded")) return;
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([ana, bia]));
      localStorage.setItem(`pet_folha_activities_v3_${ana.id}_2026-10`, JSON.stringify(a.slice(0, 2)));
      localStorage.setItem(`pet_folha_activities_v3_${ana.id}_2026-11`, JSON.stringify(a.slice(2)));
      localStorage.setItem(`pet_folha_activities_v3_${bia.id}_2026-11`, JSON.stringify(b));
      localStorage.setItem("test-seeded", "1");
    },
    {
      ana,
      bia,
      a: [act("a1", "2026-10-06"), act("a2", "2026-10-07"), act("a3", "2026-11-03")],
      b: [act("b1", "2026-11-04")],
    },
  );
  await page.goto("/");
  // Um comprovante em cada perfil, direto no IndexedDB do app.
  await page.evaluate(
    async ({ png, ids }) => {
      const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("pet-folha-comprovantes", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("months");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("months", "readwrite");
        for (const id of ids)
          tx.objectStore("months").put(
            [{ id: `f-${id}`, name: `foto-${id}.png`, file: new Blob([bytes], { type: "image/png" }), pages: 1 }],
            [id, "2026-11"],
          );
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    { png: pngBase64, ids: [ana.id, bia.id] },
  );
}

async function storedKeys(page: Page) {
  return page.evaluate(async () => {
    const local = Object.keys(localStorage).filter((key) => key.startsWith("pet_folha_activities_v3_")).sort();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("pet-folha-comprovantes", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const indexed = await new Promise<string[]>((resolve, reject) => {
      const request = db.transaction("months").objectStore("months").getAllKeys();
      request.onsuccess = () => resolve(request.result.map((key) => (key as string[]).join("_")).sort());
      request.onerror = () => reject(request.error);
    });
    db.close();
    return {
      local,
      indexed,
      profiles: JSON.parse(localStorage.getItem("pet_folha_profiles_v3") || "[]").map((p: { id: string }) => p.id),
    };
  });
}

test.describe("gerenciar perfis na entrada", () => {
  test("excluir mostra o que será apagado, oferece a cópia e apaga só aquele perfil; a cópia restaura tudo", async ({ page }, testInfo) => {
    await seedTwoProfiles(page);
    const list = page.getByRole("list", { name: "Perfis neste navegador" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(list.getByRole("listitem").first()).toContainText("2 meses com atividades");
    await page.getByRole("button", { name: `Excluir perfil de ${ana.name}`, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Excluir perfil" });
    await expect(dialog).toContainText("3 atividades em 2 meses");
    await expect(dialog).toContainText("1 comprovante.");
    // Cancelar não apaga nada.
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect((await storedKeys(page)).profiles).toEqual([ana.id, bia.id]);

    await page.getByRole("button", { name: `Excluir perfil de ${ana.name}`, exact: true }).click();
    await page.evaluate(() =>
      Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined }),
    );
    const downloadPromise = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Salvar cópia antes", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("backup-perfil-completo-ana-fictícia.json");
    const backupPath = testInfo.outputPath("perfil.json");
    await download.saveAs(backupPath);
    await expect(dialog.getByText(/Cópia acionada/)).toBeVisible();
    await dialog.getByRole("button", { name: "Excluir perfil", exact: true }).click();
    await expect(page.getByText(`Perfil de ${ana.name} excluído.`)).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(1);
    expect(await storedKeys(page)).toEqual({
      local: [`pet_folha_activities_v3_${bia.id}_2026-11`],
      indexed: [`${bia.id}_2026-11`],
      profiles: [bia.id],
    });

    // A cópia do perfil inteiro traz de volta perfil, os dois meses e o comprovante.
    await page.getByRole("button", { name: "Restaurar cópia", exact: true }).click();
    await page.getByLabel("Cópia de segurança da folha", { exact: true }).setInputFiles(backupPath);
    const restore = page.getByRole("dialog", { name: "Restaurar esta cópia?" });
    await expect(restore).toContainText("2 meses · 3 atividades");
    await restore.getByRole("button", { name: "Restaurar cópia", exact: true }).click();
    await expect(page.getByLabel("Mês da folha")).toHaveValue("2026-11");
    await expect(page.locator(".summary-total strong")).toHaveText("1h30");
    await page.getByLabel("Mês da folha").selectOption("2026-10");
    await expect(page.locator(".summary-total strong")).toHaveText("3");
    const after = await storedKeys(page);
    expect(after.local).toEqual([
      `pet_folha_activities_v3_${ana.id}_2026-10`,
      `pet_folha_activities_v3_${ana.id}_2026-11`,
      `pet_folha_activities_v3_${bia.id}_2026-11`,
    ]);
    expect(after.indexed).toEqual([`${ana.id}_2026-11`, `${bia.id}_2026-11`]);
    expect(after.profiles.sort()).toEqual([ana.id, bia.id]);
  });

  test("editar pelo cartão muda a identificação sem duplicar; nome de outro perfil é recusado", async ({ page }) => {
    await seedTwoProfiles(page);
    await page.getByRole("button", { name: `Editar perfil de ${ana.name}`, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Identificação do participante" });
    await dialog.getByLabel("Nome completo", { exact: true }).fill(" bia FICTÍCIA ");
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Nome duplicado", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Entendido", exact: true }).click();
    await dialog.getByLabel("Nome completo", { exact: true }).fill("Ana Renomeada");
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(dialog).toHaveCount(0);
    const list = page.getByRole("list", { name: "Perfis neste navegador" });
    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(list).toContainText("Ana Renomeada");
    const stored = await storedKeys(page);
    expect(stored.profiles).toEqual([ana.id, bia.id]);
    // Editar não abre o perfil.
    await expect(page.getByRole("heading", { name: "Vamos começar" })).toBeVisible();
    await page.getByRole("button", { name: "Abrir folha de Ana Renomeada", exact: true }).click();
    await expect(page.locator(".summary-total strong")).toHaveText("1h30");
  });

  test("com um só perfil, o cartão aparece; excluir o último leva ao primeiro acesso", async ({ page }) => {
    await createProfile(page, "Pessoa Única Sintética");
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Trocar participante" }).click();
    const list = page.getByRole("list", { name: "Perfis neste navegador" });
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("combobox", { name: /Perfil neste navegador/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Excluir perfil de Pessoa Única Sintética", exact: true }).click();
    await page.getByRole("dialog", { name: "Excluir perfil" }).getByRole("button", { name: "Excluir perfil", exact: true }).click();
    await expect(page.getByRole("button", { name: "Primeiro acesso", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Continuar", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.includes("activities_v3")))).toEqual([]);
  });
});
