# Adaptação para o PET-Saúde: Informação e Saúde Digital (PET-SD)

Registro de progresso da adaptação deste fork para o PET-SD UFG 2025–2027
(Edital Conjunto SEIDIGI/SGTES-MS nº 1/2025). Branch: `feat/adaptacao-pet-sd`.

## Progresso por épico

| Épico | Status | Commits | Como verificar | Pendências |
|---|---|---|---|---|
| E0 Reconhecimento e linha de base | feito | `docs: inventário da adaptação para o PET-SD` | ler este arquivo | respostas às dúvidas abaixo |
| E1 Identidade e textos | feito | `feat: identidade do PET-SD centralizada em config` | `npm run lint && npm run typecheck && npm run test:ui`; abrir `npm run dev` e ver marca, rodapé e FAQ | logo oficial (TODO(pet-sd)); links de Forms vazios (ambos resolvidos em 18/11/2026) |
| E2 Domínio e regras | feito | `feat: regras e cadastro do PET-SD` | `npm run test:ui` (testes de CH, soma do mês, migração v2→v3 e cópias 1.0–1.3) | confirmar modalidades e prazo |
| E3 Folha oficial | feito | `feat: folha oficial no modelo do PET-SD` | `npm run test:e2e` (folha extensa: Carta paisagem, cabeçalho repetido, assinaturas e instruções no fim); aba "Folha oficial" → "Imprimir / salvar PDF" | ver "Diferenças que restam" |
| E4 Testes e validação visual | feito | `test: cobertura do PET-SD e validação visual` | `npm run test:ui` (24) e `npm run test:e2e` (26); capturas em `docs/validation/pet-sd-20261117/` | diferenças listadas no README da validação |
| E5 Documentação e limpeza | feito | `docs: documentação do fork PET-SD` | ler `README.md`, `AGENTS.md`, `docs/`; `git grep -i clima` só acha Créditos, este registro e fixtures de teste | — |
| E6 Fechamento | feito | `fix: teste do seletor de mês no celular e robustez da migração`, `docs: relatório final da adaptação para o PET-SD` | CI completo em clone limpo: lint, test:ui (25), typecheck, build, test:e2e (26) | ver "Antes de publicar" |

## Linha de base (antes de qualquer mudança, commit `8d6c9f9`)

Ambiente: Windows 11, Node 22, Git Bash. Comandos rodados em sequência após
`npm ci && npx playwright install chromium`.

| Comando | Resultado |
|---|---|
| `npm ci` | ok |
| `npm run lint` | ok |
| `npm run test:ui` | ok |
| `npm run typecheck` | ok |
| `npm run build` | ok |
| `npm run test:e2e` | ok (26 testes: 13 desktop + 13 mobile) |

Observação: o `package.json` usa **Next.js 16.3.6** (o `AGENTS.md` original dizia
Next 15). A documentação da versão instalada está em `node_modules/next/dist/docs/`.

## Fontes consultadas (somente leitura)

Pasta local do Brunno, fora do repositório. Nenhum arquivo dela foi copiado
para cá, exceto a imagem do cabeçalho da ficha (logomarcas institucionais).

| Fonte | O que foi extraído |
|---|---|
| Ficha oficial `.docx` (modelo do GAT, preenchido) | só a estrutura: título, campos, perfis, 8 colunas, rodapé, instruções, página Carta paisagem (`w:pgSz` 15840×12240 twips, margens 1134 twips = 2 cm), imagem do cabeçalho (`word/media/image1.png`, recortada no Word por `srcRect l=19,119% b=92,696%`) |
| Regimento Interno PET-SD/UFG (04/12/2025) | 32 h/mês, excedente não acumula, tipos de atividade (in loco, síncronas, assíncronas), comprovação fotográfica, prazo de entrega (dia 25), mínimo de 2 h em capacitações, e-mail institucional |
| Edital Conjunto SEIDIGI/SGTES-MS nº 1/2025 | eixos 1–3, duração de 24 meses, 8 h semanais |
| Projeto institucional PET-SD UFG (20/06/2025) | lista dos 13 GATs (número, título, eixos). Nomes de coordenadores **não** foram copiados |

### Estrutura da ficha oficial

