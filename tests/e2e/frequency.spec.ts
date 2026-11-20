import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const user = {
  id: "test-resume",
  name: "Pessoa de teste",
  role: "Monitor(a)",
  gatNumber: "01",
  gatName: "GAT de teste",
  createdAt: "2026-10-01T00:00:00.000Z",
};
const activity = {
  id: "test-record",
  date: "2026-10-07",
  start: "14:00",
  end: "15:30",
  description: "Registro anterior de teste",
  modality: "Interação em tempo real (Síncrona)",
  local: "Sala de teste",
  descricao: "Descrição de teste",
  hours: 1.5,
};
const keys = {
  profiles: "pet_folha_profiles_v3",
  active: "pet_folha_active_profile_id_v3",
  october: `pet_folha_activities_v3_${user.id}_2026-10`,
};

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-02T15:00:00Z") });
});

async function create(page: Page) {
  await page.goto("/");
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("Participante sintético");
  await page
    .getByRole("button", { name: "Abrir minha folha", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Minha frequência", exact: true }),
  ).toBeVisible();
}

/** Concluir com CH incompleta abre um aviso antes do modal; aceita e segue. */
async function concluir(page: Page) {
  await page.getByRole("button", { name: /^Concluir/ }).click();
  const warning = page.getByRole("dialog", { name: "Folha com CH incompleta" });
  if (await warning.waitFor({ timeout: 2000 }).then(() => true, () => false))
    await warning.getByRole("button", { name: "Gerar assim mesmo", exact: true }).click();
}

async function add(page: Page) {
  await page.getByLabel("Data", { exact: true }).fill("2026-11-02");
  await page.getByLabel("Início", { exact: true }).fill("13:30");
  await page.getByLabel("Fim", { exact: true }).fill("17:30");
  await page.getByLabel("Unidade/Local", { exact: true }).fill("Sala sintética");
  await page
    .getByLabel("Atividade desenvolvida", { exact: true })
    .fill("Atividade sintética");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Pauta sintética de teste");
  await page
    .getByRole("button", { name: "Adicionar atividade", exact: true })
    .click();
  // CH exata: 13:30 às 17:30 = 4h (a regra antiga daria 5h).
  await expect(page.locator(".summary-total strong")).toHaveText("4");
}

test("perfil repetido retoma sem arquivo e preserva meses anteriores", async ({
  page,
}) => {
  await page.addInitScript(
    ({ user, activity, keys }) => {
      if (localStorage.getItem("test-seeded")) return;
      localStorage.setItem(keys.profiles, JSON.stringify([user]));
      localStorage.setItem(keys.october, JSON.stringify([activity]));
      localStorage.setItem("test-seeded", "1");
    },
    { user, activity, keys },
  );
  await page.goto("/");
  await expect(
    page.getByRole("list", { name: "Perfis neste navegador" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Primeiro acesso", exact: true })
    .click();
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("  PESSOA DE TESTE  ");
  await page
    .getByRole("button", { name: "Abrir minha folha", exact: true })
    .click();
  await expect(
    page.getByText("Sua folha já está neste navegador", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continuar com este perfil", exact: true })
    .click();
  await expect(page.getByLabel("Mês da folha")).toHaveValue("2026-11");
  await expect(page.locator(".summary-total strong")).toHaveText("0");
  await page.getByLabel("Mês da folha").selectOption("2026-10");
  await expect(page.locator(".summary-total strong")).toHaveText("1h30");
  // Sair fica no menu do participante (Concluir não encerra mais a sessão).
  await page.getByRole("button", { name: /menu do participante/ }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.getByRole("button", { name: `Abrir folha de ${user.name}`, exact: true }).click();
  await page.reload();
  const stored = await page.evaluate(
    (keys) => ({
      profiles: JSON.parse(localStorage.getItem(keys.profiles)!),
      october: JSON.parse(localStorage.getItem(keys.october)!),
      active: localStorage.getItem(keys.active),
    }),
    keys,
  );
  expect(stored.profiles).toHaveLength(1);
  expect(stored.active).toBe(user.id);
  expect(stored.october).toEqual([activity]);
});

test("lançar, editar, exportar, restaurar, imprimir e excluir", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await create(page);
  await add(page);
  await page.getByRole("button", { name: /^Editar atividade:/ }).click();
  const edit = page
    .getByRole("dialog", { name: "Editar atividade", exact: true })
    .first();
  await expect(edit.getByLabel("Unidade/Local", { exact: true })).toHaveValue("Sala sintética");
  await edit.getByLabel("Fim", { exact: true }).fill("18:15");
  await edit.getByRole("button", { name: /Salvar/ }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("4h45");
  await page.reload();
  await expect(page.locator(".summary-total strong")).toHaveText("4h45");
  await page.evaluate(() =>
    Object.defineProperty(window, "showSaveFilePicker", {
      configurable: true,
      value: undefined,
    }),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar cópia", exact: true }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath("backup.json");
  await download.saveAs(backupPath);
  await page
    .getByLabel("Restaurar cópia de segurança", { exact: true })
    .setInputFiles(backupPath);
  await expect(
    page.getByText("Restaurar esta cópia?", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Restaurar cópia", exact: true })
    .click();
  await expect(
    page.getByText("Cópia restaurada. Confira o mês e os registros.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Folha oficial", exact: true })
    .click();
  const sheet = page.locator(".sheet-stage .official-sheet");
  await expect(sheet).toContainText("REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD");
  await expect(sheet).toContainText("Total de CH no mês: 4h45");
  await expect(sheet).toContainText("( X ) Monitor(a)");
  await expect(sheet.locator(".pet-sheet-activities tbody tr").first()).toContainText(
    "02/11Sala sintéticaAtividade sintética13:3018:154h45Interação em tempo real (Síncrona)Pauta sintética de teste",
  );
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printOpened = "true";
    };
  });
  await page
    .getByRole("button", { name: "Imprimir", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-print-opened",
    "true",
  );
  if (testInfo.project.name === "desktop") {
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: testInfo.outputPath("folha.pdf"),
      preferCSSPageSize: true,
      printBackground: true,
    });
    await page.emulateMedia({ media: "screen" });
  }
  await page
    .getByRole("button", { name: "Minha frequência", exact: true })
    .click();
  await page.getByRole("button", { name: /^Excluir atividade:/ }).click();
  await page.getByRole("button", { name: "Sim, excluir", exact: true }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("0");
  expect(errors).toEqual([]);
});

test("erro de cópia e cancelamento preservam dados; formulário não some ao trocar de mês", async ({
  page,
}) => {
  await create(page);
  await add(page);
  await page
    .getByLabel("Restaurar cópia de segurança", { exact: true })
    .setInputFiles({
      name: "invalido.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        '{"user":{"name":"SEGREDO_TESTE"},"activities":[null]}',
      ),
    });
  await expect(
    page.getByText("Não foi possível restaurar", { exact: true }),
  ).toBeVisible();
  await page.getByText("Detalhes para suporte", { exact: true }).click();
  await expect(page.locator(".operation-notice pre")).not.toContainText(
    "SEGREDO_TESTE",
  );
  await expect(page.locator(".summary-total strong")).toHaveText("4");
  await page.getByRole("button", { name: "Fechar aviso", exact: true }).click();
  await page
    .getByLabel("Atividade desenvolvida", { exact: true })
    .fill("Rascunho mantido");
  await page.getByLabel("Mês da folha").selectOption("2026-10");
  await page
    .getByRole("button", { name: "Continuar editando", exact: true })
    .click();
  await expect(
    page.getByLabel("Atividade desenvolvida", { exact: true }),
  ).toHaveValue("Rascunho mantido");
  await expect(page.getByLabel("Mês da folha")).toHaveValue("2026-11");
});

test("temas, larguras, controles e retorno de foco", async ({
  page,
}, testInfo) => {
  await create(page);
  await add(page);
  for (const theme of ["dark", "light"]) {
    await page.evaluate((theme) => {
      localStorage.setItem("pet_theme", theme);
      window.dispatchEvent(new Event("pet-theme-change"));
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const sizes = await page
        .locator(
          "#nova-atividade input, #nova-atividade select, #nova-atividade textarea",
        )
        .evaluateAll((elements) =>
          elements.map((element) => ({
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
            font: parseFloat(getComputedStyle(element).fontSize),
          })),
        );
      expect(
        sizes.every(
          (size) => size.width >= 44 && size.height >= 44 && size.font >= 16,
        ),
      ).toBe(true);
      const smallText = await page
        .locator(
          ".screen-only label, .screen-only button, .screen-only p, .screen-only td, .screen-only th, .screen-only small",
        )
        .evaluateAll((elements) =>
          elements
            .filter(
              (element) =>
                element.getBoundingClientRect().width &&
                element.getBoundingClientRect().height &&
                !element.closest(".official-sheet"),
            )
            .filter(
              (element) => parseFloat(getComputedStyle(element).fontSize) < 14,
            )
            .map(
              (element) =>
                element.tagName +
                ": " +
                element.textContent?.trim().slice(0, 50),
            ),
        );
      expect(smallText).toEqual([]);
      await page.screenshot({
        path: testInfo.outputPath(`painel-${theme}-${width}.png`),
        fullPage: true,
      });
    }
  }
  const help = page.getByRole("button", { name: "Abrir ajuda", exact: true });
  await help.click();
  await expect(
    page.getByRole("dialog", { name: "Ajuda com sua folha", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toBeFocused();
});

test("falha de gravação mantém formulário e permite tentar novamente", async ({
  page,
}) => {
  await create(page);
  await page.getByLabel("Início", { exact: true }).fill("13:30");
  await page.getByLabel("Fim", { exact: true }).fill("17:30");
  await page
    .getByLabel("Atividade desenvolvida", { exact: true })
    .fill("Preenchimento preservado");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Object.defineProperty(window, "restoreStorageForTest", {
      value: () => {
        Storage.prototype.setItem = original;
      },
    });
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("pet_folha_activities_v3_"))
        throw new DOMException("Quota", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page
    .getByRole("button", { name: "Adicionar atividade", exact: true })
    .click();
  await expect(page.locator(".operation-notice[role=alert]")).toContainText(
    "Seu preenchimento foi mantido",
  );
  await expect(
    page.getByLabel("Atividade desenvolvida", { exact: true }),
  ).toHaveValue("Preenchimento preservado");
  await expect(page.locator(".summary-total strong")).toHaveText("0");
  await page.evaluate(() => {
    const restore = Reflect.get(window, "restoreStorageForTest");
    if (typeof restore !== "function")
      throw new Error("Missing test recovery callback");
    restore();
  });
  await page
    .getByRole("button", { name: "Adicionar atividade", exact: true })
    .click();
  await expect(page.locator(".summary-total strong")).toHaveText("4");
});

test("folha extensa pagina, repete o cabeçalho da tabela e deixa assinaturas e instruções no final", async ({
  page,
}) => {
  await create(page);
  await page.evaluate(() => {
    const id = localStorage.getItem("pet_folha_active_profile_id_v3");
    const records = Array.from({ length: 40 }, (_, index) => ({
      id: `long-${index}`,
      date: "2026-11-02",
      start: "14:00",
      end: "15:00",
      modality: "Assíncrona",
      local: "-",
      description: `Atividade longa ${index + 1}`,
      descricao:
        "Descrição sintética extensa para verificar o limite de impressão. ".repeat(
          4,
        ),
      hours: 1,
    }));
    localStorage.setItem(
      `pet_folha_activities_v3_${id}_2026-11`,
      JSON.stringify(records),
    );
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Folha oficial", exact: true })
    .click();
  await page.evaluate(() => {
    window.print = () => {
      document.documentElement.dataset.printOpened = "true";
    };
  });
  await page
    .getByRole("button", { name: "Imprimir", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-print-opened", "true");
  const bytes = await page.pdf({ preferCSSPageSize: true });
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({ data: new Uint8Array(bytes) });
  const pdf = await task.promise;
  try {
    expect(pdf.numPages).toBeGreaterThan(2);
    const texts: string[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const sheet = await pdf.getPage(number);
      const { width, height } = sheet.getViewport({ scale: 1 });
      // Carta paisagem: 792 x 612 pt.
      expect([Math.round(width), Math.round(height)]).toEqual([792, 612]);
      const content = await sheet.getTextContent();
      texts.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    const last = texts.at(-1)!;
    expect(last).toContain("Instruções de preenchimento");
    expect(last).not.toContain("Assinatura do Participante");
    const signaturePages = texts
      .map((text, index) => (text.includes("Assinatura do Participante") ? index : -1))
      .filter((index) => index >= 0);
    expect(signaturePages).toEqual([texts.length - 2]);
    expect(texts[texts.length - 2]).toContain("Assinatura do Responsável");
    expect(texts.join(" ")).toContain("Total de CH no mês: 40 horas");
    for (const text of texts.filter((text) => text.includes("Atividade longa")))
      expect(text).toContain("Unidade/Local");
  } finally {
    await task.destroy();
  }
  expect(
    await page.evaluate(() => {
      const id = localStorage.getItem("pet_folha_active_profile_id_v3");
      return JSON.parse(
        localStorage.getItem(`pet_folha_activities_v3_${id}_2026-11`)!,
      ).length;
    }),
  ).toBe(40);
});

test("erro em edição mantém o diálogo, o preenchimento e o foco", async ({
  page,
}) => {
  await create(page);
  await add(page);
  await page.getByRole("button", { name: /^Editar atividade:/ }).click();
  const edit = page.getByRole("dialog", {
    name: "Editar atividade",
    exact: true,
  });
  await edit
    .getByLabel("Atividade desenvolvida", { exact: true })
    .fill("Correção preservada");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await edit.getByRole("button", { name: /Salvar/ }).click();
  await expect(
    page.getByText("Atividade não salva", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entendido", exact: true }).click();
  await expect(
    edit.getByLabel("Atividade desenvolvida", { exact: true }),
  ).toHaveValue("Correção preservada");
  await expect(edit.getByRole("button", { name: /Salvar/ })).toBeFocused();
  await edit.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: /Participante sintético Monitor\(a\).*menu do participante/ })
    .click();
  await page.getByRole("menuitem", { name: "Editar identificação" }).click();
  const profile = page.getByRole("dialog", {
    name: "Identificação do participante",
    exact: true,
  });
  await profile.getByLabel("Nome completo", { exact: true }).fill("Identificação preservada");
  await profile.getByRole("button", { name: /Salvar/ }).click();
  await expect(
    page.getByText("Identificação não salva", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Entendido", exact: true }).click();
  await expect(profile.getByLabel("Nome completo", { exact: true })).toHaveValue(
    "Identificação preservada",
  );
});


test("seletor de mês mantém opções contrastantes nos dois temas e funciona pelo teclado", async ({ page }, testInfo) => {
  await create(page);
  const month = page.getByLabel("Mês da folha", { exact: true });
  for (const theme of ["dark", "light"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    const colors = await month.locator("option").first().evaluate((option) => {
      const style = getComputedStyle(option);
      const rgb = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
      const luminance = (color: string) => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const a = luminance(style.color), b = luminance(style.backgroundColor);
      return { background: style.backgroundColor, scheme: style.colorScheme, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
    });
    expect(colors.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(colors.scheme).toBe(theme);
    expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
    await month.selectOption("2026-11");
    await month.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(month).toHaveValue("2026-12");
    if (testInfo.project.name === "desktop") {
      await month.press("Alt+ArrowDown");
      await page.screenshot({ path: testInfo.outputPath(`month-${theme}.png`) });
      await page.keyboard.press("Escape");
    } else {
      // No celular, o Enter abre a lista nativa do select; feche-a antes da
      // próxima iteração, senão as teclas seguintes vão para a lista aberta.
      await page.keyboard.press("Escape");
    }
  }
});


test("dados do formato antigo migram para o v3; exemplo sem uso não aparece; v2 é preservado", async ({ page }) => {
  // Perfis sintéticos no formato _v2 da versão original.
  const legacy = { id: "mariana-rios", name: "Mariana Dias Rios", role: "Estudante", gatNumber: "01", gatName: "Araticum", createdAt: "2026-09-01T00:00:00.000Z" };
  const used = { id: "pessoa-v2", name: "Pessoa Sintética V2", role: "Estudante", gatNumber: "04", gatName: "Antigo", createdAt: "2026-09-01T00:00:00.000Z" };
  const old = [{ id: "v2-a", date: "2026-10-06", start: "14:00", end: "15:30", modality: "Síncrona presencial", description: "Reunião antiga", hours: 2 }];
  await page.goto("/");
  await page.evaluate(({ legacy, used, old }) => {
    localStorage.clear();
    localStorage.setItem("pet_folha_profiles_v2", JSON.stringify([legacy, used]));
    localStorage.setItem("pet_folha_activities_v2_pessoa-v2_2026-10", JSON.stringify(old));
  }, { legacy, used, old });
  await page.reload();
  const cards = page.getByRole("list", { name: "Perfis neste navegador" }).getByRole("listitem");
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText(used.name);
  await expect(cards).toContainText(/Monitor\(a\)/);
  await expect(cards).toContainText("1 mês com atividades");
  await expect(page.getByText(/O JSON é um arquivo que guarda sua identificação/)).toBeVisible();
  await expect(page.getByText(/Quem usa este navegador pode abrir/)).toBeVisible();
  await page.getByRole("button", { name: `Abrir folha de ${used.name}`, exact: true }).click();
  await page.getByLabel("Mês da folha").selectOption("2026-10");
  await expect(page.locator(".summary-total strong")).toHaveText("1h30");
  await expect(page.locator(".record-hours:visible, .record-meta strong:visible").first()).toHaveText("1h30");
  const stored = await page.evaluate(() => ({
    v2: JSON.parse(localStorage.getItem("pet_folha_profiles_v2")!).length,
    v2Activities: localStorage.getItem("pet_folha_activities_v2_pessoa-v2_2026-10"),
    v3: JSON.parse(localStorage.getItem("pet_folha_activities_v3_pessoa-v2_2026-10")!),
  }));
  expect(stored.v2).toBe(2);
  expect(JSON.parse(stored.v2Activities!)).toEqual(old);
  // "Síncrona presencial" era a atividade presencial: vira In Loco.
  expect(stored.v3[0]).toMatchObject({ modality: "Interação em tempo real (In Loco)", local: "", descricao: "", hours: 1.5 });
});

test("avaliação do site abre o formulário em nova aba; sem formulário de registro", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Clima/)).toHaveCount(0);
  await expect(page.locator("footer")).toContainText("Felipe Gonçalves Vidal");
  const rate = page.getByRole("button", { name: "Avaliar o site", exact: true });
  await expect(rate).toBeVisible();
  await rate.click();
  const link = page
    .getByRole("dialog", { name: "Avaliar o site" })
    .getByRole("link", { name: /Abrir formulário de avaliação/ });
  // Endereço exato, sem parâmetros: nenhum dado do usuário vai na URL.
  await expect(link).toHaveAttribute("href", "https://forms.gle/tjpuiFpgJ2Njnx7F7");
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await page.keyboard.press("Escape");
  await create(page);
  await add(page);
  // Mesmo link no rodapé do painel, depois de criar a folha.
  await page.getByRole("button", { name: "Avaliar o site", exact: true }).click();
  await expect(link).toHaveAttribute("href", "https://forms.gle/tjpuiFpgJ2Njnx7F7");
  await page.keyboard.press("Escape");
  // O PET-SD não tem formulário de registro: nada de Forms no painel nem no Concluir.
  await expect(page.getByRole("button", { name: /Forms/ })).toHaveCount(0);
  await concluir(page);
  await expect(page.getByRole("link", { name: "Abrir formulário de atividades" })).toHaveCount(0);
});

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAMklEQVR4nGP4T2PAQCcLFPoCqI5GLRi1YNSCUQtGLRi1YNSCUQtGLRi1gBwLaAdobgEAXUfXXDidab8AAAAASUVORK5CYII=",
  "base64",
);
const imageProof = { name: "foto.png", mimeType: "image/png", buffer: png };

function makePdf(pageCount: number) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count " + pageCount + " /Kids [" +
      Array.from({ length: pageCount }, (_, i) => 3 + 2 * i + " 0 R").join(" ") + "] >>",
  ];
  for (let i = 0; i < pageCount; i++) {
    const instructions = i % 2 ? "0 0 1 rg 0 0 400 200 re f" : "1 0 0 rg 0 0 400 200 re f";
    const orientation = i % 2 ? " /Rotate 90" : "";
    objects.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200]" +
      orientation + " /Resources << >> /Contents " + (4 + 2 * i) + " 0 R >>");
    objects.push("<< /Length " + instructions.length + " >>\nstream\n" + instructions + "\nendstream");
  }
  let source = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = source.length;
    source += (i + 1) + " 0 obj\n" + object + "\nendobj\n";
    return String(offset).padStart(10, "0") + " 00000 n \n";
  });
  const xref = source.length;
  source += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n" + offsets.join("") +
    "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(source);
}

function proofs(page: Page) {
  return page.getByRole("region", { name: "Comprovação fotográfica" });
}

async function openSheet(page: Page) {
  await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
  await expect(proofs(page).getByLabel("Adicionar comprovantes")).toBeEnabled();
}

async function restoreCopy(page: Page, data: object, inputLabel = "Restaurar cópia de segurança") {
  await page.getByLabel(inputLabel, { exact: true }).setInputFiles({
    name: "copia.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  const dialog = page.getByRole("dialog", { name: "Restaurar esta cópia?" });
  await dialog.getByRole("button", { name: "Restaurar cópia", exact: true }).click();
}

test("comprovantes opcionais persistem por mês e perfil e entram nas duas impressões", async ({ page }, testInfo) => {
  await create(page);
  await openSheet(page);
  await expect(proofs(page)).toContainText("Nenhum comprovante neste mês.");
  await proofs(page).getByLabel("Adicionar comprovantes").setInputFiles([
    imageProof,
    { name: "relatorio.pdf", mimeType: "application/pdf", buffer: makePdf(2) },
    { name: "invalido.png", mimeType: "image/png", buffer: Buffer.from("texto") },
    { name: "grande.pdf", mimeType: "application/pdf", buffer: makePdf(31) },
    { name: "corrompido.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nbroken") },
  ]);
  const notices = proofs(page).getByRole("alert");
  await expect(notices).toContainText("invalido.png — formato inválido");
  await expect(notices).toContainText("grande.pdf — o PDF excede o limite de 30 páginas");
  await expect(notices).toContainText("corrompido.pdf — o PDF está ilegível");
  await expect(proofs(page).getByRole("listitem").filter({ has: page.getByRole("button", { name: /^Abrir/ }) })).toHaveCount(2);

  await page.reload();
  await openSheet(page);
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      const pages = [...document.querySelectorAll<HTMLImageElement>(".print-attachment-page img")];
      document.documentElement.dataset.printPages = pages.map(({ naturalWidth, naturalHeight }) =>
        naturalWidth === naturalHeight ? "quadrada" : naturalWidth > naturalHeight ? "paisagem" : "retrato"
      ).join(",") || "sem-comprovantes";
    };
  });
  const print = () => page.getByRole("button", { name: "Imprimir", exact: true }).click();
  await print();
  await expect(page.locator("html")).toHaveAttribute("data-print-pages", "quadrada,paisagem,retrato");
  if (testInfo.project.name === "desktop") {
    const pdf = await page.pdf({ path: testInfo.outputPath("folha-com-comprovantes.pdf"), preferCSSPageSize: true });
    // Folha (2 páginas: registro e instruções) + 3 páginas de comprovantes.
    expect(pdf.toString("latin1").match(/\/Type \/Page\b/g)).toHaveLength(5);
  }

  await page.getByRole("button", { name: "Modelo em branco", exact: true }).click();
  await expect(proofs(page)).toHaveCount(0);
  await print();
  await expect(page.locator("html")).toHaveAttribute("data-print-pages", "sem-comprovantes");
  await concluir(page);
  await page.getByRole("dialog", { name: "Salvar folha e concluir" })
    .getByRole("button", { name: "Imprimir", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-print-pages", "quadrada,paisagem,retrato");
  await page.getByRole("button", { name: "Continuar editando", exact: true }).click();

  await page.getByLabel("Mês da folha").selectOption("2026-10");
  await expect(proofs(page)).toContainText("Nenhum comprovante neste mês.");
  await page.getByLabel("Mês da folha").selectOption("2026-11");
  await proofs(page).getByRole("button", { name: "Remover foto.png" }).click();
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toHaveCount(0);
  await expect(proofs(page).getByRole("button", { name: "Abrir relatorio.pdf" })).toBeVisible();

  await page.getByRole("button", { name: /menu do participante/ }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await page.getByRole("button", { name: "Sair sem salvar cópia", exact: true }).click();
  await page.getByRole("button", { name: "Primeiro acesso", exact: true }).click();
  await page.getByLabel("Nome completo", { exact: true }).fill("Outro participante");
  await page.getByRole("button", { name: "Abrir minha folha", exact: true }).click();
  await openSheet(page);
  await expect(proofs(page)).toContainText("Nenhum comprovante neste mês.");
});

test("cópias com comprovantes levam os originais e a restauração reverte falhas", async ({ page, browser }, testInfo) => {
  await create(page);
  await add(page);
  await openSheet(page);
  const input = proofs(page).getByLabel("Adicionar comprovantes");
  await input.setInputFiles(imageProof);
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();
  await page.evaluate(() => Object.defineProperty(window, "showSaveFilePicker", {
    configurable: true, value: undefined,
  }));
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar cópia", exact: true }).click();
  const file = testInfo.outputPath("copia-com-comprovantes.json");
  await (await downloadPromise).saveAs(file);
  const data = JSON.parse(await readFile(file, "utf8"));
  expect(data.version).toBe("1.3");
  expect(data.attachments.map(({ name, base64 }: { name: string; base64: string }) =>
    [name, Buffer.from(base64, "base64")])).toEqual([["foto.png", png]]);

  const secondBrowser = await browser.newContext({ locale: "pt-BR" });
  try {
    const fresh = await secondBrowser.newPage();
    await fresh.goto(page.url());
    await fresh.getByRole("button", { name: "Restaurar cópia", exact: true }).click();
    await restoreCopy(fresh, data, "Cópia de segurança da folha");
    await expect(fresh.locator(".summary-total strong")).toHaveText("4");
    await openSheet(fresh);
    await expect(proofs(fresh).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();
  } finally {
    await secondBrowser.close();
  }

  const legacy = { ...data, version: "1.0", attachments: undefined };
  await restoreCopy(page, legacy);
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();

  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      request.addEventListener("success", () => this.transaction.abort(), { once: true });
      return request;
    };
  });
  await input.setInputFiles({ ...imageProof, name: "nao-salvo.png" });
  await expect(proofs(page).getByRole("alert")).toContainText("Não foi possível salvar os arquivos");
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();
  await expect(proofs(page).getByRole("button", { name: "Abrir nao-salvo.png" })).toHaveCount(0);

  const replacement = { ...data, activities: [], attachments: [{ ...data.attachments[0], name: "substituta.png" }] };
  await restoreCopy(page, replacement);
  await expect(page.getByText("Não foi possível restaurar", { exact: true })).toBeVisible();
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();
  await page.getByRole("button", { name: "Minha frequência", exact: true }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("4");

  await page.reload();
  await openSheet(page);
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toBeVisible();
  await restoreCopy(page, replacement);
  await expect(proofs(page).getByRole("button", { name: "Abrir substituta.png" })).toBeVisible();
  await expect(proofs(page).getByRole("button", { name: "Abrir foto.png" })).toHaveCount(0);
});

test("novidades mostram data de publicação nos dois temas", async ({ page }, testInfo) => {
  await page.goto("/");
  const section = page.getByRole("region", { name: "Novidades do site" });
  await expect(section.getByRole("heading", { name: "Concluir confere a CH e meta síncrona na visão Semanal" })).toBeVisible();
  await expect(section.getByText("Última atualização", { exact: false })).toContainText("19 de novembro de 2026");
  await section.getByText("Ver histórico de atualizações", { exact: true }).click();
  await expect(section.getByRole("heading", { name: "Meta síncrona e preenchimento pelo histórico" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Datas livres, folha em Word e assinatura gov.br" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Ajustes para o celular" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Perfis, menu do participante e visão semanal" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Ajustes no formulário e nova modalidade" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Novo visual com a marca do PET-SD" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Folha no modelo do PET-SD" })).toBeVisible();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await section.screenshot({ path: testInfo.outputPath("novidades-" + theme + ".png") });
  }
});

test("primeiro acesso começa no GAT 01, lista os GATs em ordem e conta no singular", async ({ page }) => {
  await page.goto("/");
  // Chaves "10".."13" vêm antes de "01" em Object.keys; o padrão deve ser o 01.
  await expect(page.getByLabel("GAT", { exact: true })).toHaveValue("01");
  const numbers = await page
    .getByLabel("GAT", { exact: true })
    .locator("option")
    .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  expect(numbers).toEqual([...numbers].sort((a, b) => Number(a) - Number(b)));
  await create(page);
  await expect(page.getByRole("button", { name: /Participante sintético Monitor\(a\) · GAT 01/ })).toBeVisible();
  await add(page);
  await page.getByRole("button", { name: "Limpar mês", exact: true }).click();
  await expect(page.getByText(/^A atividade de .+ será removida\./)).toBeVisible();
});

// Rótulos, botões e textos cortados (scrollWidth > clientWidth) e selects cuja
// opção escolhida não cabe. Reticências só valem com title (texto completo).
async function cutTexts(page: Page) {
  return page.evaluate(() => {
    const ctx = document.createElement("canvas").getContext("2d")!;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
    };
    const out: string[] = [];
    for (const el of document.querySelectorAll(".screen-only :is(label, button, a, h1, h2, h3, strong, small, th, td, .full-select-display span)")) {
      if (!visible(el) || el.closest("[title], .official-sheet, .skip-link, .sr-only")) continue;
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible")
        out.push(`${el.tagName}: ${el.textContent?.trim().slice(0, 40)}`);
    }
    // Selects nativos (os do FullSelect ficam transparentes sob a caixa visível).
    for (const el of document.querySelectorAll<HTMLSelectElement>(".screen-only select")) {
      if (!visible(el) || el.closest(".full-select")) continue;
      const style = getComputedStyle(el);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const text = el.selectedOptions[0]?.text ?? "";
      const room = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 20;
      if (ctx.measureText(text).width > room) out.push(`SELECT: ${text}`);
    }
    return out;
  });
}

test("sem texto cortado, foco visível e folha oficial em preto e branco", async ({ page }) => {
  await page.goto("/");
  // GAT com o nome mais longo: o texto precisa aparecer inteiro.
  await page.getByLabel("GAT", { exact: true }).selectOption("11");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await cutTexts(page), `entrada ${width}px`).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByLabel("GAT", { exact: true }).selectOption("01");
  await create(page);
  await add(page);
  // Modalidade padrão do formulário: Síncrona (PROGRAM.defaultModality).
  await expect(page.getByRole("radio", { name: "Interação em tempo real (Síncrona)", exact: true })).toBeChecked();
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const cut = await cutTexts(page);
      expect(cut, `${theme} ${width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  // Foco por teclado: anel visível (contorno sólido de pelo menos 2 px).
  await page.getByLabel("Descrição", { exact: true }).focus();
  await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return { text: el.textContent?.trim(), style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(ring.text).toContain("Adicionar atividade");
  expect(ring.style).not.toBe("none");
  expect(ring.width).toBeGreaterThanOrEqual(2);
  // A folha oficial não herda a paleta da interface: só tons de cinza.
  for (const theme of ["light", "dark"]) {
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, theme);
    await openSheet(page);
    const colored = await page.locator(".sheet-stage .official-sheet").evaluate((sheet) => {
      const gray = (value: string) => {
        const m = value.match(/rgba?\(([^)]+)\)/);
        if (!m) return true;
        const [r, g, b, a = "1"] = m[1].split(/[ ,/]+/).filter(Boolean);
        return Number(a) === 0 || (r === g && g === b);
      };
      const out: string[] = [];
      for (const el of [sheet, ...sheet.querySelectorAll("*")]) {
        if (el.tagName === "IMG") continue;
        const s = getComputedStyle(el);
        for (const prop of ["color", "backgroundColor", "borderTopColor", "borderBottomColor"] as const)
          if (!gray(s[prop])) out.push(`${el.tagName}.${el.className} ${prop}=${s[prop]}`);
      }
      return out.slice(0, 5);
    });
    expect(colored, theme).toEqual([]);
    await page.getByRole("button", { name: "Minha frequência", exact: true }).click();
  }
  // Recomendação do histórico (atividade já lançada), no celular.
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole("radio", { name: "Atividade sintética", exact: true }).check();
  expect(await cutTexts(page), "recomendação 390px").toEqual([]);
});

test("preenchimento rápido vem do histórico: sem modelos padrão; escolher preenche tudo menos a data", async ({ page }) => {
  // Modelos antigos salvos neste navegador não aparecem mais (nem são apagados).
  await page.addInitScript(() => {
    if (localStorage.getItem("test-seeded")) return;
    localStorage.setItem("pet_folha_config_templates_v3", JSON.stringify([{ id: "tpl-x", name: "Modelo antigo", modality: "Assíncrona", local: "-" }]));
    localStorage.setItem("test-seeded", "1");
  });
  await create(page);
  await expect(page.getByRole("radiogroup", { name: /Preenchimento rápido/ })).toHaveCount(0);
  await expect(page.getByText("As atividades que você registrar aparecem aqui", { exact: false })).toBeVisible();
  await expect(page.getByText("Modelo antigo")).toHaveCount(0);

  await add(page); // 02/11, 13:30–17:30, "Atividade sintética", Sala sintética
  const quick = page.getByRole("radiogroup", { name: /Preenchimento rápido/ });
  await expect(quick.locator(".choice-text")).toHaveText(["Em branco", "Atividade sintética"]);
  await page.getByLabel("Data", { exact: true }).fill("2026-11-09");
  await quick.getByRole("radio", { name: "Atividade sintética" }).check();
  await expect(page.getByLabel("Atividade desenvolvida", { exact: true })).toHaveValue("Atividade sintética");
  await expect(page.getByLabel("Unidade/Local", { exact: true })).toHaveValue("Sala sintética");
  await expect(page.getByLabel("Início", { exact: true })).toHaveValue("13:30");
  await expect(page.getByLabel("Fim", { exact: true })).toHaveValue("17:30");
  await expect(page.getByLabel("Descrição", { exact: true })).toHaveValue("Pauta sintética de teste");
  // A data escolhida não muda, e nada é gravado sem clicar em Adicionar.
  await expect(page.getByLabel("Data", { exact: true })).toHaveValue("2026-11-09");
  await expect(page.locator(".summary-total strong")).toHaveText("4");
  // "Em branco" limpa o que a recomendação preencheu.
  await quick.getByRole("radio", { name: "Em branco" }).check();
  await expect(page.getByLabel("Atividade desenvolvida", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Início", { exact: true })).toHaveValue("");
  await quick.getByRole("radio", { name: "Atividade sintética" }).check();
  await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("8");
  // Mesma atividade duas vezes: um chip só.
  await expect(quick.locator(".choice-text")).toHaveText(["Em branco", "Atividade sintética"]);
  // Digitar outra atividade volta a marcar "Em branco".
  await quick.getByRole("radio", { name: "Atividade sintética" }).check();
  await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Outra atividade");
  await expect(quick.getByRole("radio", { name: "Em branco" })).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("pet_folha_config_templates_v3"))).toContain("Modelo antigo");
});

test("cartões .pdf e .json: mesma altura lado a lado, altura própria empilhados", async ({ page }, testInfo) => {
  await page.goto("/");
  const cards = await page.locator(".file-guide-item").evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      const icon = element.querySelector("svg")!.getBoundingClientRect();
      const title = element.querySelector("h3")!.getBoundingClientRect();
      return { top: box.top, height: box.height, icon: icon.top - box.top, title: title.top - box.top };
    }),
  );
  expect(cards).toHaveLength(2);
  expect(cards[0].icon).toBeCloseTo(cards[1].icon, 0);
  expect(cards[0].title).toBeCloseTo(cards[1].title, 0);
  if (testInfo.project.name === "desktop") {
    expect(cards[0].top).toBeCloseTo(cards[1].top, 0);
    expect(cards[0].height).toBeCloseTo(cards[1].height, 0);
  } else {
    // Empilhados: o .pdf tem menos texto e fica mais baixo que o .json.
    expect(cards[1].top).toBeGreaterThan(cards[0].top);
    expect(cards[0].height).toBeLessThan(cards[1].height);
  }
});

async function buttonsOutsideDialog(page: Page) {
  const dialog = page.locator("dialog[open] > *").last();
  await expect(dialog).toBeVisible();
  return dialog.evaluate((box) => {
    const outer = box.getBoundingClientRect();
    return [...box.querySelectorAll("button, a")]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < outer.left - 0.5 || r.right > outer.right + 0.5 || r.top < outer.top - 0.5 || r.bottom > outer.bottom + 0.5;
      })
      .map((el) => el.textContent?.trim() || el.getAttribute("aria-label"));
  });
}

test("modais: botões ficam dentro da caixa; aviso de rascunho só com rascunho", async ({ page }) => {
  await create(page);
  await add(page);
  // Logo após adicionar com sucesso, trocar de aba não pede confirmação.
  await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Folha oficial", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Minha frequência", exact: true }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  const draft = page.getByLabel("Atividade desenvolvida", { exact: true });
  const triggers: Array<[string, () => Promise<void>]> = [
    ["mês", () => page.getByLabel("Mês da folha").selectOption("2026-10").then(() => undefined)],
    ["aba", () => page.getByRole("button", { name: "Folha oficial", exact: true }).click()],
    ["concluir", () => page.getByRole("button", { name: /^Concluir/ }).click()],
  ];
  for (const [name, trigger] of triggers) {
    await draft.fill(`Rascunho ${name}`);
    await trigger();
    await expect(page.getByRole("dialog", { name: "Atividade ainda não adicionada" })).toBeVisible();
    expect(await buttonsOutsideDialog(page), name).toEqual([]);
    await page.getByRole("button", { name: "Continuar editando", exact: true }).click();
    await expect(draft).toHaveValue(`Rascunho ${name}`);
  }
  // Descartar e seguir para o Concluir: o modal de conclusão também cabe.
  await page.getByRole("button", { name: /^Concluir/ }).click();
  await page.getByRole("button", { name: "Descartar preenchimento", exact: true }).click();
  // CH incompleta: o aviso também cabe; depois, o modal de conclusão.
  await expect(page.getByRole("dialog", { name: "Folha com CH incompleta" })).toBeVisible();
  expect(await buttonsOutsideDialog(page), "aviso de CH").toEqual([]);
  await page.getByRole("button", { name: "Gerar assim mesmo", exact: true }).click();
  expect(await buttonsOutsideDialog(page), "concluir").toEqual([]);
  await page.keyboard.press("Escape");
  // Confirmação de exclusão.
  await page.getByRole("button", { name: /Excluir/ }).first().click();
  expect(await buttonsOutsideDialog(page), "excluir").toEqual([]);
});

test("data livre: 26/10 na folha de Novembro, folha em Word e assinatura gov.br", async ({ page }) => {
  await create(page);
  await expect(page.getByLabel("Mês da folha")).toHaveValue("2026-11");
  // Quem fecha a folha de 26 a 25 lança 26/10 na folha de Novembro.
  await page.getByLabel("Data", { exact: true }).fill("2026-10-26");
  await page.getByLabel("Início", { exact: true }).fill("16:30");
  await page.getByLabel("Fim", { exact: true }).fill("18:00");
  await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Reunião sintética & <teste>");
  await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("1h30");
  await expect(page.getByLabel("Mês da folha")).toHaveValue("2026-11");

  await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
  const sheet = page.locator(".sheet-stage .official-sheet");
  await expect(sheet).toContainText("26/10");
  await expect(sheet).toContainText("Total de CH no mês: 1h30");
  // Minha folha: Imprimir · Baixar .docx · Assinar no gov.br · Voltar (sem Baixar PDF).
  await expect(page.locator(".sheet-actions > *")).toHaveText(["Imprimir", "Baixar .docx", "Assinar no gov.br", "Voltar"]);
  await page.getByRole("button", { name: "Modelo em branco", exact: true }).click();
  await expect(page.locator(".sheet-actions > *")).toHaveText(["Imprimir", "Baixar .docx", "Baixar PDF", "Voltar"]);
  await page.getByRole("button", { name: "Minha folha", exact: true }).click();
  const gov = page.getByRole("link", { name: "Assinar no gov.br" });
  await expect(gov).toHaveAttribute("href", "https://www.gov.br/pt-br/servicos/assinatura-eletronica");
  await expect(gov).toHaveAttribute("target", "_blank");
  await expect(gov).toHaveAttribute("rel", "noopener noreferrer");

  // Download direto (sem seletor de pasta), como no Firefox e no celular.
  await page.evaluate(() =>
    Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined }),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar .docx", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("folha-pet-sd-participante-sintetico-2026-11.docx");
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  const xml = strFromU8(files["word/document.xml"]);
  expect(xml).toContain(">PARTICIPANTE SINTÉTICO<");
  expect(xml).toContain(">Novembro/2026<");
  expect(xml).toContain(">26/10<");
  expect(xml).toContain("Reunião sintética &amp; &lt;teste&gt;");
  expect(xml).toContain("Total de CH no mês: 1h30");
  expect(files["word/media/image1.png"]).toBeTruthy();
});

test("atividade que passa da meia-noite conta no dia de início; Duplicar copia para o formulário", async ({ page }) => {
  await create(page);
  await page.getByLabel("Data", { exact: true }).fill("2026-11-05");
  await page.getByLabel("Início", { exact: true }).fill("23:00");
  await page.getByLabel("Fim", { exact: true }).fill("03:00");
  await expect(page.getByText("Termina no dia seguinte", { exact: false })).toBeVisible();
  await expect(page.locator(".hours-preview strong")).toHaveText("4h");
  await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Plantão sintético");
  await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("4");

  // Erro de digitação (14:00 → 13:00 = 23 h) é recusado.
  await page.getByLabel("Início", { exact: true }).fill("14:00");
  await page.getByLabel("Fim", { exact: true }).fill("13:00");
  await expect(page.getByText("confira o início e o fim", { exact: false })).toBeVisible();
  await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Digitação errada");
  await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "até 12 h" })).toBeVisible();
  await expect(page.locator(".summary-total strong")).toHaveText("4");

  // Duplicar com rascunho pede confirmação; descartar abre a cópia.
  await page.getByRole("button", { name: "Duplicar atividade: Plantão sintético" }).first().click();
  await page.getByRole("button", { name: "Descartar preenchimento", exact: true }).click();
  await expect(page.getByLabel("Atividade desenvolvida", { exact: true })).toHaveValue("Plantão sintético");
  await expect(page.getByLabel("Início", { exact: true })).toHaveValue("23:00");
  await expect(page.getByLabel("Fim", { exact: true })).toHaveValue("03:00");
  await expect(page.getByLabel("Data", { exact: true })).toBeFocused();
  await page.getByLabel("Data", { exact: true }).fill("2026-11-12");
  await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
  await expect(page.locator(".summary-total strong")).toHaveText("8");

  // Folha: Unidade/Local e Descrição vazios saem como "-".
  await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
  const firstRow = page.locator(".sheet-stage .pet-sheet-activities tbody tr").first();
  await expect(firstRow.locator("td")).toHaveText(["05/11", "-", "Plantão sintético", "23:00", "03:00", "4h", "Interação em tempo real (Síncrona)", "-"]);
});

test("Concluir com CH completa vai direto; Salvar cópia é só .json e indica onde baixar PDF e Word", async ({ page }) => {
  // 16 h síncronas + 16 h assíncronas = 32 h, com a meta síncrona.
  await page.addInitScript(() => {
    if (localStorage.getItem("test-seeded")) return;
    const profile = { id: "p-ch", name: "Participante sintético", role: "Monitor(a)", gatNumber: "01", createdAt: "2026-10-01T00:00:00.000Z" };
    const act = (id: string, date: string, modality: string) => ({ id, date, start: "06:00", end: "14:00", modality, description: "Atividade sintética " + id, local: "", descricao: "" });
    localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([profile]));
    localStorage.setItem("pet_folha_active_profile_id_v3", profile.id);
    localStorage.setItem("pet_folha_activities_v3_p-ch_2026-11", JSON.stringify([
      act("1", "2026-11-03", "Interação em tempo real (Síncrona)"),
      act("2", "2026-11-04", "Interação em tempo real (In Loco)"),
      act("3", "2026-11-05", "Assíncrona"),
      act("4", "2026-11-06", "Assíncrona"),
    ]));
    localStorage.setItem("test-seeded", "1");
  });
  await page.goto("/");
  await expect(page.locator(".summary-total strong")).toHaveText("32");
  await expect(page.getByText("Mínimo mensal alcançado")).toBeVisible();
  await page.getByRole("button", { name: /^Concluir/ }).click();
  await expect(page.getByRole("dialog", { name: "Folha com CH incompleta" })).toHaveCount(0);
  const conclusion = page.getByRole("dialog", { name: "Salvar folha e concluir" });
  await expect(conclusion).toContainText("CH completa: 32 h no mês, com 16 h síncronas/In Loco.");
  await page.keyboard.press("Escape");

  await page.evaluate(() =>
    Object.defineProperty(window, "showSaveFilePicker", { configurable: true, value: undefined }),
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar cópia", exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.json$/);
  await expect(page.getByText("Para PDF ou Word, use Concluir ou a aba Folha oficial.", { exact: false })).toBeVisible();
});
