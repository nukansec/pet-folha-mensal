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