- Cabeçalho (header do Word): faixa de logomarcas alinhada à direita, 13,3 × 1,2 cm.
- Título: `REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD`.
- Tabela de identificação (2 colunas): `Nome:` · `GAT:` · `Perfil:` com caixas
  `( ) Coordenador(a) ( ) Tutor(a) ( ) Preceptor(a) ( ) Orientador(a) de serviço ( ) Monitor(a)` · `Mês de Referência:`.
- Tabela de atividades (8 colunas): Data | Unidade/Local | Atividade Desenvolvida |
  Início | Fim | CH (h) | Modalidade | Descrição. Data no formato `dd/mm`, CH como `2h`, `1h30`.
  Última linha mesclada: `Total de CH no mês: N horas`.
- Nota: `*Envio obrigatório até o primeiro dia útil do mês posterior às atividades ao coordenador do GAT. O não envio desta ficha devidamente preenchida no prazo acarretará a não validação da bolsa.`
- `Assinatura do Participante:` e `Assinatura do Responsável:`.
- Página nova: `Instruções de preenchimento`, itens 1 a 5.

## Inventário do que muda

Busca: `grep -rniE "clima|araticum|buriti|ipê|mangaba|pequi|SES|23/2026|16/2026|petsaudeufg|vercel\.app|docs\.google\.com/forms|SGTES|DEGES"`
em `src`, `public`, `docs`, `tests`, `scripts` e raiz, mais leitura dos componentes.

| Arquivo:linha | Hoje | O que muda |
|---|---|---|
| `src/app/layout.tsx:12-16` | título, descrição e ícone do Clima | ler de `src/config/program.ts` |
| `src/components/Brand.tsx:7,15` | avatar e nome "PET-Saúde Clima" | selo textual PET-SD + nome da config |
| `src/components/LandingPage.tsx:96` | kicker "PET-Saúde Clima · UFG" | config |
| `src/components/SiteFooter.tsx:3-5,21` | repositório upstream, PDF do Clima, "© PET-Saúde Clima" | config + créditos do projeto original |
| `src/components/FeedbackModal.tsx:10-11` | Forms de avaliação do Clima | link opcional da config; vazio esconde o botão |
| `src/lib/form-report.ts` (arquivo todo) | pré-preenchimento do Google Forms do Clima (entry IDs, opções, nomes de autorizadores) | ver Decisões D3 |
| `src/components/ActivityReportModal.tsx` | modal do Forms do Clima | ver Decisões D3 |
| `src/app/page.tsx:52-53,97-99,689-698,782-801,846-847,902-912` | Forms do Clima, PDF em branco do Clima, A4 | config + remoção do Forms + modelo PET-SD |
| `src/components/ActivityTable.tsx` | estado do Forms, filtro "Pendentes", horas inteiras | sem Forms; local e descrição; CH em `1h30` |
| `src/components/ExitModal.tsx:96,116-121` | A4; botão do Forms do Clima | Carta; link opcional |
| `src/components/Help.tsx:13,25,28-33` | regra CEILING−FLOOR, Forms, A4 | regras do PET-SD |
| `src/components/StatsGrid.tsx:12,17` | meta 32 h fixa | meta da config |
| `src/components/ActivityForm.tsx:28` | GAT padrão "Mangaba", 3 modalidades fixas | GAT "01", modalidades da config, local e descrição |
| `src/components/EditActivityModal.tsx:30` | idem | idem |
| `src/components/AdminModal.tsx:92,102,466,841-957,1113-1216` | eixos I–III do Clima, modalidades fixas | eixos 1–3 do edital, modalidades da config |
| `src/components/ProfileModal.tsx:125` | "E-mail para o formulário" | texto neutro |
| `src/components/OfficialSheet.tsx` (arquivo todo) | folha A4 do Clima | reescrita no modelo PET-SD |
| `src/components/MonthlyAttachments.tsx:90-93` | comprovantes "se o GAT pedir" | comprovação fotográfica de atividades in loco |
| `src/lib/pet-calculator.ts:4-6,61,76,256-268` | regra CEILING−FLOOR, exemplos Mangaba, vigência 2026-08..2028-08 | CH exata em minutos; vigência da config |
| `src/lib/storage.ts:503,303-315` | semente "Mangaba", modelos do Clima, chaves `_v2` | modelos PET-SD, chaves `_v3` com migração |
| `src/lib/attachments.ts:5-7` | escala de impressão A4 | Carta paisagem |
| `src/lib/releases.ts` | histórico de versões do Clima | entrada única do fork |
| `src/types/index.ts:3-69` | 5 papéis e 5 GATs do Clima, 3 modalidades | perfis e GATs do PET-SD; modalidade configurável |
| `src/app/globals.css:1707-1708,1920-1921` | `@page size: A4 landscape` | `size: letter landscape` |
| `public/images/*.png` | logos do Clima | removidos; cabeçalho da ficha em `public/images/pet-sd/` |
| `public/templates/*` | 7 modelos do Clima (docx/pdf/xlsx) | removidos; modelo em branco PET-SD |
| `docs/visual-identity/manual-de-idv.pdf` | manual de identidade do Clima | removido |
| `docs/validation/*` | capturas do Clima | removidas; nova validação |
| `docs/README.md`, `docs/regimento-pet.md`, `docs/architecture.md`, `docs/deployment-vercel.md`, `docs/ui-ux*.md`, `CONTRIBUTING.md`, `TASKS.md`, `README.md`, `AGENTS.md`, `GEMINI.md` | Clima, edital 23/2026, Vercel do upstream, fluxo pessoal do autor | reescrita no E5 |
| `.maestri/`, `docs/AGENT-WORKFLOW.md`, `docs/oracle-ci-logs-unslop.md` | fluxo pessoal do autor original | removidos no E5 |
| `scripts/legacy-tools/*` | geradores do Clima (Python/Apps Script, A4, CEILING) | removidos no E5 (ver D9) |
| `tests/e2e/frequency.spec.ts:9,488,683-778` | GAT Mangaba, Forms do Clima | novo domínio |
| `scripts/verify-ui.mjs:66,185,514-570` | idem, regra CEILING | novo domínio + testes de CH e migração |

