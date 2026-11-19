// Auditoria de telas no celular (e no desktop), com dados 100% fictícios.
//
// Percorre a entrada, o painel, a folha oficial, os comprovantes e cada modal
// em vários viewports e nos temas claro e escuro; em cada tela faz checagens
// automáticas (rolagem horizontal, texto cortado, palavra partida, alvo de
// toque, fonte de campo < 16 px, modal fora da viewport, imagem quebrada,
// erro no console e axe) e grava uma captura.
//
// Uso:
//   npm run build && npm start          # em outro terminal (porta 5000)
//   node scripts/auditar-telas.mjs http://127.0.0.1:5000 docs/validation/mobile-20261118/antes
//   node scripts/auditar-telas.mjs <url> <pasta> --rapido   # só 360 e 1440, claro
//   node scripts/auditar-telas.mjs <url> <pasta> --so=390-zoom200   # refaz um viewport
//     e mescla com o achados.json que já está na pasta
//
// Saída: <pasta>/<viewport>-<tema>/<tela>.jpg, <pasta>/achados.json e
// <pasta>/resumo.md (achados únicos por checagem + seletor + viewport).
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const quick = args.includes("--rapido");
const only = args.find((arg) => arg.startsWith("--so="))?.slice(5).split(",");
const [baseURL, outDir] = args.filter((arg) => !arg.startsWith("--"));
if (!baseURL || !outDir) {
  console.error("Uso: node scripts/auditar-telas.mjs <baseURL> <pasta> [--rapido]");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// Dados fictícios: dois perfis e 10 atividades no mês.
const MONTH = "2026-11";
const IN_LOCO = "Interação em tempo real (In Loco)";
const SYNC = "Interação em tempo real (Síncrona)";
const ASYNC = "Assíncrona";
const users = [
  {
    id: "pessoa-ficticia",
    name: "Pessoa Fictícia de Exemplo Sobrenome Longo",
    role: "Monitor(a)",
    gatNumber: "01",
    gatName: "Alerta de violências com IA",
    createdAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "outra-pessoa",
    name: "Outra Pessoa Fictícia",
    role: "Orientador(a) de serviço",
    gatNumber: "12",
    gatName: "Saúde mental digital",
    createdAt: "2026-10-02T00:00:00.000Z",
  },
];
// [data, local, atividade, início, fim, modalidade, descrição]
const rows = [
  ["2026-11-03", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias: cronograma do semestre."],
  ["2026-11-04", "Online", "Pesquisa Bibliográfica e Estudos Autônomos", "16:30", "18:00", ASYNC, "Leituras de exemplo sobre saúde digital."],
  ["2026-11-05", "Online", "Capacitação", "14:00", "18:00", SYNC, "Capacitação fictícia."],
  ["2026-11-06", "Unidade de saúde (fictícia) com nome bem comprido", "Visita Técnica", "08:00", "12:00", IN_LOCO, "Visita de exemplo."],
  ["2026-11-10", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias."],
  ["2026-11-11", "Online", "Grupo de estudos", "18:00", "20:00", SYNC, "Discussão de texto fictício."],
  ["2026-11-12", "Laboratório", "Organização do repositório", "09:00", "10:30", ASYNC, "Arquivos de exemplo."],
  ["2026-11-17", "UFG", "Reunião Geral", "11:00", "13:00", IN_LOCO, "Pautas fictícias."],
  ["2026-11-18", "Online", "Pesquisa Bibliográfica e Estudos Autônomos", "09:00", "10:30", ASYNC, "Uma descrição longa de exemplo, com várias frases, para testar o recolhimento do texto na lista e a quebra de linha na folha oficial impressa. Nenhum dado real."],
  ["2026-11-30", "Online", "Capacitação", "14:00", "16:00", SYNC, "Capacitação fictícia de encerramento."],
];
const activities = rows.map(([date, local, description, start, end, modality, descricao], i) => ({
  id: `ex-${i}`, date, local, description, start, end, modality, descricao, hours: 0,
}));

// ---------------------------------------------------------------------------
const ALL_VIEWPORTS = quick
  ? [{ name: "360", width: 360, height: 780 }, { name: "1440", width: 1440, height: 900 }]
  : [
      { name: "320", width: 320, height: 640 },
      { name: "360", width: 360, height: 780 },
      { name: "390", width: 390, height: 844 },
      { name: "414", width: 414, height: 896 },
      { name: "768", width: 768, height: 1024 },
      { name: "740x360", width: 740, height: 360 },
      { name: "1440", width: 1440, height: 900 },
      // Zoom 200% em 390 px: o navegador passa a ter 195 px de CSS (decisão
      // registrada em docs/auditoria-mobile.md).
      { name: "390-zoom200", width: 195, height: 422, scale: 2, zoomOnly: true },
    ];
const VIEWPORTS = only ? ALL_VIEWPORTS.filter((vp) => only.includes(vp.name)) : ALL_VIEWPORTS;
const THEMES = quick ? ["light"] : ["light", "dark"];
const AXE_VIEWPORTS = new Set(["360", "1440"]);

const findings = [];
const log = [];

async function open(browser, vp, theme, active) {
  const mobile = vp.width < 800;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    locale: "pt-BR",
    colorScheme: theme,
    deviceScaleFactor: vp.scale ?? 1,
    hasTouch: mobile,
    isMobile: mobile && vp.width < 600,
  });
  const page = await context.newPage();
  page.__errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) page.__errors.push(msg.text().slice(0, 200));
  });
  page.on("pageerror", (error) => page.__errors.push(String(error.message).slice(0, 200)));
  page.on("response", (response) => {
    if (response.status() >= 400) page.__errors.push(`HTTP ${response.status()} ${response.url().replace(baseURL, "")}`);
  });
  await page.clock.install({ time: new Date("2026-11-18T15:00:00-03:00") });
  await page.addInitScript(
    ([list, acts, t, isActive, month]) => {
      if (sessionStorage.getItem("auditoria-seeded")) return;
      sessionStorage.setItem("auditoria-seeded", "1");
      localStorage.clear();
      localStorage.setItem("pet_theme", t);
      localStorage.setItem("pet_folha_profiles_v3", JSON.stringify(list));
      if (isActive) localStorage.setItem("pet_folha_active_profile_id_v3", list[0].id);
      localStorage.setItem(`pet_folha_activities_v3_${list[0].id}_${month}`, JSON.stringify(acts));
    },
    [users, activities, theme, active, MONTH],
  );
  return { context, page };
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(250);
}

