// Captura as telas principais em 1440 e 390 px, temas claro e escuro, com dados
// 100% fictícios. Serve para comparar o PET-SD com a referência de layout
// (PET-Saúde Clima) antes e depois de uma mudança de design.
//
// Uso:
//   node scripts/capturar-telas.mjs <site> <baseURL> <pasta-de-saida>
//   <site> = pet-sd | clima
// Exemplos:
//   node scripts/capturar-telas.mjs clima https://pet-folha-mensal.vercel.app docs/validation/design-20261118/antes/clima
//   npm run build && npm start   # em outro terminal (porta 5000)
//   node scripts/capturar-telas.mjs pet-sd http://127.0.0.1:5000 docs/validation/design-20261118/depois/pet-sd
//
// Cada tela vira um JPEG (qualidade 70) para não pesar no repositório. Telas que
// não existem num dos sites são registradas como "ausente" no resumo.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const [site, baseURL, outDir] = process.argv.slice(2);
if (!["pet-sd", "clima"].includes(site) || !baseURL || !outDir) {
  console.error("Uso: node scripts/capturar-telas.mjs <pet-sd|clima> <baseURL> <pasta>");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");
fs.mkdirSync(outDir, { recursive: true });

const MONTH = "2026-10";
const rows = [
  ["2026-10-01", "Sala 10 (fictícia)", "Reunião semanal do GAT 01", "11:00", "13:00", 0, "Pautas fictícias: leitura do cronograma e divisão de tarefas."],
  ["2026-10-01", "-", "Elaboração de ata", "13:00", "14:00", 1, "Registro das decisões da reunião (texto fictício)."],
  ["2026-10-07", "-", "Organização do repositório", "16:30", "18:00", 1, "Estrutura inicial de pastas e README (exemplo)."],
  ["2026-10-07", "Laboratório (fictício)", "Grupo de estudos", "18:00", "20:00", 0, "Tema fictício: introdução a redes neurais recorrentes, com leitura prévia de dois capítulos e discussão em grupo sobre aplicações em saúde digital."],
  ["2026-10-08", "Sala 10 (fictícia)", "Reunião semanal do GAT 01", "11:00", "13:00", 0, "Pautas fictícias: apresentação de estudo dirigido."],
  ["2026-10-09", "-", "Revisão de relatório", "10:00", "12:30", 1, "Revisão textual de um relatório fictício."],
  ["2026-10-11", "-", "Pesquisa bibliográfica e estudo autônomo", "14:00", "18:00", 1, "Leituras sobre proteção de dados na saúde digital (exemplo)."],
  ["2026-10-15", "Unidade de saúde (fictícia)", "Visita técnica", "08:00", "12:00", 0, "Visita de exemplo para conhecer o fluxo de registro."],
];

const adapters = {
  "pet-sd": {
    user: {
      id: "pessoa-ficticia",
      name: "Pessoa Fictícia de Exemplo com Nome Comprido",
      role: "Orientador(a) de serviço",
      gatNumber: "01",
      gatName: "Alerta de violências com IA",
      createdAt: "2026-10-01T00:00:00.000Z",
    },
    modalities: ["Interação em tempo real (Síncrona)", "Assíncrona"],
    keys: {
      profiles: "pet_folha_profiles_v3",
      active: "pet_folha_active_profile_id_v3",
      activities: (id) => `pet_folha_activities_v3_${id}_${MONTH}`,
    },
    activity: ([date, local, description, start, end, m, descricao], i, mods) => ({
      id: `ex-${i}`, date, local, description, start, end, modality: mods[m], descricao, hours: 0,
    }),
  },
  clima: {
    user: {
      id: "pessoa-ficticia",
      name: "Pessoa Fictícia de Exemplo com Nome Comprido",
      role: "Orientador de Serviço",
      gatNumber: "01",
      gatName: "Araticum",
      createdAt: "2026-10-01T00:00:00.000Z",
    },
    modalities: ["Síncrona presencial", "Assíncrona virtual"],
    keys: {
      profiles: "pet_folha_profiles_v2",
      active: "pet_folha_active_profile_id_v2",
      activities: (id) => `pet_folha_activities_v2_${id}_${MONTH}`,
    },
    // O Clima guarda as horas já calculadas pela regra dele (hora iniciada conta inteira).
    activity: ([date, , description, start, end, m], i, mods) => {
      const [sh] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      return {
        id: `ex-${i}`, date, description, start, end, modality: mods[m],
        hours: (em > 0 ? eh + 1 : eh) - sh,
      };
    },
  },
};
const a = adapters[site];
const activities = rows.map((row, i) => a.activity(row, i, a.modalities));

// Seletores aceitos nos dois sites (o rótulo do PET-SD vem primeiro).
const tabSheet = /^(Folha oficial|Folha)$/;
const helpButton = /^(Abrir ajuda|Ajuda)$/;
const settingsButton = /^(Abrir configurações locais|Configurações)$/;
const concludeButton = /^(Concluir|Conferir folha)/;
const monthLabel = /^(Mês da folha|Mês)/;

async function open(browser, { width, height, theme, seeded }) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "pt-BR",
    colorScheme: theme,
    deviceScaleFactor: 1,
    hasTouch: width < 600,
    isMobile: width < 600,
  });
  const page = await context.newPage();
  await page.addInitScript(
    ([u, acts, t, keys, seed]) => {
      if (sessionStorage.getItem("captura-seeded")) return;
      sessionStorage.setItem("captura-seeded", "1");
      localStorage.clear();
      localStorage.setItem("pet_theme", t);
      localStorage.setItem("pet_folha_onboarding_seen", "1");
      if (!seed) return;
      localStorage.setItem(keys.profiles, JSON.stringify([u]));
      localStorage.setItem(keys.active, u.id);
      localStorage.setItem(keys.activities, JSON.stringify(acts));
    },
    [a.user, activities, theme, { ...a.keys, activities: a.keys.activities(a.user.id) }, seeded],
  );
  return { context, page };
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(300);
}