## Modelo em branco

`public/templates/pet-sd-registro-de-frequencia-modelo-em-branco.docx` foi gerado
do `.docx` oficial com `scripts/gerar-modelo-em-branco.py` (python-docx): limpa
nome, GAT, perfil marcado, mês, total e todas as linhas de atividade (ficam 12
linhas vazias) e remove do pacote `customXML/` (ID do documento no Google Docs) e
`docProps/custom.xml` (ID do Grammarly). Conferência feita com `unzip` + `grep`
por nome, atividades, descrições, datas, locais e total: nenhuma ocorrência. O PDF
em branco ao lado foi exportado pelo Word a partir desse `.docx`.

## Decisões

- **D1 — GATs.** A lista completa dos 13 GATs está no projeto institucional; uso
  número, título e eixos. Os nomes de coordenadores não entram no repositório.
- **D2 — Modalidades.** Padrão = as duas do modelo preenchido
  ("Interação em tempo real (Síncrona)" e "Assíncrona"), configuráveis em
  `program.ts`. As instruções do modelo falam em "Presencial/Remota" (ver Divergências).
  *Atualizado em 18/11/2026:* entrou "Interação em tempo real (In Loco)" (lista:
  In Loco, Síncrona, Assíncrona; padrão do formulário: Síncrona). Nomes antigos
  passam a ser mapeados por nome: "Síncrona presencial" → In Loco.
- **D3 — Google Forms do Clima.** O pré-preenchimento (`form-report.ts` e
  `ActivityReportModal.tsx`) depende dos IDs de campo, das opções e até dos nomes
  de autorizadores do formulário do Clima. Não serve ao PET-SD e mantê-lo desligado
  deixaria código morto com dados de terceiros. Decisão: remover a integração e
  deixar dois links opcionais na config (`activityForm`, `feedbackForm`); vazio
  esconde o botão. Cópias antigas (versão 1.2) com `formReport` continuam
  restaurando: o campo é ignorado.
- **D4 — CH exata.** `CH = fim − início` em minutos, sem arredondamento. Totais
  somados em minutos (inteiros) para não acumular erro de ponto flutuante. O campo
  `hours` continua no registro (em horas decimais) por compatibilidade.
- **D5 — Total do mês.** "N horas" quando inteiro; "NhMM" quando há minutos (ex.: `33h30`).
- **D6 — Prazo.** O rodapé da folha reproduz o texto do modelo (1º dia útil). O
  prazo exibido no app vem da config; padrão = dia 19 (informado pelo Brunno em
  16/11/2026 como prazo de correção dos coordenadores). *Atualizado em 18/11/2026:*
  dia 19 é o prazo em uso; o `TODO` do prazo saiu da config.
- **D7 — Cabeçalho.** A folha usa a faixa de logomarcas do próprio modelo, recortada
  como o Word recorta (`srcRect`). A faixa inclui SES/Governo de Goiás (ver Divergências).
