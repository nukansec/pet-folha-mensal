import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import Module, { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { afterEach } from "node:test";
afterEach(() => {
  delete globalThis.window;
});

// Compile the real TS/TSX modules in memory. No browser, network, or user records.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = createRequire(path.join(root, "package.json"));
const ts = load("typescript");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(
    this,
    name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : name,
    ...args,
  );
};
for (const ext of [".ts", ".tsx"]) {
  Module._extensions[ext] = (module, filename) => {
    const source = readFileSync(filename, "utf8");
    const result = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2020,
      },
    });
    module._compile(result.outputText, filename);
  };
}
const React = load("react");
const { renderToStaticMarkup } = load("react-dom/server");
const {
  calcPetHours,
  calcPetMinutes,
  sumActivityMinutes,
  formatDuration,
  formatTotalHours,
  getCurrentMonth,
  getDefaultActivityDate,
  PROJECT_MONTHS,
} = load("./src/lib/pet-calculator.ts");
const storage = load("./src/lib/storage.ts");
const calcModule = load("./src/lib/pet-calculator.ts");
const { DEFAULT_GATS, DEFAULT_ROLES } = load("./src/types/index.ts");
const { LandingPage, weekdayShort } = load("./src/components/LandingPage.tsx");
const { FAQ, HelpModal } = load("./src/components/Help.tsx");
const { DialogProvider } = load("./src/context/DialogContext.tsx");
const { Navbar } = load("./src/components/Navbar.tsx");
const { ActivityForm } = load("./src/components/ActivityForm.tsx");
const { ActivityTable } = load("./src/components/ActivityTable.tsx");
const { EditActivityModal } = load("./src/components/EditActivityModal.tsx");
const { ProfileModal } = load("./src/components/ProfileModal.tsx");
const { ExitModal } = load("./src/components/ExitModal.tsx");
const { OfficialSheet } = load("./src/components/OfficialSheet.tsx");
const noop = () => {};
const render = (element) =>
  renderToStaticMarkup(React.createElement(DialogProvider, null, element));
const sampleUser = {
  id: "test-ui",
  name: "Participante de teste",
  role: "Monitor(a)",
  gatNumber: "01",
  gatName: "GAT de teste",
  createdAt: "2026-10-01T00:00:00.000Z",
};
const sampleActivity = {
  id: "test-activity",
  date: "2026-10-06",
  start: "14:00",
  end: "15:30",
  modality: "Interação em tempo real (Síncrona)",
  description: "Atividade de teste",
  local: "Sala fictícia",
  descricao: "Pauta fictícia de teste",
  hours: 1.5,
};
function isolatedStorage() {
  const records = new Map();
  globalThis.window = {};
  globalThis.localStorage = {
    get length() { return records.size; },
    key: (index) => [...records.keys()][index] ?? null,
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, String(value)),
    removeItem: (key) => records.delete(key),
    clear: () => records.clear(),
  };
  return records;
}

test("CH do PET-SD é a duração exata em minutos, sem arredondar", () => {
  assert.equal(calcPetMinutes("16:30", "18:00"), 90);
  assert.equal(formatDuration(calcPetMinutes("16:30", "18:00")), "1h30");
  assert.equal(calcPetMinutes("11:00", "13:00"), 120);
  assert.equal(formatDuration(calcPetMinutes("11:00", "13:00")), "2h");
  assert.equal(calcPetMinutes("18:00", "19:00"), 60);
  assert.equal(formatDuration(calcPetMinutes("18:00", "19:00")), "1h");
  assert.equal(calcPetHours("16:30", "18:00"), 1.5);
  // Regra antiga (CEILING - FLOOR) daria 2h e 5h: aqui vale a duração real.
  assert.equal(calcPetMinutes("14:00", "15:30"), 90);
  assert.equal(calcPetMinutes("13:30", "17:30"), 240);
  assert.equal(formatDuration(5), "0h05");
});

test("fim igual ao início, virada acima de 12 h e horários inválidos valem zero", () => {
  assert.equal(calcPetMinutes("14:00", "14:00"), 0);
  // 15:00–14:00 seria 23 h passando da meia-noite: erro de digitação, vale 0.
  assert.equal(calcPetMinutes("15:00", "14:00"), 0);
  assert.equal(calcPetMinutes("", ""), 0);
  assert.equal(calcPetMinutes("25:00", "26:00"), 0);
  assert.equal(calcPetMinutes("aa:bb", "10:00"), 0);
  assert.equal(calcPetHours("18:00", "17:00"), 0);
  assert.equal(calcPetMinutes("9:00", "10:00"), 0);
});

test("atividade que passa da meia-noite conta inteira no dia em que começou", () => {
  const { crossesMidnight, MAX_OVERNIGHT_MINUTES } = calcModule;
  assert.equal(calcPetMinutes("23:00", "03:00"), 240);
  assert.equal(formatDuration(calcPetMinutes("23:00", "03:00")), "4h");
  assert.equal(calcPetMinutes("22:30", "00:00"), 90);
  assert.equal(calcPetMinutes("23:59", "00:01"), 2);
  // Limite de 12 h: plantão 19h–7h vale; 19h–7h01 não.
  assert.equal(MAX_OVERNIGHT_MINUTES, 720);
  assert.equal(calcPetMinutes("19:00", "07:00"), 720);
  assert.equal(calcPetMinutes("19:00", "07:01"), 0);
  assert.equal(crossesMidnight("23:00", "03:00"), true);
  assert.equal(crossesMidnight("08:00", "09:00"), false);
  assert.equal(crossesMidnight("08:00", "08:00"), false);
  // Soma do mês e faixa da semana: conta no dia de início (domingo 01/11).
  const night = { date: "2026-11-01", start: "23:00", end: "03:00" };
  assert.equal(sumActivityMinutes([night, { start: "08:00", end: "09:30" }]), 330);
  const bands = weeks.getMonthWeekBands("2026-11", [night]);
  assert.equal(bands[0].label, "Dia 1");
  assert.equal(bands[0].minutes, 240);
  assert.equal(bands[1].minutes, 0);
  // Cópia de segurança com atividade noturna é aceita.
  isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const backup = { version: "1.3", user: sampleUser, monthKey: "2026-11", activities: [{ ...sampleActivity, date: "2026-11-01", start: "23:00", end: "03:00" }] };
  assert.equal(storage.inspectUserData(JSON.stringify(backup)).success, true);
});
test("soma do mês em minutos e total no formato da ficha", () => {
  const month = [
    { start: "16:30", end: "18:00" },
    { start: "11:00", end: "13:00" },
    { start: "18:00", end: "19:00" },
    { start: "10:00", end: "12:30" },
    { start: "09:00", end: "09:00" },
  ];
  assert.equal(sumActivityMinutes(month), 90 + 120 + 60 + 150);
  assert.equal(formatTotalHours(sumActivityMinutes(month)), "7 horas");
  assert.equal(formatTotalHours(60), "1 hora");
  assert.equal(formatTotalHours(0), "0 horas");
  assert.equal(formatTotalHours(33 * 60 + 30), "33h30");
  // Três atividades de 20 min não acumulam erro de ponto flutuante.
  const thirds = Array.from({ length: 3 }, () => ({ start: "10:00", end: "10:20" }));
  assert.equal(sumActivityMinutes(thirds), 60);
});

test("perfil novo, inclusão, edição, exclusão e isolamento por mês e participante", () => {
  isolatedStorage();
  const result = storage.registerProfile({
    name: sampleUser.name,
    role: sampleUser.role,
    gatNumber: "04",
  });
  assert.equal(result.success, true);
  const user = result.user;
  assert.deepEqual(storage.getActivitiesForMonth(user.id, "2026-10"), []);
  storage.saveActivitiesForMonth(user.id, "2026-10", [sampleActivity]);
  assert.equal(storage.getActivitiesForMonth(user.id, "2026-10")[0].hours, 1.5);
  storage.saveActivitiesForMonth(user.id, "2026-10", [
    { ...sampleActivity, end: "17:30", hours: calcPetHours("14:00", "17:30") },
  ]);
  assert.equal(storage.getActivitiesForMonth(user.id, "2026-10")[0].hours, 3.5);
  assert.deepEqual(storage.getActivitiesForMonth(user.id, "2026-11"), []);
  assert.deepEqual(
    storage.getActivitiesForMonth("outro-perfil", "2026-10"),
    [],
  );
  storage.clearActivitiesForMonth(user.id, "2026-10");
  assert.deepEqual(storage.getActivitiesForMonth(user.id, "2026-10"), []);
});

test("cópia de segurança mantém o formato e restaura o perfil e suas atividades", () => {
  isolatedStorage();
  storage.saveProfiles([sampleUser]);
  storage.saveActivitiesForMonth(sampleUser.id, "2026-10", [sampleActivity]);
  const backup = storage.exportUserData(sampleUser, "2026-10");
  assert.equal(JSON.parse(backup).version, "1.3");
  assert.equal(JSON.parse(backup).activities[0].local, "Sala fictícia");
  localStorage.clear();
  const result = storage.importUserData(backup);
  assert.equal(result.success, true);
  assert.equal(result.monthKey, "2026-10");
  assert.deepEqual(storage.getActivitiesForMonth(sampleUser.id, "2026-10"), [
    sampleActivity,
  ]);
  assert.equal(storage.getActiveProfile().name, sampleUser.name);
  storage.setActiveProfileId(null);
  assert.equal(storage.getActiveProfile(), null);
});

test("arquivos inválidos não alteram os registros existentes", () => {
  const records = isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const before = JSON.stringify([...records]);
  for (const invalid of ["não é json", "{}", '{"user":{"name":"Teste"}}'])
    assert.equal(storage.importUserData(invalid).success, false);
  assert.equal(JSON.stringify([...records]), before);
});

