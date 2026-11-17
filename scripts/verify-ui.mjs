import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const { DEFAULT_GATS, DEFAULT_ROLES } = load("./src/types/index.ts");
const { LandingPage } = load("./src/components/LandingPage.tsx");
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

test("fim igual ou anterior ao início e horários inválidos valem zero", () => {
  assert.equal(calcPetMinutes("14:00", "14:00"), 0);
  assert.equal(calcPetMinutes("15:00", "14:00"), 0);
  assert.equal(calcPetMinutes("", ""), 0);
  assert.equal(calcPetMinutes("25:00", "26:00"), 0);
  assert.equal(calcPetMinutes("aa:bb", "10:00"), 0);
  assert.equal(calcPetHours("18:00", "17:00"), 0);
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
  assert.doesNotMatch(html, /Veja como sua folha|preview-disclosure|Sua frequência,|Vamos começar/);
  verifyLabelTargets(html);
  assert.match(html, /Felipe Gonçalves Vidal/);
  assert.match(html, /Robert Francisco Taveira/);
  assert.match(html, /projeto original/);
  assert.doesNotMatch(html, /Clima/);
  assert.doesNotMatch(html, /hubfrequencia@gmail.com|Ver preços/);
});

test("FAQ compartilhado tem sete perguntas e ajuda usa o diálogo comum", () => {
  const html = renderToStaticMarkup(React.createElement(FAQ));
  assert.equal((html.match(/<details>/g) || []).length, 7);
  const help = render(
    React.createElement(HelpModal, { isOpen: true, onClose: noop }),
  );
  assert.match(help, /<dialog/);
  assert.match(help, /class="pet-dialog screen-only"/);
  assert.equal((help.match(/<details>/g) || []).length, 7);
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
      templates: storage.DEFAULT_TEMPLATES,
    }),
  );
  verifyLabelTargets(form);
  for (const field of ["Data", "Início", "Fim", "Unidade/Local", "Atividade desenvolvida", "Descrição"])
    assert.match(form, new RegExp('<label[^>]*for="[^"]+"[^>]*>' + field));
  const components = [
    [
      EditActivityModal,
      { activity: sampleActivity, onSave: noop, templates: [] },
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
  assert.equal(getCurrentMonth(new Date(2026, 10, 2)), "2026-11");
  assert.equal(getCurrentMonth(new Date(2025, 0, 1)), "2025-08");
  assert.equal(getCurrentMonth(new Date(2029, 0, 1)), "2027-08");
  assert.equal(PROJECT_MONTHS[0], "2025-08");
  assert.equal(PROJECT_MONTHS.at(-1), "2027-08");
  assert.equal(PROJECT_MONTHS.length, 25);
  assert.equal(
    getDefaultActivityDate("2026-11", new Date(2026, 10, 2)),
    "2026-11-02",
  );
  assert.equal(
    getDefaultActivityDate("2026-10", new Date(2026, 10, 2)),
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