// Checagens executadas no navegador. root = diálogo aberto ou o body.
function inspect() {
  const out = [];
  const dialogs = [...document.querySelectorAll("dialog[open]")];
  const scope = dialogs.at(-1) ?? document.body;
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const visible = (el) => {
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    return !el.closest(".sr-only, [aria-hidden='true'] .sr-only");
  };
  const isSrOnly = (el) => Boolean(el.closest(".sr-only"));
  const sel = (el) => {
    const parts = [];
    let node = el;
    for (let i = 0; node && node.nodeType === 1 && i < 4; i++) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`${part}#${node.id}`);
        break;
      }
      const cls = [...node.classList].filter((c) => !/[:[\]/]/.test(c)).slice(0, 2);
      if (cls.length) part += "." + cls.join(".");
      parts.unshift(part);
      node = node.parentElement;
    }
    return parts.join(" > ");
  };
  const text = (el) => (el.innerText || el.getAttribute("aria-label") || el.value || "").trim().replace(/\s+/g, " ").slice(0, 60);
  const add = (check, el, detail) => out.push({ check, selector: el ? sel(el) : "document", text: el ? text(el) : "", detail });

  // 1. Rolagem horizontal da página.
  const se = document.scrollingElement;
  if (se.scrollWidth > se.clientWidth + 1) {
    // Quem passa da borda direita?
    const culprits = [...document.body.querySelectorAll("*")]
      .filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1 && !el.closest("dialog:not([open])"))
      .filter((el) => ![...el.children].some((c) => c.getBoundingClientRect().right > vw + 1));
    add("rolagem-horizontal", culprits[0] ?? null, `scrollWidth ${se.scrollWidth} > ${se.clientWidth}; ${culprits.slice(0, 3).map(sel).join(" | ")}`);
  }

  const all = [...scope.querySelectorAll("*")].filter((el) => !el.closest("dialog:not([open])"));

  // 2. Texto cortado: overflow hidden/clip com conteúdo maior que a caixa.
  for (const el of all) {
    if (!visible(el) || isSrOnly(el) || el.closest(".skip-link")) continue;
    const style = getComputedStyle(el);
    const clipX = /hidden|clip/.test(style.overflowX);
    const clipY = /hidden|clip/.test(style.overflowY);
    if (!clipX && !clipY) continue;
    if (!el.innerText?.trim()) continue;
    if (el.closest(".official-sheet")) continue; // folha: avaliada à parte
    // Prévia escalada: a caixa recorta a folha de 1050 px de propósito.
    if (el.matches(".sheet-fit") && el.closest(".sheet-stage[data-scaled='true']")) continue;
    const overX = clipX && el.scrollWidth > el.clientWidth + 1;
    const overY = clipY && el.scrollHeight > el.clientHeight + 1;
    if (!overX && !overY) continue;
    // Reticências com o texto inteiro no title: corte intencional.
    const intentional = style.textOverflow === "ellipsis" && el.closest("[title]");
    if (style.webkitLineClamp && style.webkitLineClamp !== "none") continue; // "ver mais"
    add(intentional ? "reticencias-com-title" : "texto-cortado", el, `${overX ? `largura ${el.scrollWidth}>${el.clientWidth}` : ""} ${overY ? `altura ${el.scrollHeight}>${el.clientHeight}` : ""}`.trim());
  }

  // 3. Palavra partida no meio: uma palavra com mais de uma linha.
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const seen = new Set();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || !visible(parent) || isSrOnly(parent) || parent.closest("dialog:not([open]), script, style, pre, textarea, .official-sheet")) continue;
    for (const match of node.data.matchAll(/[^\s\u2013\u2014/·-]{4,}/g)) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      if (tops.size > 1) {
        const key = sel(parent) + match[0];
        if (seen.has(key)) continue;
        seen.add(key);
        add("palavra-partida", parent, `"${match[0]}" em ${tops.size} linhas`);
      }
    }
  }

  // 4. Alvos de toque < 44×44 (links dentro de texto corrido ficam de fora).
  const targets = all.filter((el) =>
    el.matches("button, a[href], select, summary, [role='menuitem'], [role='tab'], label.choice, input:not([type='radio']):not([type='checkbox']):not([type='hidden']):not([type='file'])"),
  );
  for (const el of targets) {
    if (!visible(el) || el.disabled) continue;
    if (el.matches("a") && el.closest("p, li:not([role]), small") && !el.matches(".secondary-button, .primary-button, [class*='button']")) continue;
    if (el.matches("select") && el.closest(".full-select")) continue; // mede a caixa visível
    const r = el.getBoundingClientRect();
    if (el.closest(".skip-link")) continue;
    if (r.width < 43.5 || r.height < 43.5) add("alvo-pequeno", el, `${Math.round(r.width)}×${Math.round(r.height)}`);
  }

  // 5. Campos com fonte < 16 px (o iOS aproxima ao focar).
  for (const el of all.filter((e) => e.matches("input:not([type='radio']):not([type='checkbox']):not([type='hidden']):not([type='file']), select, textarea"))) {
    const target = el.closest(".full-select") ?? el;
    if (!visible(target)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 16) add("fonte-campo-menor-16", el, `${size}px`);
  }

  // 6. Modal maior que a viewport sem rolagem ou com rodapé inacessível.
  for (const dialog of dialogs) {
    const panel = dialog.firstElementChild ?? dialog;
    const r = panel.getBoundingClientRect();
    const scrollers = [dialog, panel, ...panel.querySelectorAll("*")].filter((el) => {
      const s = getComputedStyle(el);
      return /auto|scroll/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
    });
    if ((r.bottom > vh + 1 || r.top < -1) && scrollers.length === 0)
      add("modal-sem-rolagem", panel, `painel ${Math.round(r.height)} px > viewport ${vh}`);
    if (r.right > vw + 1 || r.left < -1) add("modal-mais-largo", panel, `painel ${Math.round(r.width)} px, viewport ${vw}`);
    const buttons = [...panel.querySelectorAll("button")].filter(visible);
    const last = buttons.at(-1);
    if (last) {
      const lr = last.getBoundingClientRect();
      if (lr.bottom > vh + 1 && scrollers.length === 0) add("modal-rodape-inacessivel", last, `rodapé em ${Math.round(lr.bottom)} px`);
      else if (lr.bottom > vh + 1) add("modal-rodape-fora-da-tela", last, `rodapé só aparece rolando (${Math.round(lr.bottom)} px > ${vh})`);
    }
  }

  // 7. Imagens que não carregaram.
  for (const img of document.images) {
    if (img.closest(".print-only-wrapper")) continue;
    if (img.complete && img.naturalWidth === 0) add("imagem-quebrada", img, img.currentSrc || img.src);
    else if (visible(img) === false && img.closest(".official-sheet") && !img.closest(".print-only-wrapper")) add("imagem-invisivel", img, "altura 0 na prévia");
  }
  // Prévia da folha: faixa de logos com altura reservada?
  const header = document.querySelector(".sheet-stage .pet-sheet-header img");
  if (header) {
    const r = header.getBoundingClientRect();
    if (r.height < 8 || header.naturalWidth === 0) add("logos-folha", header, `logos ${Math.round(r.width)}×${Math.round(r.height)}, natural ${header.naturalWidth}`);
  }
  return out;
}