test("cadastro repetido oferece o perfil local e preserva o mês anterior sem JSON", () => {
  isolatedStorage();
  storage.saveProfiles([sampleUser]);
  storage.saveActivitiesForMonth(sampleUser.id, "2026-10", [sampleActivity]);
  storage.setActiveProfileId(null);
  const result = storage.registerProfile({
    name: "  PARTICIPANTE DE TESTE ",
    role: "Tutor(a)",
    gatNumber: "02",
  });
  assert.equal(result.success, false);
  assert.equal(result.existingUser?.id, sampleUser.id);
  assert.equal(storage.getStoredProfiles().length, 1);
  storage.setActiveProfileId(result.existingUser.id);
  assert.equal(storage.getActiveProfile().id, sampleUser.id);
  assert.equal(
    storage.getActivitiesForMonth(sampleUser.id, "2026-10").length,
    1,
  );
  assert.deepEqual(storage.getActivitiesForMonth(sampleUser.id, "2026-11"), []);
});

test("navegador novo e lista vazia não recebem participantes de exemplo", () => {
  isolatedStorage();
  assert.deepEqual(storage.getStoredProfiles(), []);
  storage.saveProfiles([]);
  assert.deepEqual(storage.getStoredProfiles(), []);
});

test("migração v2 para v3 copia perfis e atividades, completa campos e preserva o v2", () => {
  const records = isolatedStorage();
  // Perfis e atividades sintéticos no formato antigo (_v2).
  const legacyUser = { id: "pessoa-a", name: "Pessoa Sintética A", role: "Estudante", gatNumber: "04", gatName: "Antigo", createdAt: "2026-09-01T00:00:00.000Z" };
  const tutor = { id: "pessoa-b", name: "Pessoa Sintética B", role: "Tutor", gatNumber: "02", createdAt: "2026-09-01T00:00:00.000Z", pin: "1234" };
  // Exemplo distribuído pela versão original, sem uso: não é copiado.
  const example = { id: "mariana-rios", name: "Mariana Dias Rios", role: "Estudante", gatNumber: "01", gatName: "Araticum", createdAt: "2026-09-01T00:00:00.000Z" };
  const oldActivities = [
    { id: "a1", date: "2026-10-06", start: "14:00", end: "15:30", modality: "Síncrona virtual", description: "Reunião (Síncrona virtual)", hours: 2 },
    { id: "a2", date: "2026-10-07", start: "13:30", end: "17:30", modality: "Assíncrona virtual", description: "Estudo", hours: 5 },
  ];
  records.set("pet_folha_profiles_v2", JSON.stringify([legacyUser, tutor, example]));
  records.set("pet_folha_active_profile_id_v2", "pessoa-a");
  records.set("pet_folha_activities_v2_pessoa-a_2026-10", JSON.stringify(oldActivities));
  records.set("pet_folha_config_gats_v2", JSON.stringify({ "04": { number: "04", name: "Antigo" } }));
  const v2Snapshot = [...records].filter(([key]) => key.includes("_v2") && !key.includes("migrated")).map(([key, value]) => key + value).join();

  const profiles = storage.getStoredProfiles();
  assert.deepEqual(profiles.map((p) => [p.id, p.role]), [["pessoa-a", "Monitor(a)"], ["pessoa-b", "Tutor(a)"]]);
  assert.equal("pin" in profiles[1], false);
  assert.equal(storage.getActiveProfile().id, "pessoa-a");
  const migrated = storage.getActivitiesForMonth("pessoa-a", "2026-10");
  assert.deepEqual(migrated.map((a) => [a.modality, a.local, a.descricao, a.hours, a.description]), [
    ["Interação em tempo real (Síncrona)", "", "", 1.5, "Reunião"],
    ["Assíncrona", "", "", 4, "Estudo"],
  ]);
  // GATs do programa anterior não passam para o v3.
  assert.equal(storage.getStoredGats()["04"].name, "Cuidado à pessoa com câncer");
  // As chaves v2 continuam intactas e a migração não roda de novo.
  assert.equal([...records].filter(([key]) => key.includes("_v2") && !key.includes("migrated")).map(([key, value]) => key + value).join(), v2Snapshot);
  storage.saveActivitiesForMonth("pessoa-a", "2026-10", []);
  assert.equal(storage.migrateFromV2(), false);
  assert.deepEqual(storage.getActivitiesForMonth("pessoa-a", "2026-10"), []);
});

test("perfis v3 malformados não impedem a migração e o GAT antigo ganha o nome do PET-SD", () => {
  const records = isolatedStorage();
  records.set("pet_folha_profiles_v3", JSON.stringify([{}, null]));
  records.set("pet_folha_profiles_v2", JSON.stringify([{ id: "p", name: "Pessoa Sintética", role: "Estudante", gatNumber: "01", gatName: "Antigo", createdAt: "2026-09-01T00:00:00.000Z" }]));
  records.set("pet_folha_activities_v2_p_2026-10", JSON.stringify([{ id: "a", date: "2026-10-01", start: "10:00", end: "11:00", modality: "Assíncrona virtual", description: "Estudo" }]));
  assert.deepEqual(storage.getStoredProfiles().map((p) => [p.id, p.gatName]), [["p", "Alerta de violências com IA"]]);
  assert.equal(storage.getActivitiesForMonth("p", "2026-10").length, 1);
});

test("exemplo antigo com atividades ou ativo é migrado; navegador sem v2 não ganha marcador", () => {
  const records = isolatedStorage();
  storage.getStoredProfiles();
  assert.equal(records.has("pet_folha_migrated_from_v2"), false);
  const example = { id: "mariana-rios", name: "Mariana Dias Rios", role: "Estudante", gatNumber: "01", gatName: "Araticum", createdAt: "2026-09-01T00:00:00.000Z" };
  records.set("pet_folha_profiles_v2", JSON.stringify([example]));
  records.set("pet_folha_activities_v2_mariana-rios_2026-10", "[]");
  assert.deepEqual(storage.getStoredProfiles().map((p) => p.id), ["mariana-rios"]);
  assert.ok(records.has("pet_folha_migrated_from_v2"));
});

test("modalidades antigas mapeiam por nome; In Loco é aceita em cópias e modelos", () => {
  isolatedStorage();
  const { PROGRAM } = load("./src/config/program.ts");
  assert.deepEqual(PROGRAM.modalities, [
    "Interação em tempo real (In Loco)",
    "Interação em tempo real (Síncrona)",
    "Assíncrona",
  ]);
  assert.equal(PROGRAM.defaultModality, "Interação em tempo real (Síncrona)");
  assert.equal(storage.normalizeModality("Síncrona virtual"), "Interação em tempo real (Síncrona)");
  assert.equal(storage.normalizeModality("Síncrona presencial"), "Interação em tempo real (In Loco)");
  assert.equal(storage.normalizeModality("Assíncrona virtual"), "Assíncrona");
  assert.equal(storage.normalizeModality(""), "Interação em tempo real (Síncrona)");
  assert.equal(storage.normalizeModality("Interação em tempo real (In Loco)"), "Interação em tempo real (In Loco)");
  // Cópia 1.2 com a modalidade presencial antiga abre como In Loco.
  const copy = {
    version: "1.2",
    attachments: [],
    user: sampleUser,
    monthKey: "2026-10",
    activities: [
      { id: "p", date: "2026-10-06", start: "08:00", end: "12:00", modality: "Síncrona presencial", description: "Visita fictícia" },
      { id: "n", date: "2026-10-07", start: "08:00", end: "09:00", modality: "Interação em tempo real (In Loco)", description: "Reunião fictícia" },
    ],
  };
  const result = storage.inspectUserData(JSON.stringify(copy));
  assert.equal(result.success, true);
  assert.deepEqual(result.activities.map((a) => a.modality), [
    "Interação em tempo real (In Loco)",
    "Interação em tempo real (In Loco)",
  ]);
});

test("preenchimento rápido vem do histórico: mais recentes primeiro, sem repetir, sem a data", () => {
  const { buildRecommendations, recommendationKey, MAX_RECOMMENDATIONS } = load("./src/lib/recommendations.ts");
  const act = (id, date, start, description, extra = {}) => ({
    ...sampleActivity, id, date, start, end: "23:00", description, local: "", descricao: "", ...extra,
  });
  const history = [
    act("a", "2026-10-06", "09:00", "Reunião Geral", { local: "UFG", descricao: "Pauta antiga" }),
    act("b", "2026-11-03", "14:00", "  reunião   GERAL ", { local: "Sala nova", descricao: "Pauta nova" }),
    act("c", "2026-11-02", "08:00", "Visita técnica fictícia"),
    act("d", "2026-11-03", "08:00", "Estudo dirigido"),
  ];
  const list = buildRecommendations(history);
  // "Reunião Geral" aparece uma vez, com os dados da ocorrência mais recente.
  assert.deepEqual(list.map((r) => r.label), ["reunião GERAL", "Estudo dirigido", "Visita técnica fictícia"]);
  assert.deepEqual(list[0].fields, {
    start: "14:00", end: "23:00", modality: sampleActivity.modality, local: "Sala nova",
    description: "  reunião   GERAL ", descricao: "Pauta nova",
  });
  assert.equal("date" in list[0].fields, false);
  assert.equal(recommendationKey(" Reunião  Geral "), recommendationKey("reunião geral"));
  // Limite de chips e histórico vazio.
  const many = Array.from({ length: 12 }, (_, i) => act(`m${i}`, `2026-11-${String(i + 1).padStart(2, "0")}`, "08:00", `Atividade ${i}`));
  assert.equal(buildRecommendations(many).length, MAX_RECOMMENDATIONS);
  assert.equal(buildRecommendations(many)[0].label, "Atividade 11");
  assert.deepEqual(buildRecommendations([]), []);
  // Os exemplos fictícios continuam com a lista própria; os modelos antigos salvos não são lidos nem apagados.
  const { PROGRAM } = load("./src/config/program.ts");
  assert.deepEqual(PROGRAM.sampleActivities.map((t) => t.name), [
    "Reunião Geral", "Capacitação", "Visita Técnica", "Pesquisa Bibliográfica e Estudos Autônomos",
  ]);
  assert.equal("templates" in PROGRAM, false);
  const records = isolatedStorage();
  records.set("pet_folha_config_templates_v3", "[]");
  storage.saveProfiles([sampleUser]);
  storage.saveActivitiesForMonth(sampleUser.id, "2026-10", [history[0]]);
  storage.saveActivitiesForMonth(sampleUser.id, "2026-11", [history[1], history[2]]);
  assert.deepEqual(storage.getProfileActivityHistory(sampleUser.id).map((a) => a.id).sort(), ["a", "b", "c"]);
  assert.equal(records.get("pet_folha_config_templates_v3"), "[]");
  assert.equal(storage.generateSeedActivities("01", "GAT 01", "2026-11").length, 4);
});

