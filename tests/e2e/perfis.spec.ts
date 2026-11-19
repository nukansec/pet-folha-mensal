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
    expect(download.suggestedFilename()).toBe("backup-perfil-completo-ana-ficticia.json");
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

// ============================================================
// E4: seletores em grupos de opção
// ============================================================
test.describe("seletores em grupos de opção", () => {
  test("perfil no primeiro acesso: cartões de rádio por clique e teclado; valor gravado é o nome de PROGRAM", async ({ page }) => {
    await page.goto("/");
    const roles = page.getByRole("radiogroup", { name: "Perfil", exact: true });
    await expect(roles.getByRole("radio")).toHaveCount(5);
    await expect(roles.getByRole("radio", { name: "Monitor(a)" })).toBeChecked();
    await roles.getByRole("radio", { name: "Tutor(a)" }).click();
    await expect(roles.getByRole("radio", { name: "Tutor(a)" })).toBeChecked();
    // Teclado: foco na opção marcada; seta para a direita escolhe a próxima.
    await roles.getByRole("radio", { name: "Tutor(a)" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(roles.getByRole("radio", { name: "Preceptor(a)" })).toBeChecked();
    await expect(roles.getByRole("radio", { name: "Preceptor(a)" })).toBeFocused();
    const ring = await roles.locator(".choice", { has: page.getByRole("radio", { name: "Preceptor(a)" }) })
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(ring).toBe("solid");
    await page.getByLabel("Nome completo", { exact: true }).fill("Pessoa Sintética Teclado");
    await page.getByRole("button", { name: "Abrir minha folha", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Minha frequência", exact: true })).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pet_folha_profiles_v3")!)[0]);
    expect(stored).toMatchObject({ role: "Preceptor(a)", gatNumber: "01" });
    // No modal de identificação, o mesmo grupo.
    await menuButton(page).click();
    await page.getByRole("menuitem", { name: "Editar identificação" }).click();
    const dialog = page.getByRole("dialog", { name: "Identificação do participante" });
    const modalRoles = dialog.getByRole("radiogroup", { name: "Perfil", exact: true });
    await expect(modalRoles.getByRole("radio", { name: "Preceptor(a)" })).toBeChecked();
    await modalRoles.getByRole("radio", { name: "Orientador(a) de serviço" }).click();
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();
    const updated = await page.evaluate(() => JSON.parse(localStorage.getItem("pet_folha_profiles_v3")!)[0]);
    expect(updated.role).toBe("Orientador(a) de serviço");
    await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
    await expect(page.locator(".sheet-stage .official-sheet")).toContainText("( X ) Orientador(a) de serviço");
  });

  test("modalidade e preenchimento rápido: teclado escolhe; o registro grava os nomes completos", async ({ page }) => {
    await createProfile(page);
    const modality = page.getByRole("radiogroup", { name: "Modalidade", exact: true });
    // Rótulo curto na tela, nome completo como nome acessível.
    await expect(modality.locator(".choice-text")).toHaveText(["In Loco", "Síncrona", "Assíncrona"]);
    await expect(modality.getByRole("radio", { name: "Interação em tempo real (Síncrona)", exact: true })).toBeChecked();
    await modality.getByRole("radio", { name: "Interação em tempo real (Síncrona)", exact: true }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(modality.getByRole("radio", { name: "Interação em tempo real (In Loco)", exact: true })).toBeChecked();
    // Chips: Tab entra no grupo pela opção marcada; seta escolhe o modelo.
    const chips = page.getByRole("radiogroup", { name: /Preenchimento rápido/ });
    await chips.getByRole("radio", { name: "Em branco" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(chips.getByRole("radio", { name: "Reunião Geral" })).toBeChecked();
    await expect(page.getByLabel("Atividade desenvolvida", { exact: true })).toHaveValue("Reunião Geral");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(chips.getByRole("radio", { name: "Pesquisa Bibliográfica e Estudos Autônomos" })).toBeChecked();
    await expect(modality.getByRole("radio", { name: "Assíncrona", exact: true })).toBeChecked();
    await page.getByLabel("Data", { exact: true }).fill("2026-11-02");
    await page.getByLabel("Início", { exact: true }).fill("09:00");
    await page.getByLabel("Fim", { exact: true }).fill("10:00");
    await modality.getByRole("radio", { name: "Interação em tempo real (In Loco)", exact: true }).click();
    await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
    const saved = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => k.startsWith("pet_folha_activities_v3_"))!;
      return JSON.parse(localStorage.getItem(key)!)[0];
    });
    expect(saved).toMatchObject({
      modality: "Interação em tempo real (In Loco)",
      description: "Pesquisa Bibliográfica e Estudos Autônomos",
      local: "Online",
    });
    // Modal de edição usa o mesmo grupo e grava o nome completo.
    await page.getByRole("button", { name: /^Editar atividade:/ }).click();
    const edit = page.getByRole("dialog", { name: "Editar atividade", exact: true }).first();
    await edit.getByRole("radio", { name: "Assíncrona", exact: true }).check();
    await edit.getByRole("button", { name: /Salvar/ }).click();
    const edited = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => k.startsWith("pet_folha_activities_v3_"))!;
      return JSON.parse(localStorage.getItem(key)!)[0];
    });
    expect(edited.modality).toBe("Assíncrona");
  });

  test("modalidade fora da lista (dado antigo) continua visível e marcada", async ({ page }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("test-seeded")) return;
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([{ id: "p", name: "Pessoa Sintética", role: "Monitor(a)", gatNumber: "01", createdAt: "2026-10-01T00:00:00.000Z" }]));
      localStorage.setItem("pet_folha_active_profile_id_v3", "p");
      localStorage.setItem("pet_folha_activities_v3_p_2026-11", JSON.stringify([{ id: "x", date: "2026-11-03", start: "09:00", end: "10:00", modality: "Modalidade personalizada", description: "Registro antigo", local: "", descricao: "" }]));
      localStorage.setItem("test-seeded", "1");
    });
    await page.goto("/");
    await page.getByRole("button", { name: /^Editar atividade:/ }).click();
    const edit = page.getByRole("dialog", { name: "Editar atividade", exact: true }).first();
    await expect(edit.getByRole("radio", { name: "Modalidade personalizada", exact: true })).toBeChecked();
  });

  test("no celular, modalidade em coluna e chips com rolagem horizontal sem rolar a página", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "só no celular");
    await createProfile(page);
    const boxes = await page.getByRole("radiogroup", { name: "Modalidade", exact: true }).locator(".choice")
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect()));
    expect(new Set(boxes.map((box) => Math.round(box.left))).size).toBe(1);
    expect(boxes.every((box) => box.height >= 44)).toBe(true);
    const chips = page.getByRole("radiogroup", { name: /Preenchimento rápido/ });
    const scroll = await chips.evaluate((el) => ({ overflow: getComputedStyle(el).overflowX, wide: el.scrollWidth > el.clientWidth }));
    expect(scroll).toEqual({ overflow: "auto", wide: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
});

