// Confere o contraste (WCAG 2.x) dos pares de cor usados na interface, nos
// temas claro e escuro. Lê os tokens direto de src/app/globals.css, para não
// existir uma segunda fonte da verdade. Falha (exit 1) se algum par ficar
// abaixo do mínimo: 4,5:1 para texto comum; 3:1 para texto grande, bordas de
// controle, anel de foco e elementos gráficos.
// Uso: npm run test:contrast
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs
  .readFileSync(path.join(root, "src/app/globals.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * Junta as declarações dos blocos de tema na ordem do arquivo. Só valem
 * seletores que são exatamente o tema (ex.: `:root, html[data-theme="light"]`
 * ou `html[data-theme="dark"]`), não regras de componentes dentro dele.
 */
function readTheme(theme) {
  const tokens = {};
  const target = `html[data-theme="${theme}"]`;
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const parts = selector.split(";").pop().split(",").map((s) => s.trim());
    const matches = parts.includes(target) && parts.every((s) => s === target || s === ":root");
    if (!matches) continue;
    for (const [, name, value] of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
      tokens[name] = value.trim();
    }
  }
  return tokens;
}

function hex(value) {
  const h = value.replace("#", "");
  const full = h.length <= 4 ? [...h].map((c) => c + c).join("") : h;
  const n = (i) => parseInt(full.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? n(6) / 255 : 1 };
}
/** Compõe uma cor (possivelmente translúcida) sobre um fundo opaco. */
function over(top, bottom) {
  const { a } = top;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}
/** Equivalente a color-mix(in srgb, cor p%, base). */
function mix(color, percent, base) {
  return over({ ...color, a: percent / 100 }, base);
}
function luminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const TEXT = 4.5;
const LARGE = 3;
const UI = 3;
// Trecho síncrono sobre o total na barra do mês: a cor não é o único meio (o
// valor está escrito ao lado e há um filete entre os trechos), então vale o
// mínimo para distinguir os dois laranjas, não o de 1.4.11.
const SEGMENT = 2;

// [descrição, cor do texto/elemento, fundo, mínimo]. Fundos podem ser
// funções que recebem o tema já resolvido (para misturas e transparências).
const pairs = [
  ["Texto principal sobre a página", "foreground", "background", TEXT],
  ["Texto principal sobre cartão", "foreground", "surface", TEXT],
  ["Texto principal sobre superfície elevada", "foreground", "surface-raised", TEXT],
  ["Texto de corpo sobre a página", "body", "background", TEXT],
  ["Texto de corpo sobre cartão", "body", "surface", TEXT],
  ["Texto suave sobre a página", "muted", "background", TEXT],
  ["Texto suave sobre cartão", "muted", "surface", TEXT],
  ["Texto suave sobre superfície elevada", "muted", "surface-raised", TEXT],
  ["Texto suave sobre hover", "muted", "surface-hover", TEXT],
  ["Link / texto da marca sobre a página", "brand-text", "background", TEXT],
  ["Link / texto da marca sobre cartão", "brand-text", "surface", TEXT],
  ["Texto da marca sobre fundo suave da marca", "brand-text", (t) => over(t["brand-soft"], t.surface), TEXT],
  ["Texto da marca sobre superfície elevada", "brand-text", "surface-raised", TEXT],
  ["Botão primário: texto sobre laranja", "on-brand", "brand", TEXT],
  ["Botão primário em hover/foco", "on-brand", "brand-strong", TEXT],
  ["Botão primário contra o cartão (forma)", "brand", "surface", UI],
  ["Anel de foco sobre a página", "focus-ring", "background", UI],
  ["Anel de foco sobre cartão", "focus-ring", "surface", UI],
  ["Borda de controle sobre cartão", "control-border", "surface", UI],
  ["Borda de controle sobre a página", "control-border", "background", UI],
  ["Barra de progresso (decorativa) sobre cartão", "brand-vivid", "surface", LARGE],
  ["Barra síncrona/In Loco sobre a barra total", "brand-deep", "brand-vivid", SEGMENT],
  ["Informação (azul) sobre cartão", "info", "surface", TEXT],
  ["Informação (azul) sobre a página", "info", "background", TEXT],
  ["Badge de informação", "info", (t) => mix(t.info, 10, t.surface), TEXT],
  ["Alerta sobre cartão", "warning", "surface", TEXT],
  ["Badge de alerta (status-badge)", "warning", (t) => mix(t.warning, 9, t.surface), TEXT],
  ["Badge de alerta (10 %)", "warning", (t) => mix(t.warning, 10, t.surface), TEXT],
  ["Perigo sobre cartão", "danger", "surface", TEXT],
  ["Perigo sobre a página", "danger", "background", TEXT],
  ["Badge de perigo (10 %)", "danger", (t) => mix(t.danger, 10, t.surface), TEXT],
  ["Botão destrutivo: texto", "on-danger", "danger-fill", TEXT],
  ["Botão destrutivo em hover", "on-danger", "danger-fill-strong", TEXT],
  ["Badge da marca (10 %)", "brand-text", (t) => mix(t["brand-text"], 10, t.surface), TEXT],
];

let failures = 0;
for (const theme of ["light", "dark"]) {
  const raw = readTheme(theme);
  const t = {};
  for (const [name, value] of Object.entries(raw)) {
    if (/^#[0-9a-f]{3,8}$/i.test(value)) t[name] = hex(value);
  }
  const page = t.background;
  console.log(`\nTema ${theme === "light" ? "claro" : "escuro"}`);
  for (const [label, fgName, bgSpec, min] of pairs) {
    const bg = typeof bgSpec === "function" ? bgSpec(t) : t[bgSpec];
    const fgRaw = t[fgName];
    if (!fgRaw || !bg) {
      console.log(`  FALTA  ${label}: token ausente (${fgName} / ${typeof bgSpec === "string" ? bgSpec : "mistura"})`);
      failures++;
      continue;
    }
    const opaqueBg = bg.a < 1 ? over(bg, page) : bg;
    const fg = fgRaw.a < 1 ? over(fgRaw, opaqueBg) : fgRaw;
    const value = ratio(fg, opaqueBg);
    const ok = value >= min;
    if (!ok) failures++;
    console.log(`  ${ok ? "ok    " : "FALHA "} ${value.toFixed(2).padStart(5)}:1 (mín. ${min}) ${label}`);
  }
}
if (failures) {
  console.error(`\n${failures} par(es) abaixo do mínimo.`);
  process.exit(1);
}
console.log("\nTodos os pares atendem ao contraste mínimo (WCAG AA).");
