// Referência: visão Mensal/Semanal do app original (Felipe Vidal e Robert
// Taveira), em 1440 e 390 px, com perfil fictício e os exemplos do próprio
// app. Os dados ficam só no navegador descartável do Playwright.
//
// Uso: node scripts/capturar-vidal-semanal.mjs docs/validation/perfis-20261118/antes
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const [outDir] = process.argv.slice(2);
if (!outDir) {
  console.error("Uso: node scripts/capturar-vidal-semanal.mjs <pasta>");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
for (const [w, h] of [[1440, 1000], [390, 844]]) {
  const context = await browser.newContext({
    viewport: { width: w, height: h },
    locale: "pt-BR",
    isMobile: w < 600,
    hasTouch: w < 600,
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
  await page.goto("https://pet-folha-mensal.vercel.app", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Começar agora" }).first().click();
  await page.getByRole("button", { name: "Pular" }).click();
  await page.locator("#entry-name").fill("Pessoa Ficticia de Exemplo");
  await page.getByRole("button", { name: "Abrir minha folha" }).click();
  await page.getByText("Precisa de um exemplo?").click();
  await page.getByRole("button", { name: /Carregar exemplos/ }).click();
  await page.waitForTimeout(800);
  for (const view of ["Mensal", "Semanal"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outDir, `vidal-${view.toLowerCase()}-${w}.jpg`),
      type: "jpeg",
      quality: 70,
    });
  }
  await context.close();
}
await browser.close();
console.log("ok");
