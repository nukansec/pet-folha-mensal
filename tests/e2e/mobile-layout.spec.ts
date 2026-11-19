import { test, expect, type Page } from "@playwright/test";

// Layout no celular e no desktop (auditoria de 18/11/2026,
// docs/auditoria-mobile.md). Dados 100% fictícios.

const IN_LOCO = "Interação em tempo real (In Loco)";
const ASYNC = "Assíncrona";
const PROFILE = {
  id: "p-layout",
  name: "maria Fictícia DA silva Sobrenome Longo",
  role: "Monitor(a)",
  gatNumber: "01",
  gatName: "Alerta de violências com IA",
  createdAt: "2026-10-01T00:00:00.000Z",
};
const ACTIVITIES = [
  { id: "a1", date: "2026-11-03", start: "11:00", end: "13:00", modality: IN_LOCO, description: "Reunião Geral", local: "UFG", descricao: "Pauta fictícia." },
  { id: "a2", date: "2026-11-05", start: "16:30", end: "18:00", modality: ASYNC, description: "Pesquisa Bibliográfica e Estudos Autônomos", local: "Online", descricao: "Leitura fictícia." },
];

async function seed(page: Page, { active = true } = {}) {
  await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
  await page.addInitScript(
    ([profile, activities, isActive]) => {
      if (localStorage.getItem("test-seeded")) return;
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([profile]));
      if (isActive) localStorage.setItem("pet_folha_active_profile_id_v3", (profile as { id: string }).id);
      localStorage.setItem("pet_folha_activities_v3_p-layout_2026-11", JSON.stringify(activities));
      localStorage.setItem("test-seeded", "1");
    },
    [PROFILE, ACTIVITIES, active] as const,
  );
  await page.goto("/");
}