async function audit(page, screen, vp, theme, { axe = false } = {}) {
  const tag = `${vp.name}-${theme === "light" ? "claro" : "escuro"}`;
  const dir = path.join(outDir, tag);
  fs.mkdirSync(dir, { recursive: true });
  await settle(page);
  const found = await page.evaluate(inspect).catch((error) => [{ check: "erro-script", selector: "", text: "", detail: String(error.message).slice(0, 200) }]);
  for (const error of page.__errors.splice(0)) found.push({ check: "erro-console", selector: "console", text: "", detail: error });
  if (axe && AXE_VIEWPORTS.has(vp.name)) {
    try {
      const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
      const hasDialog = await page.locator("dialog[open]").count();
      if (hasDialog) builder.include("dialog[open]");
      const result = await builder.analyze();
      for (const violation of result.violations)
        for (const node of violation.nodes.slice(0, 5))
          found.push({ check: `axe:${violation.id}`, selector: node.target.join(" "), text: "", detail: `${violation.impact} · ${violation.help}` });
    } catch (error) {
      found.push({ check: "erro-axe", selector: "", text: "", detail: String(error.message).slice(0, 160) });
    }
  }
  const hasDialog = await page.locator("dialog[open]").count();
  await page
    .screenshot({ path: path.join(dir, `${screen}.jpg`), type: "jpeg", quality: 65, fullPage: !hasDialog })
    .catch((error) => log.push(`FALHOU captura ${tag}/${screen}: ${error.message.split("\n")[0]}`));
  for (const item of found) findings.push({ screen, viewport: vp.name, theme, ...item });
  log.push(`${found.length ? "achados" : "ok     "} ${String(found.length).padStart(3)}  ${tag}/${screen}`);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (error) {
    log.push(`FALHOU  ${name}: ${String(error.message).split("\n")[0]}`);
  }
}
async function closeDialog(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);
  if (await page.locator("dialog[open]").count()) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
}

