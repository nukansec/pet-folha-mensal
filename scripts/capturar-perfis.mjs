// Capturas da entrega "perfis e visão semanal" (18/11/2026), em 1440 e 390 px,
// temas claro e escuro, com dados 100% fictícios.
//
// Uso:
//   npm run build && npm start   # em outro terminal (porta 5000)
//   node scripts/capturar-perfis.mjs http://127.0.0.1:5000 docs/validation/perfis-20261118/antes antes
//   node scripts/capturar-perfis.mjs http://127.0.0.1:5000 docs/validation/perfis-20261118/depois depois
//
// "antes" captura as telas como estavam (select de perfis, cartão do perfil,
// ProfileModal, formulário e resumo mensal). "depois" captura as mesmas telas
// e as novas (menu do participante, cartões de perfil, exclusão, seletores em
// grupo e visão semanal).
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const [baseURL, outDir, mode = "depois"] = process.argv.slice(2);
if (!baseURL || !outDir) {
  console.error("Uso: node scripts/capturar-perfis.mjs <baseURL> <pasta> [antes|depois]");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");
fs.mkdirSync(outDir, { recursive: true });

const MONTH = "2026-11";
const IN_LOCO = "Interação em tempo real (In Loco)";
const SYNC = "Interação em tempo real (Síncrona)";
const ASYNC = "Assíncrona";
const users = [
  {
    id: "pessoa-ficticia",
    name: "Pessoa Fictícia de Exemplo",
    role: "Monitor(a)",
    gatNumber: "01",
    gatName: "Alerta de violências com IA",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "outra-pessoa",
    name: "Outra Pessoa Fictícia",
    role: "Preceptor(a)",
    gatNumber: "12",
    gatName: "Saúde mental digital",
    createdAt: "2026-10-02T00:00:00.000Z",
  },
];
// [data, local, atividade, início, fim, modalidade, descrição]
const rows = [
  ["2026-11-03", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias: cronograma do semestre."],
  ["2026-11-05", "Online", "Pesquisa Bibliográfica e Estudos Autônomos", "16:30", "18:00", ASYNC, "Leituras de exemplo."],
  ["2026-11-10", "Online", "Capacitação", "14:00", "18:00", SYNC, "Capacitação fictícia."],
  ["2026-11-12", "Unidade de saúde (fictícia)", "Visita Técnica", "08:00", "12:00", IN_LOCO, "Visita de exemplo."],
  ["2026-11-17", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias."],
  ["2026-11-30", "Online", "Pesquisa Bibliográfica e Estudos Autônomos", "09:00", "10:30", ASYNC, "Leituras de exemplo."],
];
const activities = rows.map(([date, local, description, start, end, modality, descricao], i) => ({
  id: `ex-${i}`, date, local, description, start, end, modality, descricao, hours: 0,
}));

async function open(browser, { width, height, theme, active }) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "pt-BR",
    colorScheme: theme,
    deviceScaleFactor: 1,
    hasTouch: width < 600,
    isMobile: width < 600,
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
  await page.addInitScript(
    ([list, acts, t, isActive, month]) => {
      if (sessionStorage.getItem("captura-seeded")) return;
      sessionStorage.setItem("captura-seeded", "1");
      localStorage.clear();
      localStorage.setItem("pet_theme", t);
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify(list));
      if (isActive) localStorage.setItem("pet_folha_active_profile_id_v3", list[0].id);
      localStorage.setItem(`pet_folha_activities_v3_${list[0].id}_${month}`, JSON.stringify(acts));
      localStorage.setItem(`pet_folha_activities_v3_${list[0].id}_2026-10`, JSON.stringify(acts.slice(0, 2).map((a) => ({ ...a, date: a.date.replace("2026-11", "2026-10") }))));
    },
    [users, activities, theme, active, MONTH],
  );
  return { context, page };
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(300);
}

const summary = [];
async function shot(target, name, options = {}) {
  try {
    await target.screenshot({ path: path.join(outDir, `${name}.jpg`), type: "jpeg", quality: 70, ...options });
    summary.push(`ok      ${name}`);
  } catch (error) {
    summary.push(`FALHOU  ${name}: ${String(error.message).split("\n")[0]}`);
  }
}
async function step(name, fn) {
  try {
    await fn();
  } catch (error) {
    summary.push(`FALHOU  ${name}: ${String(error.message).split("\n")[0]}`);
  }
}

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const [w, h] of [[1440, 1000], [390, 844]]) {
    const tag = `${theme === "light" ? "claro" : "escuro"}-${w}`;
    // Entrada, aba "Continuar" com dois perfis.
    {
      const { context, page } = await open(browser, { width: w, height: h, theme, active: false });
      await page.goto(`${baseURL}/`);
      await settle(page);
      await shot(page.locator("#acesso"), `entrada-continuar-${tag}`);
      if (mode === "depois") {
        await step("excluir", async () => {
          await page.getByRole("button", { name: /^Excluir perfil de Pessoa Fictícia/ }).click();
          await page.getByRole("dialog").first().waitFor({ timeout: 4000 });
          await settle(page);
          await shot(page, `modal-excluir-perfil-${tag}`);
          await page.getByRole("button", { name: "Cancelar", exact: true }).click();
        });
      }
      await step("primeiro acesso", async () => {
        await page.getByRole("button", { name: "Primeiro acesso", exact: true }).click();
        await settle(page);
        await shot(page.locator("#acesso"), `entrada-primeiro-acesso-${tag}`);
      });
      await context.close();
    }
    // Painel do perfil ativo.
    const { context, page } = await open(browser, { width: w, height: h, theme, active: true });
    await page.goto(`${baseURL}/`);
    await settle(page);
    await shot(page, `painel-${tag}`);
    await shot(page.locator(".frequency-summary"), `resumo-mensal-${tag}`);
    if (mode === "depois") {
      await step("semanal", async () => {
        await page.getByRole("radio", { name: "Semanal", exact: true }).click();
        await settle(page);
        await shot(page.locator(".frequency-summary"), `resumo-semanal-${tag}`);
        await page.getByRole("radio", { name: "Mensal", exact: true }).click();
      });
    }
    await shot(page.locator("#nova-atividade"), `formulario-${tag}`);
    if (mode === "depois") {
      await step("menu", async () => {
        await page.getByRole("button", { name: /Menu do participante/ }).click();
        await settle(page);
        await shot(page, `menu-participante-${tag}`);
        await page.keyboard.press("Escape");
      });
    }
    await step("perfil", async () => {
      if (mode === "depois") {
        await page.getByRole("button", { name: /Menu do participante/ }).click();
        await page.getByRole("menuitem", { name: "Editar identificação" }).click();
      } else {
        await page.locator(".profile-button").click();
      }
      await page.getByRole("dialog").first().waitFor({ timeout: 4000 });
      await settle(page);
      await shot(page, `modal-identificacao-${tag}`);
    });
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, "resumo.txt"), `${mode} · ${baseURL}\n${summary.join("\n")}\n`);
console.log(summary.join("\n"));