- **D8 — Logo do app.** Sem arquivo separado do logo PET-SD, uso selo textual
  "PET-SD" provisório com `TODO(pet-sd)`. *Resolvido em 18/11/2026: logo
  oficial recortado por `scripts/brand/gerar-marca.py`; ver
  [design-pet-sd.md](design-pet-sd.md).*
- **D9 — Remoções.** Arquivos do Clima e do fluxo pessoal do autor original saem
  com `git rm` (recuperáveis pelo histórico do git): imagens e manual de identidade
  do Clima, 7 modelos em `public/templates/`, `src/lib/form-report.ts`,
  `src/components/ActivityReportModal.tsx`, `src/app/favicon.ico` (trocado por
  `icon.svg`), `docs/validation/` antigos, `.maestri/`, `docs/AGENT-WORKFLOW.md`,
  `docs/oracle-ci-logs-unslop.md`, `docs/ui-ux-restructure-plan.md` (plano do autor
  original com caminhos locais dele e links para evidências removidas) e
  `scripts/legacy-tools/` (geradores do Clima em A4 com a regra CEILING − FLOOR).
- **D15 — Menções ao programa anterior que ficam.** Créditos do README; este
  registro (inventário do que mudou); e as fixtures de teste do perfil-exemplo
  antigo, que precisam dos valores originais para reproduzir o fingerprint usado
  na migração. Os testes também garantem que a interface não mostra "Clima".
- **D11 — Migração v2→v3.** Perfis e atividades são copiados uma vez para as
  chaves `_v3` (perfil antigo → perfil da ficha; modalidade antiga → modalidade
  nova; `local` e `descricao` vazios; CH recalculada pela regra exata). As chaves
  `_v2` ficam intactas. GATs, perfis e modelos personalizados no `_v2` eram do
  programa anterior e não são copiados. Os perfis de exemplo da versão original
  só são copiados se tiverem sido usados.
- **D12 — Cópia de segurança 1.3.** Leva `local` e `descricao`. Cópias 1.0–1.2
  restauram com esses campos vazios; o `formReport` das 1.2 é ignorado.
- **D13 — Campos.** "Atividade desenvolvida" é obrigatória (campo `description`);
  "Unidade/Local" e "Descrição" são opcionais. Rótulos "Início/Fim" como na ficha.
- **D14 — GATs.** Rótulo curto criado a partir do título do projeto para caber no
  seletor; título completo em `description`. Editáveis no painel local.
- **D10 — Vigência.** Meses selecionáveis de ago/2025 a ago/2027 (cronograma do
  GAT; o edital fala em 24 meses a partir do início).

## Dúvidas para o Brunno

1. Há um arquivo separado do **logo do PET-SD** (PNG/SVG) para favicon e avatar? Se
   não houver, posso recortar a marca da faixa do cabeçalho da ficha (resolução baixa,
   ~290×115 px)?
2. **Prazo exibido no app**: dia 19 (seu CLAUDE.md), dia 25 (regimento) ou 1º dia útil
   (rodapé da ficha)? E o dia 19/25 é do mês da atividade ou do mês seguinte?
3. **Instituições**: você indicou MS, UFG e SMS Goiânia (sem SES Goiás), mas a faixa
   de logos da ficha e o projeto institucional incluem SES Goiás (e o projeto, SMS da
   Cidade de Goiás). Mantenho a faixa do modelo como está e o texto só com MS/UFG/SMS?
4. **Modalidades**: as duas do modelo preenchido ("Interação em tempo real (Síncrona)",
   "Assíncrona") ou "Presencial/Remota" das instruções? Alguma terceira para in loco?
5. Existe **Google Forms do PET-SD** para relatório de atividades ou avaliação? Se sim,
   os links entram em `src/config/program.ts`.
6. Posso mostrar no app o e-mail institucional do regimento (`petsaudedigital.prograd@ufg.br`,
   citado para desligamentos)? Por padrão ficou só na config, sem aparecer na tela.
7. Formato do total com minutos: `33h30` está bom, ou prefere `33,5 horas`?

## Divergências entre fontes