test("formulário: sem histórico, explica o preenchimento rápido; com histórico, mostra os chips", () => {
  const { buildRecommendations } = load("./src/lib/recommendations.ts");
  const empty = render(React.createElement(ActivityForm, { onSave: noop, recommendations: [] }));
  assert.match(empty, /As atividades que você registrar aparecem aqui/);
  assert.doesNotMatch(empty, /role="radiogroup"[^>]*template/);
  const full = render(React.createElement(ActivityForm, {
    onSave: noop,
    recommendations: buildRecommendations([{ ...sampleActivity, description: "Reunião fictícia" }]),
  }));
  assert.match(full, /Em branco/);
  assert.match(full, /Reunião fictícia/);
});
test("cartão de exemplo da entrada: dia da semana vem da data e linhas em ordem", () => {
  assert.equal(weekdayShort("2026-10-07"), "qua");
  assert.equal(weekdayShort("2026-10-06"), "ter");
  const html = render(
    React.createElement(LandingPage, {
      onLoginWithJson: noop, onCreateProfile: noop, gats: DEFAULT_GATS,
      roles: DEFAULT_ROLES, onOpenAdmin: noop, onOpenFeedback: noop,
    }),
  );
  const days = [...html.matchAll(/<li><span>(\w+)<br\/>(\d{2})<\/span>/g)].map((m) => m[1] + m[2]);
  assert.deepEqual(days, ["ter06", "qua07"]);
  // Sem o ícone "?" duplicado: a entrada já tem o link "Dúvidas".
  assert.doesNotMatch(html, /aria-label="Abrir ajuda"/);
  assert.match(html, /href="#perguntas">Dúvidas</);
});

test("endereço do site só na config; metadados usam PROGRAM.links.site", () => {
  const { PROGRAM } = load("./src/config/program.ts");
  assert.equal(PROGRAM.links.site, "https://pet-sd-folha-mensal.vercel.app");
  const files = readdirSync(path.join(root, "src"), { recursive: true })
    .filter((file) => /\.(ts|tsx|css)$/.test(file))
    .filter((file) => readFileSync(path.join(root, "src", file), "utf8").includes("vercel.app"))
    .map((file) => file.replaceAll("\\", "/"));
  assert.deepEqual(files, ["config/program.ts"]);
  assert.match(readFileSync(path.join(root, "src/app/layout.tsx"), "utf8"), /metadataBase: new URL\(PROGRAM\.links\.site\)/);
});

test("Analytics só no build da Vercel e imagens da marca leves", () => {
  const layout = readFileSync(path.join(root, "src/app/layout.tsx"), "utf8");
  assert.match(layout, /process\.env\.VERCEL \? <Analytics \/> : null/);
  assert.equal((layout.match(/<Analytics \/>/g) || []).length, 1);
  // Regenerar com scripts/brand/gerar-marca.py ou otimizar_png.py mantém tudo abaixo de 60 KB.
  const brand = path.join(root, "public/images/pet-sd");
  for (const file of readdirSync(brand).filter((name) => name.endsWith(".png"))) {
    const size = statSync(path.join(brand, file)).size;
    assert.ok(size <= 60 * 1024, `${file} tem ${Math.round(size / 1024)} KB (limite 60 KB)`);
  }
});

test("botão Avaliar o site depende do link configurado", () => {
  const { PROGRAM } = load("./src/config/program.ts");
  const { SiteFooter } = load("./src/components/SiteFooter.tsx");
  const { FeedbackModal } = load("./src/components/FeedbackModal.tsx");
  const footer = () => render(React.createElement(SiteFooter, { onHelp: noop, onFeedback: noop }));
  assert.equal(PROGRAM.links.feedbackForm, "https://forms.gle/tjpuiFpgJ2Njnx7F7");
  assert.equal(PROGRAM.links.activityForm, "");
  assert.match(footer(), />Avaliar o site</);
  // Autoria e créditos levam ao LinkedIn de cada pessoa.
  for (const person of [PROGRAM.author, ...PROGRAM.credits.authors])
    assert.match(person.url, /^https:\/\/www\.linkedin\.com\/in\/[^/]+\/$/);
  assert.equal(PROGRAM.author.url, "https://www.linkedin.com/in/brunnobernardes/");
  // Autoria desta versão vem de PROGRAM.author; créditos do original seguem.
  assert.match(footer(), new RegExp(`Feito por <a href="${PROGRAM.author.url}"[^>]*>${PROGRAM.author.name}</a> · adaptado do <a href="${PROGRAM.credits.upstreamRepository}"`));
  assert.match(footer(), /de <a href="https:\/\/www\.linkedin\.com\/in\/vvvvvdal\/"[^>]*>Felipe Gonçalves Vidal<\/a> e <a [^>]*>Robert Francisco Taveira<\/a>/);
  const modal = render(React.createElement(FeedbackModal, { isOpen: true, onClose: noop }));
  assert.match(modal, /href="https:\/\/forms\.gle\/tjpuiFpgJ2Njnx7F7" target="_blank" rel="noopener noreferrer"/);
  const saved = PROGRAM.links.feedbackForm;
  try {
    PROGRAM.links.feedbackForm = "";
    assert.doesNotMatch(footer(), /Avaliar/);
    assert.equal(render(React.createElement(FeedbackModal, { isOpen: true, onClose: noop })), "");
  } finally {
    PROGRAM.links.feedbackForm = saved;
  }
});

test("cópias 1.0 a 1.2 restauram com campos novos vazios e ignoram o Forms antigo", () => {
  isolatedStorage();
  const old = {
    version: "1.2",
    attachments: [],
    user: { ...sampleUser, role: "Estudante" },
    monthKey: "2026-10",
    activities: [{ id: "x", date: "2026-10-06", start: "16:30", end: "18:00", modality: "Assíncrona virtual", description: "Estudo", hours: 2, formReport: { group: "GT 4" } }],
  };
  const result = storage.inspectUserData(JSON.stringify(old));
  assert.equal(result.success, true);
  assert.equal(result.user.role, "Monitor(a)");
  assert.deepEqual(result.activities[0], {
    id: "x", date: "2026-10-06", start: "16:30", end: "18:00",
    modality: "Assíncrona", description: "Estudo", local: "", descricao: "", hours: 1.5,
  });
  assert.deepEqual(result.attachmentData, []);
  const v10 = storage.inspectUserData(JSON.stringify({ ...old, version: "1.0", attachments: undefined }));
  assert.equal(v10.success, true);
  assert.equal(v10.attachmentData, undefined);
  for (const bad of [{ local: 7 }, { descricao: "x".repeat(4001) }]) {
    const broken = { ...old, version: "1.3", activities: [{ ...old.activities[0], ...bad }] };
    assert.equal(storage.inspectUserData(JSON.stringify(broken)).success, false);
  }
});

function verifyLabelTargets(html) {
  for (const [, id] of html.matchAll(/<label[^>]*for="([^"]+)"/g))
    assert.ok(html.includes('id="' + id + '"'), "Campo ausente: " + id);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "Os campos devem ter identificadores únicos",
  );
}

test("entrada apresenta acesso e explicação visível do JSON e PDF antes do FAQ", () => {
  const html = render(
    React.createElement(LandingPage, {
      onLoginWithJson: noop,
      onCreateProfile: noop,
      gats: DEFAULT_GATS,
      roles: DEFAULT_ROLES,
      onOpenAdmin: noop,
      onOpenFeedback: noop,
    }),
  );
  assert.ok(html.indexOf('id="acesso"') < html.indexOf('id="files-title"'));
  assert.ok(html.indexOf('id="files-title"') < html.indexOf('id="perguntas"'));
  assert.match(html, /O JSON é um arquivo que guarda sua identificação/);
  assert.match(html, /O PDF não permite restaurar/);
  assert.match(html, /Quem usa este navegador pode abrir/);
  assert.doesNotMatch(html, /Veja como sua folha|preview-disclosure|Sua frequência,|Clima/);
  // Estrutura da entrada no padrão de referência: marca, cartão de acesso,
  // três passos, dois arquivos e dúvidas, nesta ordem.
  assert.match(html, /Logo do PET-Saúde: Informação e Saúde Digital/);
  assert.match(html, /Vamos começar/);
  assert.ok(html.indexOf('id="acesso"') < html.indexOf('id="como-funciona"'));
  assert.ok(html.indexOf('id="como-funciona"') < html.indexOf('id="o-que-guardar"'));
  assert.match(html, /16:30 às 18:00 = 1h30/);
  verifyLabelTargets(html);
  assert.match(html, /Felipe Gonçalves Vidal/);
  assert.match(html, /Robert Francisco Taveira/);
  assert.match(html, /projeto original/);
  assert.doesNotMatch(html, /Clima/);
  assert.doesNotMatch(html, /hubfrequencia@gmail.com|Ver preços/);
});

