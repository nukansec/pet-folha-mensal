// Capturas dos ajustes de 18/11/2026 (A1–A10), em 1440 e 390 px, temas claro
// e escuro, com dados 100% fictícios. Complementa scripts/capturar-telas.mjs:
// aqui entram só as telas alteradas (entrada, cartões .pdf/.json, formulário,
// modal de rascunho e o painel usado no README).
//
// Uso:
//   npm run build && npm start   # em outro terminal (porta 5000)
//   node scripts/capturar-ajustes.mjs http://127.0.0.1:5000 docs/validation/design-20261118/ajustes
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const [baseURL, outDir] = process.argv.slice(2);
if (!baseURL || !outDir) {
  console.error("Uso: node scripts/capturar-ajustes.mjs <baseURL> <pasta>");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");
fs.mkdirSync(outDir, { recursive: true });

const MONTH = "2026-10";
const IN_LOCO = "Interação em tempo real (In Loco)";
const SYNC = "Interação em tempo real (Síncrona)";
const ASYNC = "Assíncrona";
const user = {
  id: "pessoa-ficticia",
  name: "Pessoa Fictícia de Exemplo",
  role: "Monitor(a)",
  gatNumber: "01",
  gatName: "Alerta de violências com IA",
  createdAt: "2026-10-01T00:00:00.000Z",
};
// [data, local, atividade, início, fim, modalidade, descrição]
const rows = [
  ["2026-10-01", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias: cronograma do semestre e divisão de tarefas."],
  ["2026-10-06", "Online", "Pesquisa Bibliográfica e Estudos Autônomos", "16:30", "18:00", ASYNC, "Leituras sobre proteção de dados na saúde digital (exemplo)."],
  ["2026-10-08", "Online", "Capacitação", "14:00", "16:00", SYNC, "Capacitação fictícia sobre registro da informação em saúde."],
  ["2026-10-15", "Unidade de saúde (fictícia)", "Visita Técnica", "08:00", "12:00", IN_LOCO, "Visita de exemplo para conhecer o fluxo de registro."],
  ["2026-10-22", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias: apresentação de estudo dirigido."],
];
const activities = rows.map(([date, local, description, start, end, modality, descricao], i) => ({
  id: `ex-${i}`, date, local, description, start, end, modality, descricao, hours: 0,
}));

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
    ([u, acts, t, seed, month]) => {
      if (sessionStorage.getItem("captura-seeded")) return;
      sessionStorage.setItem("captura-seeded", "1");
      localStorage.clear();
      localStorage.setItem("pet_theme", t);
      if (!seed) return;
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([u]));
      localStorage.setItem("pet_folha_active_profile_id_v3", u.id);
      localStorage.setItem(`pet_folha_activities_v3_${u.id}_${month}`, JSON.stringify(acts));
    },
    [user, activities, theme, seeded, MONTH],
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
  await target.screenshot({ path: path.join(outDir, `${name}.jpg`), type: "jpeg", quality: 70, ...options });
  summary.push(`ok      ${name}`);
}

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  for (const [w, h] of [[1440, 1000], [390, 844]]) {
    const tag = `${theme === "light" ? "claro" : "escuro"}-${w}`;
    // Entrada: cabeçalho sem o "?" (A1), cartão de exemplo (A7) e cartões .pdf/.json (A6).
    {
      const { context, page } = await open(browser, { width: w, height: h, theme, seeded: false });
      await page.goto(`${baseURL}/`);
      await settle(page);
      await shot(page, `entrada-topo-${tag}`);
      await shot(page.locator("#o-que-guardar"), `cartoes-pdf-json-${tag}`);
      await context.close();
    }
    // Painel com dados fictícios (README), formulário e modal de rascunho.
    const { context, page } = await open(browser, { width: w, height: h, theme, seeded: true });
    await page.goto(`${baseURL}/`);
    await settle(page);
    await page.getByLabel("Mês da folha").selectOption(MONTH);
    await settle(page);
    await shot(page, `painel-${tag}`);
    const form = page.locator("#nova-atividade");
    // CH sem horários = "—" neutro (A4).
    await shot(form, `formulario-vazio-${tag}`);
    // Modelo novo sem local: o campo fica vazio (A3).
    await page.getByRole("radio", { name: "Reunião Geral", exact: true }).check();
    await page.getByRole("radio", { name: "Visita Técnica", exact: true }).check();
    await page.getByLabel("Início", { exact: true }).fill("08:00");
    await page.getByLabel("Fim", { exact: true }).fill("12:00");
    await shot(form, `formulario-visita-tecnica-${tag}`);
    // Rascunho + troca de aba: modal "Atividade ainda não adicionada" (A5).
    await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
    await page.getByRole("dialog").first().waitFor({ timeout: 4000 });
    await settle(page);
    await shot(page, `modal-rascunho-${tag}`);
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(outDir, "resumo.txt"), `ajustes · ${baseURL}\n${summary.join("\n")}\n`);
console.log(summary.join("\n"));