| Tema | Fonte A | Fonte B | Tratamento |
|---|---|---|---|
| Prazo de entrega | rodapé da ficha: 1º dia útil do mês posterior | regimento: dia 25; CLAUDE.md da pasta: dia 19 | rodapé igual ao modelo; prazo do app: dia 19 (em uso desde 16/11/2026) |
| Modalidades | ficha preenchida: "Interação em tempo real (Síncrona)" / "Assíncrona" | instruções da ficha: "Presencial/Remota"; regimento: in loco / síncronas / assíncronas | ficha preenchida + "Interação em tempo real (In Loco)" (18/11/2026); lista configurável |
| Instituições | pedido do Brunno: MS, UFG, SMS Goiânia | faixa de logos da ficha: + SES/Governo de Goiás; projeto: + SES e SMS Cidade de Goiás; regimento: + Ministério da Educação | faixa do modelo intacta; texto do app com MS, UFG e SMS Goiânia |
| Frequência mínima | regimento: "100% (setenta e cinco por cento)" | — | não usada no app; registrada |
| Carga | regimento: 32 h/mês | edital: 8 h semanais | meta mensal de 32 h; nota de 8 h/semana |

## Relatório final

### a) O que foi feito, por épico

| Épico | Commit | Resumo |
|---|---|---|
| E0 | `4351a21` | linha de base (tudo verde), inventário, extração das fontes, perguntas |
| E1 | `4872d4c` | `src/config/program.ts`; marca, ícone, rodapé, FAQ e textos lendo da config; faixa de logos da ficha; remoção do Forms do Clima e das imagens do Clima |
| E2 | `ff366a6` | CH exata em minutos; campos Unidade/Local e Descrição; 13 GATs, 5 perfis, 2 modalidades e 7 modelos genéricos; chaves `_v3` com migração do `_v2`; cópia 1.3 |
| E3 | `6a8c194` | `OfficialSheet` no modelo PET-SD (Carta paisagem, faixa repetida, 8 colunas, total, nota, assinaturas, instruções); modelo em branco .docx/.pdf gerado do oficial; e2e atualizado |
| E4 | `401615b` | script de capturas, validação visual em `docs/validation/pet-sd-20261117/`, ajuste para o modelo em branco caber em 2 páginas |
| E5 | `911a9e5` | README, AGENTS, GEMINI, CONTRIBUTING, docs e ADR reescritos; remoção do fluxo pessoal do autor original e dos scripts legados; LICENSE com o copyright do fork |
| E6 | `af1083a` + este commit | CI completo em clone limpo; correção do teste do seletor de mês no celular; correções da revisão de código; relatório |

### b) Por que das decisões não triviais

- **Config central (ADR 0001).** Um único arquivo com o que identifica o programa
  evita sobras do Clima e facilita outro PET reaproveitar o app. Custo: mais
  conflito ao puxar do upstream.
- **Remover o pré-preenchimento do Forms (D3)** em vez de só escondê-lo: o código
  dependia dos IDs de campo e das opções do formulário do Clima (inclusive nomes
  de pessoas); desligado, seria código morto com dados de terceiros.
- **Somar minutos, não horas (D4).** `1/3 h` não tem representação exata em ponto
  flutuante; somar inteiros garante que três atividades de 20 min deem 1 h.
- **Chaves `_v3` com migração copiando, sem apagar (D11).** Mudaram os campos e os
  nomes de perfis e modalidades; copiar e manter o `_v2` torna a migração
  reversível e segura se algo falhar no meio.
- **Faixa de logos numa tabela externa com `<thead>`.** É o jeito portátil de o
  Chromium repetir um cabeçalho em cada página impressa, como o header do Word.
- **Modelo em branco gerado por script (python-docx)** a partir da ficha oficial,
  para herdar a formatação exata; o script limpa também `customXML` (ID do Google
  Docs) e `docProps/custom.xml` (ID do Grammarly), que não aparecem no Word.
- **Validação em clone limpo** no E6, para provar que o repositório não depende de
  nada que só existe na sua máquina.

### Achados do E6

- **Teste instável que já existia na `main`.** Em clone limpo, o teste "seletor de
  mês … funciona pelo teclado" falhava sempre no projeto mobile (também na `main`,
  3/3). Causa: no celular emulado, o Enter abre a lista nativa do `<select>`, que
  ficava aberta e recebia as teclas da iteração seguinte. O teste agora fecha a
  lista com Escape (8/8 em repetição). Na cópia de trabalho ele passava por acaso
  de tempo. A troca de mês também ficou síncrona sem rascunho pendente (defensivo).