const invalidBackup = { name: "copia-invalida.json", mimeType: "application/json", buffer: Buffer.from("{ isto não é json") };

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  for (const theme of vp.zoomOnly ? ["light"] : THEMES) {
    const axe = theme === "light" || vp.name === "360";
    // --- Entrada (sem perfil ativo) ---
    {
      const { context, page } = await open(browser, vp, theme, false);
      await page.goto(`${baseURL}/`);
      await audit(page, "entrada-continuar", vp, theme, { axe });
      await step("excluir perfil", async () => {
        await page.getByRole("button", { name: /^Excluir perfil de Pessoa/ }).click();
        await page.locator("dialog[open]").waitFor({ timeout: 4000 });
        await audit(page, "modal-excluir-perfil", vp, theme, { axe });
        await closeDialog(page);
      });
      await step("primeiro acesso", async () => {
        await page.getByRole("button", { name: "Primeiro acesso", exact: true }).click();
        await audit(page, "entrada-primeiro-acesso", vp, theme, { axe });
      });
      await step("restaurar", async () => {
        await page.getByRole("button", { name: "Restaurar cópia", exact: true }).click();
        await audit(page, "entrada-restaurar", vp, theme);
        await page.getByLabel("Cópia de segurança da folha").setInputFiles(invalidBackup);
        await page.getByText("Não foi possível restaurar").first().waitFor({ timeout: 6000 });
        await audit(page, "aviso-restauracao", vp, theme, { axe });
      });
      await context.close();
    }
    // --- Painel do perfil ativo ---
    const { context, page } = await open(browser, vp, theme, true);
    await page.goto(`${baseURL}/`);
    await page.getByRole("heading", { name: "Minha frequência" }).waitFor({ timeout: 10000 });
    await page.evaluate(() => localStorage.setItem("pet_folha_summary_view", "monthly"));
    await audit(page, "painel", vp, theme, { axe });
    await step("semanal", async () => {
      await page.getByRole("radio", { name: "Semanal", exact: true }).click({ force: true });
      await audit(page, "resumo-semanal", vp, theme);
      await page.getByRole("radio", { name: "Mensal", exact: true }).click({ force: true });
    });
    await step("menu", async () => {
      await page.getByRole("button", { name: /menu do participante/ }).click();
      await audit(page, "menu-participante", vp, theme);
      await page.keyboard.press("Escape");
    });
    await step("identificação", async () => {
      await page.getByRole("button", { name: /menu do participante/ }).click();
      await page.getByRole("menuitem", { name: "Editar identificação" }).click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "modal-identificacao", vp, theme, { axe });
      await closeDialog(page);
    });
    await step("editar atividade", async () => {
      await page.getByRole("button", { name: /^Editar atividade:/ }).first().click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "modal-editar-atividade", vp, theme, { axe });
      await closeDialog(page);
    });
    await step("excluir atividade", async () => {
      await page.getByRole("button", { name: /^Excluir atividade:/ }).first().click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "modal-confirmar-exclusao", vp, theme, { axe });
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    });
    await step("concluir", async () => {
      await page.getByRole("button", { name: /^Concluir/ }).click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "modal-concluir", vp, theme, { axe });
      await closeDialog(page);
    });
    await step("ajuda", async () => {
      await page.getByRole("button", { name: "Abrir ajuda" }).click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "modal-ajuda", vp, theme, { axe });
      await closeDialog(page);
    });
    await step("configurações", async () => {
      await page.getByRole("button", { name: "Abrir configurações locais" }).click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "modal-configuracoes", vp, theme, { axe });
      await closeDialog(page);
    });
    await step("aviso rascunho", async () => {
      await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("Rascunho fictício");
      await page.getByRole("button", { name: /menu do participante/ }).click();
      await page.getByRole("menuitem", { name: "Trocar participante" }).click();
      await page.locator("dialog[open]").waitFor({ timeout: 4000 });
      await audit(page, "aviso-rascunho", vp, theme, { axe });
      await page.getByRole("button", { name: "Continuar editando", exact: true }).click();
      await page.getByLabel("Atividade desenvolvida", { exact: true }).fill("");
    });
    await step("folha oficial", async () => {
      await page.getByRole("button", { name: "Folha oficial", exact: true }).click();
      const discard = page.getByRole("button", { name: "Descartar preenchimento", exact: true });
      if (await discard.isVisible({ timeout: 1500 }).catch(() => false)) await discard.click();
      await page.locator(".sheet-stage").waitFor({ timeout: 4000 });
      // Rascunho limpo pode ainda pedir confirmação.
      await audit(page, "folha-minha", vp, theme, { axe });
      await page.getByRole("button", { name: "Modelo em branco", exact: true }).click();
      await audit(page, "folha-modelo-em-branco", vp, theme);
      await page.getByRole("button", { name: "Minha folha", exact: true }).click();
    });
    await context.close();
  }
}
await browser.close();