/** Problemas de layout na tela (ou no diálogo aberto). Lista vazia = ok. */
async function layoutProblems(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    const dialogs = [...document.querySelectorAll("dialog[open]")];
    const scope = dialogs.at(-1) ?? document.body;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const visible = (el: Element) => {
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && r.width > 1 && r.height > 1 && !el.closest(".sr-only, .skip-link");
    };
    const name = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join(".")} "${(el.textContent ?? "").trim().slice(0, 30)}"`;
    const scroller = document.scrollingElement!;
    if (scroller.scrollWidth > scroller.clientWidth + 1) out.push(`rolagem horizontal: ${scroller.scrollWidth} > ${scroller.clientWidth}`);
    const all = [...scope.querySelectorAll("*")].filter((el) => !el.closest("dialog:not([open]), .official-sheet") && visible(el));
    // Texto cortado em rótulos.
    for (const el of all) {
      const style = getComputedStyle(el);
      if (!/hidden|clip/.test(style.overflowX + style.overflowY) || !(el as HTMLElement).innerText?.trim()) continue;
      if (style.textOverflow === "ellipsis" && el.closest("[title]")) continue;
      if (style.webkitLineClamp && style.webkitLineClamp !== "none") continue;
      if (el.matches(".sheet-stage, .sheet-fit")) continue;
      if (el.scrollWidth > el.clientWidth + 1 || (/hidden|clip/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1))
        out.push(`texto cortado: ${name(el)}`);
    }
    // Palavra partida no meio.
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !visible(parent) || parent.closest("dialog:not([open]), .official-sheet, textarea, pre")) continue;
      for (const match of (node as Text).data.matchAll(/[^\s–—/·-]{4,}/g)) {
        range.setStart(node, match.index!);
        range.setEnd(node, match.index! + match[0].length);
        const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
        if (tops.size > 1) out.push(`palavra partida: "${match[0]}" em ${name(parent)}`);
      }
    }
    // Alvos de toque.
    for (const el of all.filter((e) => e.matches("button, label.choice, [role='menuitem'], a.primary-button, a.secondary-button"))) {
      const r = el.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) out.push(`alvo ${Math.round(r.width)}×${Math.round(r.height)}: ${name(el)}`);
    }
    // Modal dentro da viewport, com os botões do rodapé visíveis.
    for (const dialog of dialogs) {
      const panel = dialog.firstElementChild!;
      const r = panel.getBoundingClientRect();
      if (r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1) out.push(`modal fora da viewport: ${Math.round(r.width)}×${Math.round(r.height)}`);
      const buttons = [...panel.querySelectorAll(".dialog-actions button, .conclusion-actions button")].filter(visible);
      const last = buttons.at(-1);
      if (last) {
        const b = last.getBoundingClientRect();
        if (b.bottom > vh + 1 || b.top < 0) out.push(`rodapé do modal fora da tela: ${name(last)}`);
      }
    }
    return out;
  });
}

async function openDialog(page: Page, open: () => Promise<void>) {
  await open();
  await expect(page.locator("dialog[open]").last()).toBeVisible();
}
async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
}

for (const viewport of [
  { width: 360, height: 740 },
  { width: 1440, height: 900 },
]) {
  test.describe(`layout em ${viewport.width} px`, () => {
    test.use({ viewport });
    test.skip(({ isMobile }) => isMobile, "viewport fixado; roda só no projeto desktop");

    test("entrada: sem rolagem lateral, corte, palavra partida ou alvo pequeno", async ({ page }) => {
      await seed(page, { active: false });
      expect(await layoutProblems(page), "Continuar").toEqual([]);
      await page.getByRole("button", { name: "Primeiro acesso", exact: true }).click();
      expect(await layoutProblems(page), "Primeiro acesso").toEqual([]);
      await page.getByRole("button", { name: "Restaurar cópia", exact: true }).click();
      expect(await layoutProblems(page), "Restaurar cópia").toEqual([]);
    });

    test("painel, menu, modais e folha oficial passam nas mesmas checagens", async ({ page }) => {
      await seed(page);
      expect(await layoutProblems(page), "painel").toEqual([]);
      await page.getByRole("button", { name: /menu do participante/ }).click();
      expect(await layoutProblems(page), "menu").toEqual([]);
      await page.keyboard.press("Escape");
      await openDialog(page, () => page.getByRole("button", { name: /^Editar atividade:/ }).first().click());
      expect(await layoutProblems(page), "editar atividade").toEqual([]);
      await closeDialog(page);
      await openDialog(page, async () => {
        await page.getByRole("button", { name: /menu do participante/ }).click();
        await page.getByRole("menuitem", { name: "Editar identificação" }).click();
      });
      expect(await layoutProblems(page), "identificação").toEqual([]);
      await closeDialog(page);
      await openDialog(page, () => page.getByRole("button", { name: /^Excluir atividade:/ }).first().click());
      expect(await layoutProblems(page), "confirmar exclusão").toEqual([]);
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await openDialog(page, () => page.getByRole("button", { name: /^Concluir/ }).click());
      expect(await layoutProblems(page), "concluir").toEqual([]);
      await closeDialog(page);
      await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
      await expect(page.locator(".sheet-stage .official-sheet")).toBeVisible();
      expect(await layoutProblems(page), "folha").toEqual([]);
      await page.getByRole("button", { name: "Modelo em branco", exact: true }).click();
      expect(await layoutProblems(page), "modelo em branco").toEqual([]);
    });
  });
}

test.describe("B1–B6", () => {
  test.use({ viewport: { width: 360, height: 740 } });
  test.skip(({ isMobile }) => isMobile, "viewport fixado; roda só no projeto desktop");

  test("B1: editar atividade usa os mesmos campos do formulário, com cabeçalho e linhas corretos", async ({ page }) => {
    await seed(page);
    await page.getByRole("button", { name: /^Editar atividade:/ }).first().click();
    const edit = page.getByRole("dialog", { name: "Editar atividade", exact: true });
    // Mesmos componentes: pílulas de preenchimento rápido e modalidade em grupo.
    const chips = edit.getByRole("radiogroup", { name: /Preenchimento rápido/ });
    await expect(chips.getByRole("radio")).toHaveCount(5);
    await expect(edit.getByRole("radiogroup", { name: "Modalidade", exact: true })).toBeVisible();
    await expect(edit.locator("select")).toHaveCount(0);
    await chips.getByRole("radio", { name: "Capacitação" }).check();
    await expect(edit.getByLabel("Atividade desenvolvida", { exact: true })).toHaveValue("Capacitação");
    // Cabeçalho: título numa linha, subtítulo oculto, fechar 44 px alinhado.
    const title = await edit.getByRole("heading", { name: "Editar atividade" }).boundingBox();
    expect(title!.height).toBeLessThan(32);
    await expect(edit.locator(".dialog-head-text p")).toBeHidden();
    const close = await edit.getByRole("button", { name: "Fechar" }).boundingBox();
    expect(close!.width).toBeGreaterThanOrEqual(44);
    expect(close!.height).toBeGreaterThanOrEqual(44);
    expect(Math.abs(close!.y + close!.height / 2 - (title!.y + title!.height / 2))).toBeLessThan(6);
    // Data em linha inteira; Início | Fim | CH na mesma linha.
    const body = await edit.locator(".dialog-body").boundingBox();
    const date = await edit.getByLabel("Data", { exact: true }).boundingBox();
    expect(date!.width).toBeGreaterThan(body!.width - 2 * 16 - 4);
    const start = await edit.getByLabel("Início", { exact: true }).boundingBox();
    const end = await edit.getByLabel("Fim", { exact: true }).boundingBox();
    const ch = await edit.locator(".hours-preview").boundingBox();
    expect(Math.abs(start!.y - end!.y)).toBeLessThan(2);
    expect(ch!.x).toBeGreaterThan(end!.x + end!.width - 1);
    expect(ch!.y + ch!.height).toBeGreaterThan(start!.y);
    // O valor de hora aparece inteiro.
    expect(await edit.getByLabel("Início", { exact: true }).evaluate((input) => input.scrollWidth <= input.clientWidth + 1)).toBe(true);
    // Rodapé visível sem rolar o modal.
    const save = await edit.getByRole("button", { name: /Salvar/ }).boundingBox();
    expect(save!.y + save!.height).toBeLessThanOrEqual(740);
  });

  test("B2: abas da entrada e cartões de perfil sem cortar nem partir palavra; GAT em uma linha", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await seed(page, { active: false });
    await page.getByRole("button", { name: "Primeiro acesso", exact: true }).click();
    const problems = await layoutProblems(page);
    expect(problems.filter((p) => /palavra|cortado/.test(p))).toEqual([]);
    for (const tab of await page.locator(".ui-segmented button").all())
      expect(await tab.evaluate((b) => b.scrollWidth <= b.clientWidth + 1)).toBe(true);
    expect(await page.getByRole("button", { name: "Restaurar cópia", exact: true }).evaluate((el) => (el as HTMLElement).innerText.trim())).toBe("Restaurar");
    const gat = page.locator("#entry-gat").locator("xpath=..").locator(".full-select-display > span");
    const lineHeight = await gat.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
    expect((await gat.boundingBox())!.height).toBeLessThan(lineHeight * 1.5);
    await expect(page.locator("#entry-gat-name")).toHaveText("Alerta de violências com IA");
  });

  test("B3: cartão do perfil em 2 linhas, nome como digitado e ações com a mesma altura", async ({ page }) => {
    await seed(page);
    const button = page.locator(".profile-button");
    await expect(button.locator("strong")).toHaveText(PROFILE.name);
    expect(await button.locator("strong").evaluate((el) => getComputedStyle(el).textTransform)).toBe("none");
    for (const part of ["strong", "small"]) {
      const el = button.locator(part);
      const lineHeight = await el.evaluate((node) => parseFloat(getComputedStyle(node).lineHeight) || 20);
      expect((await el.boundingBox())!.height, part).toBeLessThan(lineHeight * 1.5);
    }
    await expect(button.locator("small")).toHaveText(/Monitor\(a\) · GAT 01/);
    await expect(button.locator(".profile-gat-name")).toBeHidden();
    await button.click();
    await expect(page.locator(".participant-menu-info")).toHaveText("GAT 01 · Alerta de violências com IA");
    await page.keyboard.press("Escape");
    const heights = await page.locator(".backup-tools button").evaluateAll((items) => items.map((b) => Math.round(b.getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
    const fonts = await page.locator(".backup-tools button").evaluateAll((items) => items.map((b) => getComputedStyle(b).fontSize));
    expect(new Set(fonts).size).toBe(1);
    expect(await page.getByRole("button", { name: "Salvar cópia", exact: true }).evaluate((el) => (el as HTMLElement).innerText.trim())).toBe("Salvar");
    const icons = await page.locator(".workspace-tabs button svg").evaluateAll((items) => items.map((svg) => svg.getBoundingClientRect().width));
    expect(icons.every((width) => width === 18)).toBe(true);
  });

  test("B4: resumo sem mês repetido e com Mensal | Semanal tocáveis", async ({ page }) => {
    await seed(page);
    await expect(page.locator(".summary-progress-head")).not.toContainText("Novembro");
    const toggles = await page.locator(".summary-view-toggle label.choice").evaluateAll((items) => items.map((l) => l.getBoundingClientRect().height));
    expect(toggles.every((height) => height >= 44)).toBe(true);
    const head = await page.locator(".summary-progress-head strong").boundingBox();
    const toggle = await page.locator(".summary-view-toggle").boundingBox();
    expect(toggle!.y).toBeGreaterThanOrEqual(head!.y + head!.height + 4);
  });

  test("B5: Minha folha | Modelo em branco como controle segmentado e um só botão primário", async ({ page }) => {
    await seed(page);
    await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
    const options = page.locator(".sheet-mode-option");
    const styles = await options.evaluateAll((items) => items.map((b) => {
      const s = getComputedStyle(b);
      return { border: parseFloat(s.borderTopWidth), background: s.backgroundColor, pressed: b.getAttribute("aria-pressed") };
    }));
    expect(styles.every((s) => s.border >= 1)).toBe(true);
    expect(styles[0].background).not.toBe(styles[1].background);
    const primaries = async () => page.locator("main .primary-button:visible").count();
    expect(await primaries()).toBe(1);
    await page.getByRole("button", { name: "Modelo em branco", exact: true }).click();
    expect(await primaries()).toBe(1);
    await expect(page.getByRole("link", { name: "Baixar .docx" })).toHaveClass(/secondary-button/);
  });

  test("B6: a prévia mostra a faixa de logos, cabe na largura e abre em tamanho real; a impressão não muda", async ({ page }) => {
    await seed(page);
    await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
    const stage = page.locator(".sheet-stage");
    const logos = stage.locator(".pet-sheet-header img");
    await expect(logos).toBeVisible();
    expect(await logos.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const stageBox = (await stage.boundingBox())!;
    const logoBox = (await logos.boundingBox())!;
    expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
    expect(logoBox.height).toBeGreaterThan(5);
    await expect(stage).toHaveAttribute("data-scaled", "true");
    expect(await stage.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const real = page.getByRole("button", { name: "Ver em tamanho real" });
    await real.click();
    await expect(real).toHaveAttribute("aria-pressed", "true");
    await expect(stage).toHaveAttribute("data-scaled", "false");
    expect(await stage.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Impressão: a prévia some e a folha impressa não tem escala.
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".sheet-preview")).toBeHidden();
    const printed = await page.locator(".print-only-wrapper .official-sheet").evaluate((sheet) => ({
      transform: getComputedStyle(sheet).transform,
      parentTransform: getComputedStyle(sheet.parentElement!).transform,
      logos: (sheet.querySelector(".pet-sheet-header img") as HTMLImageElement).getBoundingClientRect().height,
    }));
    expect(printed.transform).toBe("none");
    expect(printed.parentTransform).toBe("none");
    expect(printed.logos).toBeGreaterThan(20);
    const pdf = await page.pdf({ preferCSSPageSize: true });
    // Folha (registro e instruções): 2 páginas, como antes.
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(2);
    await page.emulateMedia({ media: "screen" });
  });
});
