// Gera tests/fixtures/dados-v3-main.json: o estado do navegador (localStorage
// e comprovantes do IndexedDB) criado pela interface da versão que estiver
// rodando, com dados 100% fictícios. Foi rodado contra a main de 18/11/2026
// (commit 269f816), antes das mudanças de perfis e visão semanal, para o
// teste de compatibilidade (tests/e2e/compat.spec.ts) provar que esses dados
// abrem iguais nas versões seguintes.
//
// Uso: npm run build && npm start   # em outro terminal (porta 5000)
//      node scripts/gerar-fixture-compat.mjs http://127.0.0.1:5000
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const [baseURL] = process.argv.slice(2);
if (!baseURL) {
  console.error("Uso: node scripts/gerar-fixture-compat.mjs <baseURL>");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAMklEQVR4nGP4T2PAQCcLFPoCqI5GLRi1YNSCUQtGLRi1YNSCUQtGLRi1gBwLaAdobgEAXUfXXDidab8AAAAASUVORK5CYII=",
  "base64",
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
await page.goto(`${baseURL}/`);

async function createProfile(name, role, gat) {
  const create = page.getByRole("button", { name: "Primeiro acesso", exact: true });
  if (await create.count()) await create.click();
  await page.getByLabel("Nome completo", { exact: true }).fill(name);
  await page.getByLabel("Perfil", { exact: true }).selectOption(role);
  await page.getByLabel("GAT", { exact: true }).selectOption(gat);
  await page.getByRole("button", { name: "Abrir minha folha", exact: true }).click();
  await page.getByRole("heading", { name: "Minha frequência", exact: true }).waitFor();
}
async function add(date, start, end, local, description, descricao, template) {
  if (template) await page.getByLabel(/Preenchimento rápido/).selectOption({ label: template });
  await page.getByLabel("Data", { exact: true }).fill(date);
  await page.getByLabel("Início", { exact: true }).fill(start);
  await page.getByLabel("Fim", { exact: true }).fill(end);
  await page.getByLabel("Unidade/Local", { exact: true }).fill(local);
  await page.getByLabel("Atividade desenvolvida", { exact: true }).fill(description);
  await page.getByLabel("Descrição", { exact: true }).fill(descricao);
  await page.getByRole("button", { name: "Adicionar atividade", exact: true }).click();
  await page.getByText(/Atividade adicionada/).first().waitFor();
}
async function leave() {
  await page.getByRole("button", { name: /^Concluir/ }).click();
  await page.getByRole("button", { name: "Sair / trocar participante", exact: true }).click();
  const anyway = page.getByRole("button", { name: "Sair sem salvar cópia", exact: true });
  if (await anyway.count()) await anyway.click();
  await page.getByRole("heading", { name: "Vamos começar" }).waitFor();
}

await createProfile("Participante Fictício Um", "Monitor(a)", "03");
await add("2026-11-03", "11:00", "13:00", "UFG", "Reunião Geral", "Pauta fictícia A.", "Reunião Geral");
await add("2026-11-05", "16:30", "18:00", "Online", "Pesquisa Bibliográfica e Estudos Autônomos", "Leitura fictícia.", "Pesquisa Bibliográfica e Estudos Autônomos");
await add("2026-11-30", "08:00", "12:15", "Unidade fictícia", "Visita Técnica", "Visita de exemplo.", "Visita Técnica");
await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
await page
  .getByRole("region", { name: "Comprovação fotográfica" })
  .getByLabel("Adicionar comprovantes")
  .setInputFiles({ name: "foto-ficticia.png", mimeType: "image/png", buffer: png });
await page.getByText("foto-ficticia.png").first().waitFor();
await page.getByRole("button", { name: "Minha frequência", exact: true }).click();
await page.getByLabel("Mês da folha").selectOption("2026-10");
await add("2026-10-07", "14:00", "15:30", "Sala fictícia", "Capacitação", "Capacitação de exemplo.", "Capacitação");
await leave();
await createProfile("Participante Fictícia Dois", "Preceptor(a)", "12");
await page.getByLabel("Mês da folha").selectOption("2026-11");
await add("2026-11-10", "09:00", "10:00", "Online", "Capacitação", "Outro perfil.", "");
await leave();

const state = await page.evaluate(async () => {
  const local = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    local[key] = localStorage.getItem(key);
  }
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("pet-folha-comprovantes", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const entries = await new Promise((resolve, reject) => {
    const out = [];
    const cursor = db.transaction("months").objectStore("months").openCursor();
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (!c) return resolve(out);
      out.push({ key: c.key, value: c.value });
      c.continue();
    };
    cursor.onerror = () => reject(cursor.error);
  });
  const toBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.readAsDataURL(blob);
    });
  const indexed = [];
  for (const { key, value } of entries) {
    indexed.push({
      key,
      attachments: await Promise.all(
        value.map(async (item) => ({
          id: item.id,
          name: item.name,
          pages: item.pages,
          type: item.file.type,
          base64: await toBase64(item.file),
        })),
      ),
    });
  }
  db.close();
  return { localStorage: local, indexedDB: indexed };
});
await browser.close();

const target = path.join(root, "tests/fixtures/dados-v3-main.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  JSON.stringify({ origem: "main 269f816 (18/11/2026), dados fictícios", ...state }, null, 2) + "\n",
);
console.log(`ok: ${Object.keys(state.localStorage).length} chaves, ${state.indexedDB.length} meses com comprovantes`);