// ---------------------------------------------------------------------------
if (only) {
  // Mescla: mantém os achados dos outros viewports da rodada anterior.
  const previous = path.join(outDir, "achados.json");
  if (fs.existsSync(previous))
    findings.unshift(...JSON.parse(fs.readFileSync(previous, "utf8")).filter((item) => !only.includes(item.viewport)));
  log.unshift(`(refeito só: ${only.join(", ")}; os demais viewports vêm da rodada anterior)`);
}
fs.writeFileSync(path.join(outDir, "achados.json"), JSON.stringify(findings, null, 1));
const unique = new Map();
for (const item of findings) {
  const key = [item.check, item.selector, item.viewport].join("|");
  const entry = unique.get(key) ?? { ...item, screens: new Set(), themes: new Set() };
  entry.screens.add(item.screen);
  entry.themes.add(item.theme === "light" ? "claro" : "escuro");
  unique.set(key, entry);
}
const byCheck = {};
for (const item of findings) byCheck[item.check] = (byCheck[item.check] ?? 0) + 1;
const lines = [
  `# Auditoria de telas · ${new Date().toISOString().slice(0, 10)}`,
  "",
  `${findings.length} ocorrências, ${unique.size} únicas (checagem + seletor + viewport).`,
  "",
  "| checagem | ocorrências |",
  "| --- | --- |",
  ...Object.entries(byCheck).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  "",
  "| checagem | viewport | temas | telas | seletor | texto | detalhe |",
  "| --- | --- | --- | --- | --- | --- | --- |",
  ...[...unique.values()]
    .sort((a, b) => a.check.localeCompare(b.check) || a.selector.localeCompare(b.selector))
    .map((e) => `| ${e.check} | ${e.viewport} | ${[...e.themes].join(", ")} | ${[...e.screens].join(", ")} | \`${e.selector.replaceAll("|", "\\|")}\` | ${e.text.replaceAll("|", "/")} | ${String(e.detail).replaceAll("|", "/")} |`),
  "",
  "## Execução",
  "",
  ...log.map((line) => `    ${line}`),
];
fs.writeFileSync(path.join(outDir, "resumo.md"), lines.join("\n") + "\n");
console.log(log.filter((l) => l.startsWith("FALHOU")).join("\n"));
console.log(`${findings.length} ocorrências, ${unique.size} únicas. Resumo em ${path.join(outDir, "resumo.md")}`);