// ============================================================
// E5: visão semanal
// ============================================================
test.describe("visão semanal", () => {
  test("alterna Mensal | Semanal por clique e teclado, lembra a escolha e soma a CH exata por faixa", async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("test-seeded")) return;
      const act = (id: string, date: string, start: string, end: string) => ({ id, date, start, end, modality: "Assíncrona", description: "Sintética", local: "", descricao: "" });
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([{ id: "p", name: "Pessoa Sintética", role: "Monitor(a)", gatNumber: "01", createdAt: "2026-10-01T00:00:00.000Z" }]));
      localStorage.setItem("pet_folha_active_profile_id_v3", "p");
      localStorage.setItem("pet_folha_activities_v3_p_2026-11", JSON.stringify([
        act("a", "2026-11-01", "08:00", "09:30"),
        act("b", "2026-11-08", "16:30", "18:00"),
        act("c", "2026-11-09", "11:00", "13:00"),
        act("d", "2026-11-18", "14:00", "22:15"),
      ]));
      localStorage.setItem("test-seeded", "1");
    });
    await page.goto("/");
    const summary = page.getByRole("region", { name: "Resumo da frequência" });
    const toggle = summary.getByRole("radiogroup", { name: "Visão do resumo" });
    await expect(toggle.getByRole("radio", { name: "Mensal" })).toBeChecked();
    await expect(summary.getByRole("progressbar")).toBeVisible();
    await toggle.getByRole("radio", { name: "Semanal" }).click();
    const bands = summary.getByRole("list", { name: /CH por semana/ }).getByRole("listitem");
    await expect(bands).toHaveCount(6);
    await expect(bands.locator("strong")).toHaveText(["Semana: Dia 1", "Semana: 2 a 8", "Semana: 9 a 15", "Semana: 16 a 22", "Semana: 23 a 29", "Semana: Dia 30"]);
    await expect(bands.locator(".week-band-value")).toHaveText(["1h30 de 8 h", "1h30 de 8 h", "2h de 8 h", "8h15 de 8 h", "0h de 8 h", "0h de 8 h"]);
    // Semana atual (18/11/2026, relógio do teste) destacada também por texto.
    await expect(bands.nth(3)).toHaveAttribute("aria-current", "date");
    await expect(bands.nth(3)).toContainText("Semana atual");
    await expect(bands.nth(0)).toContainText("Semana parcial");
    await expect(summary).toContainText("não é reduzida");
    // Lembra a escolha.
    await page.reload();
    await expect(toggle.getByRole("radio", { name: "Semanal" })).toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem("pet_folha_summary_view"))).toBe("weekly");
    // Teclado.
    await toggle.getByRole("radio", { name: "Semanal" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(toggle.getByRole("radio", { name: "Mensal" })).toBeChecked();
    await expect(summary.getByRole("progressbar")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(bands).toHaveCount(6);
    // Faixas acompanham a troca de mês e novas atividades.
    await page.getByLabel("Mês da folha").selectOption("2026-08");
    await expect(bands.locator("strong").first()).toHaveText("Semana: 1 a 2");
    if (testInfo.project.name === "mobile") {
      const lefts = await bands.evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().left)));
      expect(new Set(lefts).size).toBe(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } else {
      const lefts = await bands.evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().left)));
      expect(new Set(lefts).size).toBe(2);
    }
  });

  test("sem armazenamento, a visão semanal funciona e volta ao padrão Mensal", async ({ page }) => {
    await createProfile(page);
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === "pet_folha_summary_view") throw new DOMException("Quota", "QuotaExceededError");
        return original.call(this, key, value);
      };
    });
    const toggle = page.getByRole("radiogroup", { name: "Visão do resumo" });
    await toggle.getByRole("radio", { name: "Semanal" }).click();
    await expect(page.getByRole("list", { name: /CH por semana/ })).toBeVisible();
    await expect(page.locator(".operation-notice")).toHaveCount(0);
  });
});