test("FAQ compartilhado tem nove perguntas (perfis e visão semanal incluídas) e ajuda usa o diálogo comum", () => {
  const html = renderToStaticMarkup(React.createElement(FAQ));
  assert.equal((html.match(/<details>/g) || []).length, 9);
  assert.match(html, /Como troco, edito ou excluo um perfil\?/);
  assert.match(html, /O que é a visão semanal\?/);
  const help = render(
    React.createElement(HelpModal, { isOpen: true, onClose: noop }),
  );
  assert.match(help, /<dialog/);
  assert.match(help, /class="pet-dialog screen-only"/);
  assert.equal((help.match(/<details>/g) || []).length, 9);
});

test("painel mantém backup acessível sem ocultar ações em telas menores", () => {
  const html = render(
    React.createElement(Navbar, {
      user: sampleUser,
      activeTab: "dashboard",
      onTabChange: noop,
      onOpenProfileModal: noop,
      hasChanges: true,
      onExportBackup: noop,
      onImportBackup: noop,
      onOpenAdmin: noop,
      onOpenExitModal: noop,
      onOpenFeedback: noop,
      onOpenHelp: noop,
    }),
  );
  assert.match(html, /Salvar cópia/);
  assert.match(html, /Restaurar cópia/);
  assert.match(html, /aria-pressed="true"/);
  assert.doesNotMatch(html, /hidden (?:lg|md):flex/);
});

test("formulários e modais renderizam com campos rotulados e diálogos nativos", () => {
  const form = render(
    React.createElement(ActivityForm, {
      onSave: noop,
      recommendations: [],
    }),
  );
  verifyLabelTargets(form);
  for (const field of ["Data", "Início", "Fim", "Unidade/Local", "Atividade desenvolvida", "Descrição"])
    assert.match(form, new RegExp('<label[^>]*for="[^"]+"[^>]*>' + field));
  // A regra da CH fica na Ajuda; sem horários, a CH mostra um traço neutro.
  assert.doesNotMatch(form, /Conta o tempo exato/);
  assert.match(form, /<strong class="is-empty"><span aria-hidden="true">—<\/span>/);
  assert.doesNotMatch(form, />0h</);
  const components = [
    [
      EditActivityModal,
      { activity: sampleActivity, onSave: noop },
    ],
    [
      ProfileModal,
      {
        currentUser: sampleUser,
        allProfiles: [sampleUser],
        gats: DEFAULT_GATS,
        roles: DEFAULT_ROLES,
        onSaveProfile: noop,
      },
    ],
    [
      ExitModal,
      {
        userName: sampleUser.name,
        onConfirmExit: noop,
        onDownloadJson: noop,
        onDownloadPdf: noop,
      },
    ],
  ];
  for (const [Component, props] of components) {
    const html = render(
      React.createElement(Component, { ...props, isOpen: true, onClose: noop }),
    );
    verifyLabelTargets(html);
    assert.match(html, /<dialog/);
    assert.match(html, /aria-label="/);
  }
});

test("folha oficial reproduz o modelo do PET-SD: campos, perfis, 8 colunas, total e instruções", () => {
  const html = renderToStaticMarkup(
    React.createElement(OfficialSheet, {
      user: sampleUser,
      monthLabel: "Outubro/2026",
      activities: [sampleActivity],
      totalMinutes: 90,
    }),
  );
  assert.match(html, /REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD/);
  assert.match(html, /images\/pet-sd\/cabecalho-ficha\.png/);
  for (const field of ["Nome:", "GAT:", "Perfil:", "Mês de Referência:"])
    assert.ok(html.includes(field), "Campo ausente: " + field);
  assert.match(html, /PARTICIPANTE DE TESTE/);
  assert.match(html, /<td>1<\/td>/);
  assert.match(html, /\( X \) Monitor\(a\)/);
  assert.equal((html.match(/\( X \)/g) || []).length, 1);
  for (const role of ["Coordenador(a)", "Tutor(a)", "Preceptor(a)", "Orientador(a) de serviço"])
    assert.ok(html.includes(role), "Perfil ausente: " + role);
  const head = html.match(/pet-sheet-activities[\s\S]*?<thead>([\s\S]*?)<\/thead>/)[1];
  assert.deepEqual(
    [...head.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]),
    ["Data", "Unidade/Local", "Atividade Desenvolvida", "Início", "Fim", "CH (h)", "Modalidade", "Descrição"],
  );
  assert.match(html, /<td>06\/10<\/td><td>Sala fictícia<\/td><td>Atividade de teste<\/td><td>14:00<\/td><td>15:30<\/td><td>1h30<\/td><td>Interação em tempo real \(Síncrona\)<\/td>/);
  assert.match(html, /Total de CH no mês: 1h30/);
  assert.match(html, /primeiro dia útil do mês posterior/);
  assert.match(html, /Assinatura do Participante:/);
  assert.match(html, /Assinatura do Responsável:/);
  assert.match(html, /Instruções de preenchimento/);
  assert.equal((html.match(/<li>/g) || []).length, 5);
  assert.doesNotMatch(html, /Perguntas frequentes|site-footer|Clima/);

  const blank = renderToStaticMarkup(
    React.createElement(OfficialSheet, { user: sampleUser, monthLabel: "Outubro/2026", activities: [sampleActivity], isBlankTemplate: true }),
  );
  assert.doesNotMatch(blank, /PARTICIPANTE DE TESTE|Atividade de teste|\( X \)/);
  assert.equal((blank.match(/pet-sheet-empty-row/g) || []).length, 12);
});