- **Revisão de código somente leitura (Gemini Argon high).** Das alegações, foram
  confirmadas e corrigidas: perfis `_v3` malformados abortavam a migração; o nome do
  GAT do programa anterior vazava para o perfil migrado; atividade só com sufixo de
  modalidade virava texto vazio; a regex de horário aceitava 1 dígito; a folha não
  calculava o total sem a prop. Não alteradas (comportamento herdado do original ou
  fora do fluxo real): restauração não confere se a data está no mês da cópia;
  excluir o último perfil no painel não encerra a sessão; o download alternativo da
  cópia não zera o indicador de alterações.

### c) Como reproduzir e verificar

```bash
git clone https://github.com/nukansec/pet-folha-mensal && cd pet-folha-mensal
git switch feat/adaptacao-pet-sd
npm ci && npx playwright install chromium
npm run lint && npm run test:ui && npm run typecheck && npm run build && npm run test:e2e
git grep -niE "clima|mangaba|araticum" -- ':!package-lock.json'   # só Créditos, este registro e fixtures
npm run dev   # http://localhost:5000 → Primeiro acesso → lançar → Folha oficial → Imprimir
```

### d) Descrição pronta de PR

**Título:** feat: adaptação para o PET-Saúde: Informação e Saúde Digital (PET-SD UFG)

**O quê**
- Dados do programa centralizados em `src/config/program.ts` (13 GATs, 5 perfis da
  ficha, modalidades, meta de 32 h, prazo, links opcionais, textos da folha).
- CH passa a ser a duração exata (`1h30`), somada em minutos.
- Atividades ganham Unidade/Local e Descrição; chaves do navegador sobem para `_v3`
  com migração não destrutiva do `_v2`; cópia de segurança 1.3 (lê 1.0–1.2).
- Folha oficial reescrita como o "Registro de Frequência e Atividades – PET-SD"
  (Carta paisagem); modelo em branco .docx/.pdf gerado do modelo oficial.
- Remove o pré-preenchimento do Forms do Clima, imagens, modelos e documentos do
  programa anterior e do fluxo pessoal do autor original; docs reescritas.

**Por quê**
O fork atende o PET-SD UFG, que tem outra ficha, outra regra de CH e outros GATs.

**Como testar**
`npm ci && npm run lint && npm run test:ui && npm run typecheck && npm run build && npm run test:e2e`;
depois `npm run dev`, criar perfil, lançar atividades (ex.: 16:30–18:00 deve dar
1h30), abrir "Folha oficial" e imprimir em PDF.

**Onde revisar com atenção**
- `src/lib/storage.ts`: `migrateFromV2`, `normalizeActivity`, `inspectUserData`.
- `src/components/OfficialSheet.tsx` e o bloco "Folha oficial PET-SD" em
  `src/app/globals.css`: comparar com o modelo (ver `docs/validation/pet-sd-20261117/`).
- `src/config/program.ts`: textos, prazo e modalidades.
- `public/templates/`: conferir que o modelo em branco não traz dado pessoal.

### e) Dúvidas, divergências e TODO(pet-sd) restantes

- Dúvidas: seção "Dúvidas para o Brunno" acima (7 itens, nenhum respondido até o fim da sessão).
- Divergências: seção "Divergências entre fontes" acima.
- Marcadores `TODO` do PET-SD no código: nenhum desde 18/11/2026. O selo
  textual saiu (logo oficial), o prazo ficou no dia 19, `feedbackForm` aponta
  para o formulário de avaliação do PET-SD e `activityForm` fica vazio de
  propósito (o programa não tem formulário de registro; commit `a38ef77`).
- *Resolvido em 18/11/2026:* a paleta verde herdada foi trocada por branco e
  laranja, derivada do logo ([design-pet-sd.md](design-pet-sd.md)).

### f) Antes de publicar

1. `git push -u origin feat/adaptacao-pet-sd` (só para o `origin`, seu fork; nunca para `upstream`).
2. Abrir PR para a `main` do fork com a descrição acima e conferir o CI verde.
3. Criar o projeto na Vercel a partir do fork e configurar `ADMIN_PIN_HASH` e
   `ADMIN_SESSION_SECRET` (como gerar: `docs/deployment-vercel.md`).
4. Aprovar a identidade visual (selo, cores, faixa de logos) com a coordenação do
   GAT antes de divulgar, como pede o regimento.
5. Responder às dúvidas acima e ajustar `src/config/program.ts`.
