// Gera capturas e PDFs da folha com dados 100% fictícios para docs/validation/.
// Uso: npm run dev (porta 5000) e, em outro terminal:
//   node scripts/capture-validation.mjs . http://127.0.0.1:5000 docs/validation/pet-sd-AAAAMMDD
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const [root, baseURL, outDir] = process.argv.slice(2);
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");
fs.mkdirSync(outDir, { recursive: true });

const user = {
  id: "pessoa-ficticia",
  name: "Pessoa Fictícia de Exemplo",
  role: "Monitor(a)",
  gatNumber: "01",
  gatName: "Alerta de violências com IA",
  createdAt: "2026-10-01T00:00:00.000Z",
};
const modalities = ["Interação em tempo real (Síncrona)", "Assíncrona"];
const base = [
  ["2026-10-01", "Sala 10 (fictícia)", "Reunião semanal do GAT 01", "11:00", "13:00", 0, "Pautas fictícias:\nLeitura do cronograma;\nDivisão de tarefas da semana."],
  ["2026-10-01", "-", "Elaboração de ata", "13:00", "14:00", 1, "Registro das decisões da reunião (texto fictício)."],
  ["2026-10-07", "-", "Organização do repositório", "16:30", "18:00", 1, "Estrutura inicial de pastas e README (exemplo)."],
  ["2026-10-07", "Laboratório (fictício)", "Grupo de estudos", "18:00", "20:00", 0, "Tema fictício: introdução a redes neurais recorrentes."],
  ["2026-10-08", "Sala 10 (fictícia)", "Reunião semanal do GAT 01", "11:00", "13:00", 0, "Pautas fictícias: apresentação de estudo dirigido."],
  ["2026-10-09", "-", "Revisão de relatório", "10:00", "12:30", 1, "Revisão textual de um relatório fictício."],
  ["2026-10-11", "-", "Pesquisa bibliográfica e estudo autônomo", "14:00", "18:00", 1, "Leituras sobre proteção de dados na saúde digital (exemplo)."],
  ["2026-10-14", "Laboratório (fictício)", "Grupo de estudos", "18:00", "20:00", 0, "Tema fictício: mecanismos de atenção."],
  ["2026-10-15", "Unidade de saúde (fictícia)", "Visita técnica", "08:00", "12:00", 0, "Visita de exemplo para conhecer o fluxo de registro."],
];
const toActivity = ([date, local, description, start, end, m, descricao], i) => ({
  id: `ex-${i}`, date, local, description, start, end, modality: modalities[m], descricao,
  hours: 0,
});
const common = base.map(toActivity);
const long = Array.from({ length: 25 }, (_, i) => {
  const day = String(1 + (i % 28)).padStart(2, "0");
  const startH = 8 + (i % 10);
  return toActivity([
    `2026-10-${day}`, i % 3 ? "-" : "Sala (fictícia)", `Atividade fictícia ${i + 1}`,
    `${String(startH).padStart(2, "0")}:00`, `${String(startH + 1).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
    i % 2, i % 4 === 0 ? "Descrição fictícia mais longa para testar a quebra de linha da coluna Descrição e a altura variável das linhas da tabela." : "Descrição fictícia.",
  ], i);
});

async function open(browser, { width, height, theme, activities }) {
  const context = await browser.newContext({ viewport: { width, height }, locale: "pt-BR" });
  const page = await context.newPage();
  await page.addInitScript(([u, acts, t]) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.clear();
    localStorage.setItem("pet_folha_profiles_v3", JSON.stringify([u]));
    localStorage.setItem("pet_folha_active_profile_id_v3", u.id);
    localStorage.setItem(`pet_folha_activities_v3_${u.id}_2026-10`, JSON.stringify(acts));
    localStorage.setItem("pet_theme", t);
  }, [user, activities, theme]);
  await page.goto(baseURL + "/");
  await page.getByLabel("Mês da folha").selectOption("2026-10");
  return { context, page };
}

const browser = await chromium.launch();
const shots = [];
for (const [name, activities] of [["comum", common], ["25-linhas", long], ["vazia", []]]) {
  for (const theme of ["light", "dark"]) {
    for (const [device, width, height] of [["desktop", 1440, 1000], ["390px", 390, 844]]) {
      if (name !== "comum" && (theme === "dark" || device === "390px")) continue;
      const { context, page } = await open(browser, { width, height, theme, activities });
      await page.getByRole("button", { name: "Folha oficial" }).first().click();
      const file = path.join(outDir, `folha-${name}-${theme === "light" ? "claro" : "escuro"}-${device}.png`);
      await page.screenshot({ path: file, fullPage: true });
      shots.push(file);
      if (theme === "light" && device === "desktop") {
        await page.emulateMedia({ media: "print" });
        const pdf = path.join(outDir, `folha-${name}.pdf`);
        await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
        shots.push(pdf);
      }
      await context.close();
    }
  }
}
// Modelo em branco (aba "Modelo em branco").
{
  const { context, page } = await open(browser, { width: 1440, height: 1000, theme: "light", activities: common });
  await page.getByRole("button", { name: "Folha oficial" }).first().click();
  await page.getByRole("button", { name: "Modelo em branco" }).click();
  await page.screenshot({ path: path.join(outDir, "folha-modelo-em-branco-claro-desktop.png"), fullPage: true });
  await page.emulateMedia({ media: "print" });
  await page.pdf({ path: path.join(outDir, "folha-modelo-em-branco.pdf"), preferCSSPageSize: true, printBackground: true });
  await context.close();
}
// Painel de lançamentos (desktop e 390 px).
for (const [device, width, height] of [["desktop", 1440, 1000], ["390px", 390, 844]]) {
  const { context, page } = await open(browser, { width, height, theme: "light", activities: common });
  await page.screenshot({ path: path.join(outDir, `painel-claro-${device}.png`), fullPage: true });
  await context.close();
}
await browser.close();
console.log(shots.join("\n"));