test("CSS mantém impressão Carta paisagem isolada, temas e redução de movimento", () => {
  const css = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  assert.match(css, /size: letter landscape/);
  assert.doesNotMatch(css, /size: A4/);
  assert.match(css, /\.pet-sheet-instructions \{\s*break-before: page/);
  assert.match(css, /\.pet-sheet-frame > thead \{\s*display: table-header-group/);
  assert.match(css, /\.screen-only\s*\{\s*display: none !important/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.doesNotMatch(css.slice(0, css.indexOf("@page")), /!important/);
});

test("lista oferece primeiro registro e exemplos opcionais; tabela e cartões mantêm edição e exclusão", () => {
  const props = {
    activities: [],
    totalMinutes: 0,
    editingId: null,
    onEdit: noop,
    onDelete: noop,
    user: sampleUser,
    monthLabel: "Outubro/2026",
    onLoadSamples: noop,
    onClearMonth: noop,
  };
  const empty = render(React.createElement(ActivityTable, props));
  assert.match(empty, /Registrar primeira atividade/);
  assert.match(empty, /Carregar exemplos do GAT/);
  const filled = render(
    React.createElement(ActivityTable, {
      ...props,
      activities: [sampleActivity],
      totalMinutes: 90,
    }),
  );
  assert.match(filled, /<table/);
  assert.match(filled, /Sala fictícia/);
  assert.match(filled, /1h30/);
  assert.match(filled, /aria-label="Editar atividade:/);
  assert.match(filled, /aria-label="Excluir atividade:/);
  assert.match(filled, /Atividade de teste/);
});

test("datas acompanham o mês escolhido e cobrem toda a vigência", () => {
  assert.equal(getCurrentMonth(new Date("2026-11-02T12:00:00-03:00")), "2026-11");
  assert.equal(getCurrentMonth(new Date("2025-01-01T12:00:00-03:00")), "2025-08");
  assert.equal(getCurrentMonth(new Date("2029-01-01T12:00:00-03:00")), "2027-08");
  assert.equal(PROJECT_MONTHS[0], "2025-08");
  assert.equal(PROJECT_MONTHS.at(-1), "2027-08");
  assert.equal(PROJECT_MONTHS.length, 25);
  assert.equal(
    getDefaultActivityDate("2026-11", new Date("2026-11-02T12:00:00-03:00")),
    "2026-11-02",
  );
  assert.equal(
    getDefaultActivityDate("2026-10", new Date("2026-11-02T12:00:00-03:00")),
    "2026-10-01",
  );
});

test("validação completa da cópia ocorre antes de qualquer escrita", () => {
  const records = isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const before = JSON.stringify([...records]);
  const valid = {
    version: "1.0",
    user: sampleUser,
    monthKey: "2026-10",
    activities: [sampleActivity],
  };
  for (const data of [
    { ...valid, activities: [null] },
    { ...valid, user: { name: "Incompleto" } },
    { ...valid, monthKey: "2026-99" },
    { ...valid, version: "99" },
    { ...valid, activities: [{ ...sampleActivity, date: "2026-02-30" }] },
    { ...valid, activities: [{ ...sampleActivity, start: "29:00" }] },
    { ...valid, activities: [sampleActivity, sampleActivity] },
  ])
    assert.equal(storage.importUserData(JSON.stringify(data)).success, false);
  assert.equal(JSON.stringify([...records]), before);
});

test("falha intermediária na restauração reverte todas as escritas já concluídas", () => {
  const records = isolatedStorage();
  storage.saveProfiles([sampleUser]);
  storage.setActiveProfileId(sampleUser.id);
  storage.saveActivitiesForMonth(sampleUser.id, "2026-10", [sampleActivity]);
  const before = JSON.stringify([...records]);
  const original = localStorage.setItem;
  let writes = 0;
  localStorage.setItem = (key, value) => {
    if (++writes === 2) throw new Error("quota");
    original(key, value);
  };
  const result = storage.importUserData(
    JSON.stringify({
      version: "1.0",
      user: sampleUser,
      monthKey: "2026-10",
      activities: [],
    }),
  );
  assert.equal(result.code, "STORAGE_FAILED");
  assert.equal(JSON.stringify([...records]), before);
});

test("falha da recuperação é explícita e detalhes de suporte não levam dados pessoais", () => {
  isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const original = localStorage.setItem;
  let writes = 0;
  localStorage.setItem = (key, value) => {
    if (++writes > 1) throw new Error("SENTINELA_PRIVADA");
    original(key, value);
  };
  // Existing activity value forces rollback through setItem rather than removeItem.
  original(
    "pet_folha_activities_v3_test-ui_2026-10",
    JSON.stringify([sampleActivity]),
  );
  const result = storage.importUserData(
    JSON.stringify({
      version: "1.0",
      user: sampleUser,
      monthKey: "2026-10",
      activities: [],
    }),
  );
  assert.equal(result.code, "ROLLBACK_FAILED");
  const diagnostic = storage.getRestoreDiagnostic(result.code);
  assert.doesNotMatch(
    diagnostic,
    /SENTINELA|Participante|test-ui|Atividade|14:00/,
  );
  assert.deepEqual(Object.keys(JSON.parse(diagnostic)), [
    "operation",
    "code",
    "supportedSchema",
  ]);
});

test("cópia com nome igual e ID diferente não mescla participantes", () => {
  const records = isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const before = JSON.stringify([...records]);
  const result = storage.importUserData(
    JSON.stringify({
      version: "1.0",
      user: { ...sampleUser, id: "other" },
      monthKey: "2026-10",
      activities: [],
    }),
  );
  assert.equal(result.code, "PROFILE_CONFLICT");
  assert.equal(JSON.stringify([...records]), before);
});

test("entrada oferece os perfis locais sem exigir cópia e resumo não promete aptidão", () => {
  const html = render(
    React.createElement(LandingPage, {
      profiles: [sampleUser],
      onSelectProfile: noop,
      onLoginWithJson: noop,
      onCreateProfile: noop,
      gats: DEFAULT_GATS,
      roles: DEFAULT_ROLES,
      onOpenAdmin: noop,
      onOpenFeedback: noop,
    }),
  );
  assert.match(html, /Continuar/);
  assert.match(html, /sem o arquivo anterior/);
  assert.match(html, /Participante de teste/);
  const { StatsGrid } = load("./src/components/StatsGrid.tsx");
  const summary = renderToStaticMarkup(
    React.createElement(StatsGrid, { totalMinutes: 32 * 60, activitiesCount: 8 }),
  );
  assert.doesNotMatch(summary, /Apta|Média semanal/);
  assert.match(summary, /distribuição semanal/);
});

test("GATs em ordem numérica e contagens no singular", () => {
  const { sortedGats, DEFAULT_GATS } = load("./src/types/index.ts");
  const numbers = sortedGats(DEFAULT_GATS).map((gat) => gat.number);
  assert.equal(numbers[0], "01");
  assert.deepEqual(numbers, [...numbers].sort());
  const { pluralize } = load("./src/lib/pet-calculator.ts");
  assert.equal(pluralize(1, "atividade", "atividades"), "1 atividade");
  assert.equal(pluralize(0, "atividade", "atividades"), "0 atividades");
  assert.equal(pluralize(3, "atividade", "atividades"), "3 atividades");
});

// ============================================================
// E3: editar e excluir perfis na entrada
// ============================================================
function seedProfiles(records) {
  const ana = { ...sampleUser, id: "ana", name: "Ana Fictícia" };
  const ana2 = { ...sampleUser, id: "ana-2", name: "Ana Fictícia Dois" };
  const outro = { ...sampleUser, id: "ana_b", name: "Outra Pessoa" };
  records.set("pet_folha_profiles_v3", JSON.stringify([ana, ana2, outro]));
  records.set("pet_folha_active_profile_id_v3", "ana");
  const act = (id, date) => ({ ...sampleActivity, id, date });
  records.set("pet_folha_activities_v3_ana_2026-10", JSON.stringify([act("a1", "2026-10-06"), act("a2", "2026-10-07")]));
  records.set("pet_folha_activities_v3_ana_2026-11", JSON.stringify([act("a3", "2026-11-03")]));
  records.set("pet_folha_activities_v3_ana_2026-12", JSON.stringify([]));
  records.set("pet_folha_activities_v3_ana-2_2026-10", JSON.stringify([act("b1", "2026-10-08")]));
  records.set("pet_folha_activities_v3_ana_b_2026-10", JSON.stringify([act("c1", "2026-10-09")]));
  records.set("pet_folha_migrated_from_v2", "2026-10-01T00:00:00.000Z");
  records.set("pet_folha_profiles_v2", JSON.stringify([{ id: "legado" }]));
  records.set("pet_theme", "dark");
  return { ana, ana2, outro };
}

test("resumo do perfil conta meses com atividades e atividades, só daquele id", () => {
  const records = isolatedStorage();
  seedProfiles(records);
  assert.deepEqual(storage.getProfileActivitySummary("ana"), { months: 2, activities: 3 });
  assert.deepEqual(storage.getProfileActivitySummary("ana-2"), { months: 1, activities: 1 });
  assert.deepEqual(storage.listProfileMonths("ana"), ["2026-10", "2026-11"]);
  assert.deepEqual(storage.getProfileActivitySummary("ninguem"), { months: 0, activities: 0 });
});

test("excluir remove só os dados daquele perfil no localStorage", () => {
  const records = isolatedStorage();
  seedProfiles(records);
  const before = new Map(records);
  const removed = storage.deleteUserProfile("ana");
  assert.deepEqual(removed, { months: 2, activities: 3 });
  assert.deepEqual(storage.getStoredProfiles().map((p) => p.id), ["ana-2", "ana_b"]);
  for (const key of [...before.keys()]) {
    const isAna = /^pet_folha_activities_v3_ana_\d{4}-\d{2}$/.test(key);
    if (isAna) assert.equal(records.has(key), false, key);
    else if (key !== "pet_folha_profiles_v3" && key !== "pet_folha_active_profile_id_v3")
      assert.equal(records.get(key), before.get(key), key);
  }
  // Perfil ativo excluído: a entrada volta sem perfil aberto.
  assert.equal(records.has("pet_folha_active_profile_id_v3"), false);
  // Excluir um perfil não ativo preserva o ativo.
  records.set("pet_folha_active_profile_id_v3", "ana_b");
  storage.deleteUserProfile("ana-2");
  assert.equal(records.get("pet_folha_active_profile_id_v3"), "ana_b");
  assert.equal(records.has("pet_folha_activities_v3_ana_b_2026-10"), true);
});

test("editar nome não duplica perfil: mesmo id, e nome de outro perfil é recusado", () => {
  const records = isolatedStorage();
  const { ana } = seedProfiles(records);
  const renamed = storage.updateUserProfileAdmin({ ...ana, name: "Ana Renomeada" });
  assert.equal(renamed.success, true);
  const profiles = storage.getStoredProfiles();
  assert.equal(profiles.length, 3);
  assert.equal(profiles.find((p) => p.id === "ana").name, "Ana Renomeada");
  // Atividades continuam na mesma chave (o id não muda).
  assert.equal(storage.getActivitiesForMonth("ana", "2026-10").length, 2);
  const clash = storage.updateUserProfileAdmin({ ...ana, name: "  ANA FICTÍCIA dois " });
  assert.equal(clash.success, false);
  assert.equal(storage.getStoredProfiles().length, 3);
  assert.equal(storage.getStoredProfiles().find((p) => p.id === "ana-2").name, "Ana Fictícia Dois");
});

test("cópia do perfil inteiro (1.4) restaura todos os meses depois de excluir", () => {
  const records = isolatedStorage();
  const { ana } = seedProfiles(records);
  const attachment = { id: "f1", name: "foto.png", base64: "iVBORw0KGgo=" };
  const json = storage.exportProfileData(ana, { "2026-11": [attachment], "2027-01": [attachment] });
  const data = JSON.parse(json);
  assert.equal(data.version, "1.4");
  assert.deepEqual(data.months.map((m) => [m.monthKey, m.activities.length, m.attachments.length]), [
    ["2026-10", 2, 0],
    ["2026-11", 1, 1],
    ["2027-01", 0, 1],
  ]);
  const before = {
    oct: records.get("pet_folha_activities_v3_ana_2026-10"),
    nov: records.get("pet_folha_activities_v3_ana_2026-11"),
  };
  storage.deleteUserProfile("ana");
  const preview = storage.inspectUserData(json);
  assert.equal(preview.success, true);
  assert.equal(preview.monthKey, "2027-01");
  assert.equal(preview.months.length, 3);
  assert.deepEqual(preview.months[1].attachmentData, [attachment]);
  // Sem IndexedDB, importUserData recusa cópias com comprovantes.
  assert.equal(storage.importUserData(json).success, false);
  const result = storage.applyUserData(preview);
  assert.equal(result.success, true);
  assert.equal(records.get("pet_folha_activities_v3_ana_2026-10"), before.oct);
  assert.equal(records.get("pet_folha_activities_v3_ana_2026-11"), before.nov);
  assert.equal(storage.getStoredProfiles().find((p) => p.id === "ana").name, "Ana Fictícia");
  assert.deepEqual(storage.getProfileActivitySummary("ana"), { months: 2, activities: 3 });
});

test("cópia 1.4 inválida não grava nada", () => {
  const records = isolatedStorage();
  const { ana } = seedProfiles(records);
  const valid = JSON.parse(storage.exportProfileData(ana));
  const snapshot = JSON.stringify([...records]);
  const broken = [
    { ...valid, months: "x" },
    { ...valid, months: [valid.months[0], valid.months[0]] },
    { ...valid, months: [{ ...valid.months[0], monthKey: "2026-13" }] },
    { ...valid, months: [{ ...valid.months[0], attachments: undefined }] },
    // Datas livres aceitam um mês antes ou depois; outubro na folha de 2027-01 não.
    { ...valid, months: [{ ...valid.months[0], monthKey: "2027-01" }] },
    { ...valid, months: [{ ...valid.months[0], activities: [{ id: "x" }] }] },
  ];
  for (const data of broken) {
    assert.equal(storage.inspectUserData(JSON.stringify(data)).success, false);
  }
  assert.equal(JSON.stringify([...records]), snapshot);
});

test("entrada mostra perfis em cartões com Abrir, Editar e Excluir rotulados", () => {
  const { profileInitials, monthsWithActivities } = load("./src/components/LandingPage.tsx");
  assert.equal(profileInitials("ana maria fictícia"), "AF");
  assert.equal(profileInitials("Ícaro"), "Í");
  assert.equal(monthsWithActivities(0), "Nenhum mês com atividades");
  assert.equal(monthsWithActivities(1), "1 mês com atividades");
  assert.equal(monthsWithActivities(3), "3 meses com atividades");
  const html = render(
    React.createElement(LandingPage, {
      profiles: [sampleUser],
      profileSummaries: { [sampleUser.id]: { months: 2, activities: 5 } },
      onSelectProfile: noop,
      onEditProfile: noop,
      onDeleteProfile: noop,
      onLoginWithJson: noop,
      onCreateProfile: noop,
      gats: DEFAULT_GATS,
      roles: DEFAULT_ROLES,
      onOpenAdmin: noop,
      onOpenFeedback: noop,
    }),
  );
  assert.match(html, /<ul class="profile-cards" aria-label="Perfis neste navegador">/);
  assert.match(html, /aria-label="Abrir folha de Participante de teste"/);
  assert.match(html, /aria-label="Editar perfil de Participante de teste"/);
  assert.match(html, /aria-label="Excluir perfil de Participante de teste"/);
  assert.match(html, /2 meses com atividades/);
  assert.doesNotMatch(html, /<select[^>]*id="entry-profile"/);
});

// ============================================================
// E5: visão semanal (faixas de segunda a domingo cortadas pelo mês)
// ============================================================
const weeks = load("./src/lib/weeks.ts");
const calendarBands = (monthKey, activities = [], today = "") =>
  weeks.getMonthWeekBands(monthKey, activities, today);
const bandLabels = (monthKey, activities = [], today = "") =>
  weeks.getMonthWeekBands(monthKey, activities, today).map((band) => band.label);

// Referência independente: anda dia a dia e fecha a faixa no domingo.
function referenceBands(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const out = [];
  let start = 1;
  for (let day = 1; ; day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() !== month - 1) {
      if (start < day) out.push(start === day - 1 ? `Dia ${start}` : `Dias ${start} a ${day - 1}`);
      return out;
    }
    if (date.getUTCDay() === 0) {
      out.push(start === day ? `Dia ${start}` : `Dias ${start} a ${day}`);
      start = day + 1;
    }
  }
}

test("faixas de semana: mês que começa no domingo (nov/2026, 6 faixas, como o app original)", () => {
  assert.deepEqual(bandLabels("2026-11"), ["Dia 1", "Dias 2 a 8", "Dias 9 a 15", "Dias 16 a 22", "Dias 23 a 29", "Dia 30"]);
  const bands = weeks.getMonthWeekBands("2026-11");
  assert.deepEqual(bands.map((b) => b.partial), [true, false, false, false, false, true]);
  assert.deepEqual(bands.map((b) => b.days), [1, 7, 7, 7, 7, 1]);
  assert.equal(bands[0].start, "2026-11-01");
  assert.equal(bands[5].end, "2026-11-30");
});

test("faixas de semana: mês que começa no sábado e fevereiros", () => {
  // 01/08/2026 é sábado.
  assert.equal(new Date(Date.UTC(2026, 7, 1)).getUTCDay(), 6);
  assert.deepEqual(bandLabels("2026-08"), ["Dias 1 a 2", "Dias 3 a 9", "Dias 10 a 16", "Dias 17 a 23", "Dias 24 a 30", "Dia 31"]);
  // Fevereiro de 28 dias começando na segunda: quatro semanas inteiras.
  assert.equal(new Date(Date.UTC(2027, 1, 1)).getUTCDay(), 1);
  assert.deepEqual(bandLabels("2027-02"), ["Dias 1 a 7", "Dias 8 a 14", "Dias 15 a 21", "Dias 22 a 28"]);
  assert.ok(weeks.getMonthWeekBands("2027-02").every((band) => !band.partial));
  // Fevereiro bissexto.
  assert.deepEqual(bandLabels("2028-02"), referenceBands("2028-02"));
  assert.equal(weeks.getMonthWeekBands("2028-02").at(-1).end, "2028-02-29");
  // Toda a vigência confere com a referência dia a dia.
  for (const month of PROJECT_MONTHS) assert.deepEqual(bandLabels(month), referenceBands(month), month);
  assert.deepEqual(weeks.getMonthWeekBands("2026-13"), []);
  assert.deepEqual(weeks.getMonthWeekBands("x"), []);
});

test("faixas de semana: CH exata nos limites; datas de outro mês estendem o período", () => {
  const a = (date, start, end) => ({ date, start, end });
  const inside = [
    a("2026-11-01", "08:00", "09:30"), // Dia 1 (domingo)
    a("2026-11-08", "16:30", "18:00"), // último dia de "2 a 8"
    a("2026-11-08", "18:00", "18:05"),
    a("2026-11-09", "11:00", "13:00"), // primeiro dia de "9 a 15"
    a("2026-11-30", "09:00", "17:00"), // Dia 30
    a("2026-11-10", "10:00", "09:00"), // fim antes do início vale 0
  ];
  const bands = calendarBands("2026-11", inside);
  assert.deepEqual(bands.map((b) => b.label), ["Dia 1", "Dias 2 a 8", "Dias 9 a 15", "Dias 16 a 22", "Dias 23 a 29", "Dia 30"]);
  assert.deepEqual(bands.map((b) => b.minutes), [90, 95, 120, 0, 0, 480]);
  assert.equal(formatDuration(bands[1].minutes), "1h35");
  // Datas livres: 31/10 (sábado) e 01/12 entram e o período passa do mês.
  const all = [...inside, a("2026-10-31", "09:00", "17:00"), a("2026-12-01", "09:00", "17:00")];
  const wide = calendarBands("2026-11", all);
  assert.deepEqual(wide.map((b) => b.label), [
    "Dias 31/10 a 01/11", "Dias 02/11 a 08/11", "Dias 09/11 a 15/11", "Dias 16/11 a 22/11", "Dias 23/11 a 29/11", "Dias 30/11 a 01/12",
  ]);
  assert.deepEqual(wide.map((b) => b.minutes), [570, 95, 120, 0, 0, 960]);
  // A soma das faixas é sempre o total da folha.
  assert.equal(wide.reduce((sum, b) => sum + b.minutes, 0), sumActivityMinutes(all));
  // Data inválida não estende nem soma.
  assert.equal(calendarBands("2026-11", [a("2026-02-30", "08:00", "09:00")]).length, 6);
});
test("semana atual vem da data de Brasília, não do fuso do aparelho", () => {
  // 02:30 UTC de 19/11 ainda é 23:30 de 18/11 em Brasília.
  assert.equal(weeks.todayInBrasilia(new Date("2026-11-19T02:30:00Z")), "2026-11-18");
  assert.equal(weeks.todayInBrasilia(new Date("2026-11-19T03:30:00Z")), "2026-11-19");
  const bands = weeks.getMonthWeekBands("2026-11", [], "2026-11-18");
  assert.deepEqual(bands.map((b) => b.isCurrent), [false, false, false, true, false, false]);
  assert.ok(weeks.getMonthWeekBands("2026-11", [], "2026-12-01").every((b) => !b.isCurrent));
  assert.equal(weeks.getMonthWeekBands("2026-11", [], "2026-11-30").at(-1).isCurrent, true);
});

test("resumo mensal é o padrão e a visão semanal mostra as faixas com a meta semanal", () => {
  const { StatsGrid } = load("./src/components/StatsGrid.tsx");
  const props = { totalMinutes: 90, activitiesCount: 1, monthLabel: "Novembro/2026", monthKey: "2026-11", activities: [{ date: "2026-11-03", start: "16:30", end: "18:00" }] };
  const monthly = renderToStaticMarkup(React.createElement(StatsGrid, props));
  assert.match(monthly, /role="radiogroup"/);
  assert.match(monthly, /checked="" value="monthly"/);
  assert.match(monthly, /role="progressbar"/);
  // Com a preferência salva, abre na visão semanal.
  const records = isolatedStorage();
  records.set("pet_folha_summary_view", "weekly");
  const weekly = renderToStaticMarkup(React.createElement(StatsGrid, props));
  assert.match(weekly, /checked="" value="weekly"/);
  assert.equal([...weekly.matchAll(/class="week-band"/g)].length, 6);
  assert.match(weekly, /Dias 2 a 8<\/strong>/);
  assert.match(weekly, /1h30 de 8 h/);
  // Aviso de parcial no próprio título (sem linha extra): as barras ficam alinhadas.
  assert.match(weekly, /Dia 1<span class="week-band-partial"> \(semana parcial\)<\/span><\/strong>/);
  assert.doesNotMatch(weekly, /week-band-note/);
  assert.match(weekly, /não é reduzida/);
  // localStorage inacessível: volta ao padrão sem erro.
  globalThis.localStorage = { getItem() { throw new Error("bloqueado"); } };
  assert.match(renderToStaticMarkup(React.createElement(StatsGrid, props)), /checked="" value="monthly"/);
});

test("regra de ouro: fixture da main abre igual pelo storage e nada é reescrito", () => {
  const fixture = JSON.parse(readFileSync(path.join(root, "tests/fixtures/dados-v3-main.json"), "utf8"));
  const records = isolatedStorage();
  for (const [key, value] of Object.entries(fixture.localStorage)) records.set(key, value);
  const before = JSON.stringify([...records]);
  const profiles = storage.getStoredProfiles();
  assert.deepEqual(profiles, JSON.parse(fixture.localStorage.pet_folha_profiles_v3));
  for (const [key, value] of Object.entries(fixture.localStorage)) {
    const match = /^pet_folha_activities_v3_(.+)_(\d{4}-\d{2})$/.exec(key);
    if (!match) continue;
    const loaded = storage.getActivitiesForMonth(match[1], match[2]);
    assert.deepEqual(loaded, JSON.parse(value), key);
  }
  assert.deepEqual(storage.getProfileActivitySummary(profiles[0].id), { months: 2, activities: 4 });
  assert.deepEqual(storage.getProfileActivitySummary(profiles[1].id), { months: 1, activities: 1 });
  assert.equal(JSON.stringify([...records]), before);
});

// ============================================================
// Datas livres (cada GAT fecha a folha num dia: 26 a 25, 20 a 19…)
// ============================================================
const calc = load("./src/lib/pet-calculator.ts");

test("datas livres: limite só na vigência; mês aberto e data sugerida pelo fuso de Brasília", () => {
  const br = (iso) => new Date(`${iso}T12:00:00-03:00`);
  assert.equal(calc.DATE_LIMITS.min, "2025-07-01");
  assert.equal(calc.DATE_LIMITS.max, "2027-08-31");
  for (const ok of ["2026-10-26", "2026-11-20", "2025-07-20", "2027-08-31", "2027-02-28"])
    assert.equal(calc.isDateAllowed(ok), true, ok);
  for (const bad of ["", "2026-02-30", "2062-11-03", "2025-06-30", "2027-09-01", "03/11/2026"])
    assert.equal(calc.isDateAllowed(bad), false, bad);
  // 23:30 de 30/11 em Brasília é 01/12 em UTC: vale Brasília.
  assert.equal(calc.getCurrentMonth(new Date("2026-11-30T23:30:00-03:00")), "2026-11");
  assert.equal(calc.getDefaultActivityDate("2026-11", new Date("2026-11-30T23:30:00-03:00")), "2026-11-30");
  assert.equal(calc.getDefaultActivityDate("2026-10", br("2026-11-02")), "2026-10-01");
  assert.equal(calc.shiftMonthKey("2026-12", 1), "2027-01");
  assert.equal(calc.shiftMonthKey("2027-01", -1), "2026-12");
  // O formulário aceita a vigência inteira, não só o mês da folha.
  const form = renderToStaticMarkup(
    React.createElement(DialogProvider, null, React.createElement(ActivityForm, { monthKey: "2026-11", onSave: () => true })),
  );
  assert.match(form, /min="2025-07-01"/);
  assert.match(form, /max="2027-08-31"/);
});

test("lançar 26/10 na folha de Novembro grava e soma nela", () => {
  isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const october = { ...sampleActivity, id: "out-26", date: "2026-10-26" };
  storage.saveActivitiesForMonth(sampleUser.id, "2026-11", [october]);
  assert.deepEqual(storage.getActivitiesForMonth(sampleUser.id, "2026-11").map((a) => a.date), ["2026-10-26"]);
  assert.deepEqual(storage.getActivitiesForMonth(sampleUser.id, "2026-10"), []);
  assert.deepEqual(storage.listProfileMonths(sampleUser.id), ["2026-11"]);
  // A cópia 1.4 dessa folha restaura (antes era recusada por ter outubro).
  const json = storage.exportProfileData(sampleUser);
  const preview = storage.inspectUserData(json);
  assert.equal(preview.success, true);
  assert.deepEqual(preview.months.map((m) => m.monthKey), ["2026-11"]);
});

test("cópia do perfil sem nenhum mês restaura só a identificação", () => {
  const records = isolatedStorage();
  storage.saveProfiles([sampleUser]);
  const json = storage.exportProfileData(sampleUser);
  assert.deepEqual(JSON.parse(json).months, []);
  storage.deleteUserProfile(sampleUser.id);
  const preview = storage.inspectUserData(json);
  assert.equal(preview.success, true);
  assert.deepEqual(preview.months, []);
  assert.equal(storage.applyUserData(preview).success, true);
  assert.deepEqual(storage.getStoredProfiles().map((p) => p.id), [sampleUser.id]);
  assert.equal([...records.keys()].some((key) => key.startsWith("pet_folha_activities_v3_")), false);
});

// ============================================================
// Folha em Word (.docx) a partir do modelo oficial
// ============================================================
const docx = load("./src/lib/docx-export.ts");
const fflate = load("fflate");
const docxTemplate = new Uint8Array(
  readFileSync(path.join(root, "public/templates/pet-sd-registro-de-frequencia-modelo-em-branco.docx")),
);

function docxXml(bytes) {
  return fflate.strFromU8(fflate.unzipSync(bytes)["word/document.xml"]);
}
function assertBalanced(xml) {
  for (const tag of ["w:tbl", "w:tr", "w:tc", "w:p", "w:r", "w:rPr", "w:pPr"]) {
    const open = (xml.match(new RegExp(`<${tag}[ >]`, "g")) || []).length;
    const close = (xml.match(new RegExp(`</${tag}>`, "g")) || []).length;
    assert.equal(open, close, tag);
  }
}
const cellText = (xml) => [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");

test("docx: preenche identificação, perfil, atividades e total no modelo oficial", () => {
  const acts = [
    { ...sampleActivity, id: "a2", date: "2026-11-05", start: "11:00", end: "13:00", local: "UBS Fictícia", descricao: "" },
    { ...sampleActivity, id: "a1", date: "2026-10-26", start: "16:30", end: "18:00", local: "UFG", descricao: "Ata fictícia" },
  ];
  const bytes = docx.fillSheetDocx(docxTemplate, {
    user: { name: "Participante Fictício", gatNumber: "01", role: "Monitor(a)" },
    monthLabel: "Novembro/2026",
    activities: acts,
  });
  const files = fflate.unzipSync(bytes);
  // Todas as partes do modelo continuam lá (fontes, imagem, cabeçalho).
  assert.deepEqual(Object.keys(files).sort(), Object.keys(fflate.unzipSync(docxTemplate)).sort());
  const xml = docxXml(bytes);
  assertBalanced(xml);
  assert.match(xml, />PARTICIPANTE FICTÍCIO</);
  assert.match(xml, /<w:t xml:space="preserve">1<\/w:t>/);
  assert.match(xml, />Novembro\/2026</);
  assert.equal((xml.match(/\( X \)/g) || []).length, 1);
  assert.match(xml, /\( X \) Monitor\(a\)/);
  const tables = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g);
  const rows = tables[1].match(/<w:tr\b[\s\S]*?<\/w:tr>/g);
  // Títulos + 2 atividades (em ordem) + 10 em branco + total.
  assert.equal(rows.length, 1 + 2 + 10 + 1);
  assert.equal(
    cellText(rows[1]),
    "26/10UFG" + sampleActivity.description + "16:3018:001h30" + sampleActivity.modality + "Ata fictícia",
  );
  assert.match(cellText(rows[2]), /^05\/11UBS Fictícia/);
  assert.equal(cellText(rows[3]), "");
  assert.equal(cellText(rows.at(-1)), "Total de CH no mês: 3h30");
  // Texto da célula usa a fonte do parágrafo (Times New Roman), não a padrão.
  assert.match(rows[1], /<w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/);
});

test("docx: escapa XML, quebra linhas e cresce além das 12 linhas do modelo", () => {
  const tricky = {
    ...sampleActivity,
    description: 'Reunião <GAT> & "TI"',
    descricao: "Linha 1\nLinha 2\tcom tab\u0007",
  };
  const many = Array.from({ length: 15 }, (_, i) => ({
    ...sampleActivity,
    id: `m${i}`,
    date: `2026-11-${String(i + 1).padStart(2, "0")}`,
  }));
  const xml = docxXml(docx.fillSheetDocx(docxTemplate, {
    user: { name: "Teste", gatNumber: "02", role: "Tutor(a)" },
    monthLabel: "Novembro/2026",
    activities: [tricky, ...many],
  }));
  assertBalanced(xml);
  assert.match(xml, /Reunião &lt;GAT&gt; &amp; &quot;TI&quot;/);
  assert.match(
    xml,
    /Linha 1<\/w:t><w:br\/><w:t xml:space="preserve">Linha 2<\/w:t><w:tab\/><w:t xml:space="preserve">com tab<\/w:t>/,
  );
  assert.doesNotMatch(xml, /\u0007/);
  const rows = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g)[1].match(/<w:tr\b[\s\S]*?<\/w:tr>/g);
  // 16 atividades + 3 linhas em branco para completar à mão.
  assert.equal(rows.length, 1 + 16 + 3 + 1);
  assert.equal(docx.xmlText("a\u0000b￾c"), "abc");
  assert.equal(docx.sheetDocxFilename("ana-ficticia", "2026-11"), "folha-pet-sd-ana-ficticia-2026-11.docx");
});

test("docx: modelo diferente do esperado falha com erro, sem gerar arquivo quebrado", () => {
  const data = { user: sampleUser, monthLabel: "x", activities: [] };
  const broken = fflate.zipSync({ "word/document.xml": fflate.strToU8("<w:document><w:body/></w:document>") });
  assert.throws(() => docx.fillSheetDocx(broken, data), /Modelo \.docx inesperado/);
  const noDocument = fflate.zipSync({ "a.txt": new Uint8Array(1) });
  assert.throws(() => docx.fillSheetDocx(noDocument, data), /sem word\/document\.xml/);
});

test("nome de arquivo sem acento nem caractere proibido", () => {
  const { fileSlug } = load("./src/lib/download.ts");
  assert.equal(fileSlug("Ana Fictícia"), "ana-ficticia");
  assert.equal(fileSlug("  João / Silva: GAT?  "), "joao-silva-gat");
  assert.equal(fileSlug("???"), "participante");
});

// ============================================================
// Varredura de bugs: acessibilidade e fechamento da folha
// ============================================================
test("barra de progresso: aria-valuenow nunca passa de aria-valuemax", () => {
  const { StatsGrid } = load("./src/components/StatsGrid.tsx");
  isolatedStorage();
  const html = renderToStaticMarkup(React.createElement(StatsGrid, {
    totalMinutes: 1925,
    activitiesCount: 1,
    monthLabel: "Novembro/2026",
    monthKey: "2026-11",
    activities: [],
    targetHours: 32,
  }));
  const now = Number(/aria-valuenow="([^"]+)"/.exec(html)[1]);
  const max = Number(/aria-valuemax="([^"]+)"/.exec(html)[1]);
  assert.ok(now <= max, `${now} > ${max}`);
});

test("editar atividade tem um só diálogo; concluir oferece Word e assinatura gov.br", () => {
  const edit = render(
    React.createElement(EditActivityModal, { activity: sampleActivity, onSave: noop, isOpen: true, onClose: noop }),
  );
  assert.equal((edit.match(/role="dialog"/g) || []).length + (edit.match(/<dialog/g) || []).length, 1);
  const base = { userName: sampleUser.name, onConfirmExit: noop, onDownloadJson: noop, onDownloadPdf: noop, isOpen: true, onClose: noop };
  const exit = render(React.createElement(ExitModal, { ...base, onDownloadDocx: noop }));
  assert.match(exit, /Baixar \.docx/);
  assert.match(exit, /Assine o documento online após gerar o arquivo PDF ou \.docx\./);
  // Concluir (padrão): o principal é "Concluir"; pelo menu, "Sair" ou "Trocar participante".
  assert.match(exit, /<\/svg> Concluir<\/button>/);
  assert.doesNotMatch(exit, /Sair \/ trocar participante/);
  const leaving = render(React.createElement(ExitModal, { ...base, leaveLabel: "Sair" }));
  assert.match(leaving, />Sair <svg/);
  assert.match(exit, /href="https:\/\/www\.gov\.br\/pt-br\/servicos\/assinatura-eletronica"/);
  assert.match(exit, /target="_blank" rel="noopener noreferrer"/);
  // Sem a função de Word, a opção não aparece (a assinatura continua).
  const noDocx = render(React.createElement(ExitModal, base));
  assert.doesNotMatch(noDocx, /Baixar \.docx/);
  assert.match(noDocx, /Assinar no gov\.br/);
});

test("folha e .docx: campo vazio da atividade sai como \"-\"; linha em branco continua vazia", () => {
  const bare = { ...sampleActivity, id: "vazio", local: "", descricao: "  " };
  const html = renderToStaticMarkup(
    React.createElement(OfficialSheet, { user: sampleUser, monthLabel: "Novembro/2026", activities: [bare], totalMinutes: 90 }),
  );
  const row = /<tbody>\s*<tr>([\s\S]*?)<\/tr>/.exec(html.split("pet-sheet-activities")[1])[1];
  const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  assert.equal(cells[1], "-");
  assert.equal(cells[7], "-");
  assert.match(html, /pet-sheet-empty-row"><td><\/td>/);
  const xml = docxXml(docx.fillSheetDocx(docxTemplate, { user: sampleUser, monthLabel: "Novembro/2026", activities: [bare] }));
  const rows = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g)[1].match(/<w:tr\b[\s\S]*?<\/w:tr>/g);
  const docCells = rows[1].match(/<w:tc>[\s\S]*?<\/w:tc>/g).map(cellText);
  assert.equal(docCells[1], "-");
  assert.equal(docCells[7], "-");
  assert.equal(cellText(rows[2]), "");
  assert.equal(calcModule.sheetCell(""), "-");
  assert.equal(calcModule.sheetCell("UFG"), "UFG");
});

test("lista oferece Duplicar em cada atividade quando a página passa a função", () => {
  const html = render(React.createElement(ActivityTable, {
    activities: [sampleActivity], totalMinutes: 90, editingId: null, onEdit: noop, onDelete: noop,
    onDuplicate: noop, user: sampleUser, monthLabel: "Novembro/2026", onLoadSamples: noop, onClearMonth: noop,
  }));
  assert.match(html, /aria-label="Duplicar atividade: /);
  const without = render(React.createElement(ActivityTable, {
    activities: [sampleActivity], totalMinutes: 90, editingId: null, onEdit: noop, onDelete: noop,
    user: sampleUser, monthLabel: "Novembro/2026", onLoadSamples: noop, onClearMonth: noop,
  }));
  assert.doesNotMatch(without, /Duplicar/);
});

// ============================================================
// Meta síncrona: 16 das 32 h em atividades síncronas ou In Loco
// ============================================================
test("meta síncrona: soma só Síncrona e In Loco, pelo nome da modalidade", () => {
  const a = (start, end, modality) => ({ start, end, modality });
  const list = [
    a("08:00", "12:00", "Interação em tempo real (Síncrona)"),
    a("23:00", "03:00", "Interação em tempo real (In Loco)"), // passa da meia-noite: 4h
    a("08:00", "18:00", "Assíncrona"),
    a("08:00", "09:00", "Modalidade personalizada"),
  ];
  assert.equal(calcModule.sumSynchronousMinutes(list), 480);
  assert.equal(sumActivityMinutes(list), 1140);
});

test("barra do mês: trecho síncrono, marca das 16 h e segunda barra acessível", () => {
  const { StatsGrid } = load("./src/components/StatsGrid.tsx");
  isolatedStorage();
  const sync = (date, start, end) => ({ date, start, end, modality: "Interação em tempo real (Síncrona)" });
  const async = (date, start, end) => ({ date, start, end, modality: "Assíncrona" });
  const props = (activities) => ({
    totalMinutes: sumActivityMinutes(activities), activitiesCount: activities.length,
    monthLabel: "Novembro/2026", monthKey: "2026-11", activities, targetHours: 32,
  });
  // 10 h síncronas + 14 h assíncronas = 24 h.
  const partial = [sync("2026-11-03", "08:00", "18:00"), async("2026-11-04", "08:00", "22:00")];
  const html = renderToStaticMarkup(React.createElement(StatsGrid, props(partial)));
  assert.match(html, /class="progress-total" style="width:75%"/);
  assert.match(html, /class="progress-sync" style="width:31\.25%"/);
  assert.match(html, /class="progress-marker" style="left:50%"/);
  assert.equal((html.match(/role="progressbar"/g) || []).length, 2);
  assert.match(html, /aria-label="CH síncrona\/In Loco em relação ao mínimo de 16 h" aria-valuenow="10"/);
  assert.match(html, /Síncronas\/In Loco: <strong>10h<\/strong> de 16 h/);
  // 32 h, mas só 10 síncronas: a meta não fecha.
  const unbalanced = [sync("2026-11-03", "08:00", "18:00"), async("2026-11-04", "00:00", "22:00")];
  const html2 = renderToStaticMarkup(React.createElement(StatsGrid, props(unbalanced)));
  assert.match(html2, /data-reached="false"/);
  assert.match(html2, /32 h alcançadas; faltam 6h síncronas\/In Loco/);
  // 16 síncronas + 16 assíncronas: fecha.
  const done = [sync("2026-11-03", "06:00", "22:00"), async("2026-11-04", "06:00", "22:00")];
  const html3 = renderToStaticMarkup(React.createElement(StatsGrid, props(done)));
  assert.match(html3, /Mínimo mensal alcançado/);
  // Sem atividade síncrona, não há trecho escuro.
  const none = renderToStaticMarkup(React.createElement(StatsGrid, props([async("2026-11-04", "08:00", "10:00")])));
  assert.doesNotMatch(none, /progress-sync/);
});

test("visão Semanal também mostra a barra única das 16 h síncronas/In Loco", () => {
  const { StatsGrid } = load("./src/components/StatsGrid.tsx");
  const records = isolatedStorage();
  records.set("pet_folha_summary_view", "weekly");
  const activities = [
    { date: "2026-11-03", start: "08:00", end: "12:00", modality: "Interação em tempo real (Síncrona)" },
    { date: "2026-11-05", start: "08:00", end: "12:00", modality: "Interação em tempo real (In Loco)" },
    { date: "2026-11-10", start: "08:00", end: "18:00", modality: "Assíncrona" },
  ];
  const html = renderToStaticMarkup(React.createElement(StatsGrid, {
    totalMinutes: sumActivityMinutes(activities), activitiesCount: 3,
    monthLabel: "Novembro/2026", monthKey: "2026-11", activities, targetHours: 32,
  }));
  assert.match(html, /class="week-band"/);
  // 8 h de 16 h: metade da barra, no laranja escuro da Mensal.
  assert.match(html, /class="progress-track progress-track--sync" role="progressbar" aria-label="CH síncrona\/In Loco em relação ao mínimo de 16 h" aria-valuenow="8"/);
  assert.match(html, /class="progress-sync" style="width:50%"/);
  assert.match(html, /Síncronas\/In Loco no mês: <strong>8h<\/strong> de 16 h/);
  assert.equal((html.match(/role="progressbar"/g) || []).length, 1);
});

test("comprovação fotográfica desligada: textos não pedem anexos e o que existir continua citado", () => {
  const { PROGRAM } = load("./src/config/program.ts");
  assert.equal(PROGRAM.features.photoProof, false);
  const faq = render(React.createElement(FAQ));
  assert.match(faq, /o app não anexa fotos à folha/);
  assert.doesNotMatch(faq, /anexe as fotos/);
  assert.doesNotMatch(faq, /atividades e comprovantes/);
  const { DeleteProfileModal } = load("./src/components/DeleteProfileModal.tsx");
  const props = (attachments) => ({
    isOpen: true, profile: sampleUser, summary: { months: 1, activities: 2, attachments },
    onClose: noop, onConfirm: noop, onSaveCopy: noop,
  });
  // Sem comprovantes guardados: o modal não fala neles.
  assert.doesNotMatch(render(React.createElement(DeleteProfileModal, props(0))), /comprovante/);
  // Com comprovantes de antes (dados preservados), avisa que também saem.
  assert.match(render(React.createElement(DeleteProfileModal, props(2))), /2 comprovantes\./);
});