async function selectMonth(page) {
  const select = page.getByLabel(monthLabel).first();
  if (await select.count()) await select.selectOption(MONTH).catch(() => {});
}

const summary = [];
async function shot(page, name, { fullPage = true } = {}) {
  const file = path.join(outDir, `${name}.jpg`);
  await page.screenshot({ path: file, fullPage, type: "jpeg", quality: 70 });
  summary.push(`ok      ${name}`);
}

async function tryModal(page, name, opener) {
  try {
    await opener();
    await page.getByRole("dialog").first().waitFor({ timeout: 4000 });
    await settle(page);
    await shot(page, name, { fullPage: false });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  } catch (error) {
    summary.push(`ausente ${name} (${String(error.message).split("\n")[0].slice(0, 80)})`);
    await page.keyboard.press("Escape").catch(() => {});
  }
}

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const [w, h] of [[1440, 1000], [390, 844]]) {
    const tag = `${theme === "light" ? "claro" : "escuro"}-${w}`;
    // 1. Entrada (navegador sem perfis).
    {
      const { context, page } = await open(browser, { width: w, height: h, theme, seeded: false });
      await page.goto(`${baseURL}/#acesso`);
      await settle(page);
      await shot(page, `entrada-${tag}`);
      await context.close();
    }
    // 2. Painel, folha e modais (perfil fictício com 8 atividades em outubro).
    const { context, page } = await open(browser, { width: w, height: h, theme, seeded: true });
    await page.goto(`${baseURL}/`);
    await settle(page);
    await selectMonth(page);
    await settle(page);
    await shot(page, `painel-${tag}`);
    if (theme === "light") {
      await tryModal(page, `modal-editar-${tag}`, () =>
        page.getByRole("button", { name: /^Editar/ }).first().click());
      await tryModal(page, `modal-limpar-${tag}`, () =>
        page.getByRole("button", { name: /^Limpar mês/ }).first().click());
      await tryModal(page, `modal-ajuda-${tag}`, async () => {
        const direct = page.getByRole("button", { name: helpButton }).first();
        if (await direct.isVisible().catch(() => false)) return direct.click();
        await page.getByRole("button", { name: /Mais opções|Pessoa Fictícia/ }).first().click();
        await page.getByRole("button", { name: helpButton }).first().click();
      });
      await tryModal(page, `modal-configuracoes-${tag}`, async () => {
        const direct = page.getByRole("button", { name: settingsButton }).first();
        if (await direct.isVisible().catch(() => false)) return direct.click();
        await page.getByRole("button", { name: /Mais opções|Pessoa Fictícia/ }).first().click();
        await page.getByRole("button", { name: settingsButton }).first().click();
      });
      await tryModal(page, `modal-concluir-${tag}`, () =>
        page.getByRole("button", { name: concludeButton }).first().click());
    }
    try {
      const tab = page.getByRole("button", { name: tabSheet }).first();
      await tab.click({ timeout: 4000 });
      await settle(page);
      await shot(page, `folha-${tag}`);
    } catch (error) {
      summary.push(`ausente folha-${tag} (${String(error.message).split("\n")[0].slice(0, 80)})`);
    }
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, "resumo.txt"), `${site} · ${baseURL}\n${summary.join("\n")}\n`);
console.log(summary.join("\n"));
