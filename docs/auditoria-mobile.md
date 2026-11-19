# Auditoria de layout no celular (18/11/2026)

Branch `fix/mobile-layout`. Objetivo: nenhum texto cortado, palavra partida no
meio ou rolagem horizontal em 320, 360, 390, 414 e 768 px (retrato) e 740×360
(paisagem), nos temas claro e escuro.

## Como foi feita

- `scripts/auditar-telas.mjs` (Playwright contra `npm run build && npm start`)
  percorre entrada (Continuar, Primeiro acesso, Restaurar cópia e o aviso de
  cópia inválida), painel, visão Semanal, menu do participante, os modais
  (editar atividade, identificação, confirmar exclusão, Concluir, Ajuda,
  Configurações, excluir perfil, aviso de rascunho) e a folha oficial (Minha
  folha e Modelo em branco). Os dados são fictícios: dois perfis e 10 atividades.
- Viewports: 320×640, 360×780, 390×844, 414×896, 768×1024, 740×360, 1440×900 e
  "390 com zoom de 200%", nos temas claro e escuro (o zoom só no claro).
- Checagens por tela: rolagem horizontal; texto cortado (`overflow`
  hidden/clip com conteúdo maior); palavra partida (uma palavra cujo `Range`
  ocupa mais de uma linha); alvo de toque < 44×44; campo com fonte < 16 px;
  modal maior que a viewport ou com o rodapé fora da tela; imagem que não
  carrega; erro no console e resposta HTTP ≥ 400; axe (WCAG 2.2 AA) em 360 e
  1440 px.
- Depois, revisei as capturas à mão, atrás do que a máquina não pega:
  alinhamento, hierarquia, redundância, dois botões primários e estado ativo
  ambíguo.
- Saída: `docs/validation/mobile-20261118/antes/` e `depois/` (`resumo.md`,
  `achados.json`, capturas). No repositório ficam só as capturas de 360 px
  (claro e escuro) e 1440 px (claro); o conjunto completo (~30 MB por rodada)
  é gerado de novo com o script.

Os prints B1–B6 citados no pedido não chegaram à sessão. Os ids B1–B6 seguem a
descrição em texto do pedido, e as capturas do script os confirmaram.

## Achados

Resumo: 26 achados. **Alta**: 3 (B1, B2, B6), os 3 corrigidos. **Média**: 12, dos quais
8 foram corrigidos (B3, B4, B5, A01–A05); os outros 4 (A06, A08, A09, V02) vão para P1 e P2.
**Baixa**: 11, nos PRs propostos (A13 fica como está, por ser intencional).

Gravidade: **alta**, impede ou confunde o uso; **média**, feio ou cansativo;
**baixa**, detalhe. "Grupo" é o PR que resolve: **esta branch**, ou um dos PRs
propostos (P1–P6, em [Propostas de PR](#propostas-de-pr)).

| id | tela | viewport | problema | gravidade | causa provável | grupo |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | Editar atividade | 320–414, 740×360 | Formulário diferente do principal: "Preenchimento rápido" num select com o texto partido letra a letra ("Sele/cion/ar"), subtítulo de 3 linhas, Data e horários em grade 2×2 (a data fica cortada: "03/11/2"), CH numa linha própria e o rodapé só aparece rolando (1110–1274 px numa tela de 640–896). | alta | `src/components/EditActivityModal.tsx:150-370` (formulário próprio, `grid-cols-2`, `FullSelect` com `text-xs`) | esta branch |
| B2 | Primeiro acesso | 320, 360 | Cartões de perfil partem a palavra ("Coordenado/r(a)", "Preceptor(a/)", "Orientador(/a)"); as abas Continuar / Primeiro acesso / Restaurar cópia ficam espremidas; o GAT ocupa 2 linhas. | alta | `src/app/design-pet-sd.css:1422` (`.choice-text { overflow-wrap: anywhere }`), grade de 2 colunas em 320 px; `LandingPage.tsx:334` (GAT sem `singleLine`) | esta branch |
| B3 | Topo do painel | 320–414 | O cartão do perfil chega a 4 linhas (nome em 2 + "Monitor(a) · GAT 01 · Alerta de violências com IA" em 2); "Salvar cópia" e "Restaurar cópia" com 2 linhas ao lado de "Concluir" com 1 (alturas diferentes); o ícone da aba inativa encolhe até sumir. | média | `design-pet-sd.css:985-1031` (`line-clamp: 2` na linha 989, `small` com `white-space: normal`), `.backup-tools { align-items: center }`, `svg` sem `flex-shrink: 0` | esta branch |
| B4 | Resumo do mês | todos | O mês aparece duas vezes (seletor de mês logo acima e "Novembro/2026" no resumo); no celular, "Mensal \| Semanal" fica colado ao texto de cima. | média | `src/components/StatsGrid.tsx:95` | esta branch |
| B5 | Folha oficial, barra | todos | "Minha folha" ativa em laranja cheio parece um segundo botão primário ao lado de "Imprimir"; "Modelo em branco" não parece botão; downloads com `text-xs`. | média | `src/app/page.tsx:971-1028`, `globals.css:2387` | esta branch |
| B6 | Prévia da folha | 320–768, 740×360 | A faixa de logos não aparece: a folha tem 1050 px e fica dentro de uma moldura `overflow-hidden` da largura da tela, e os logos estão alinhados à direita (`justify-content: flex-end`). A parte direita da folha também fica cortada, sem rolagem. | alta | `src/app/page.tsx:1038-1040` (moldura `overflow-hidden` dentro de `.sheet-stage`), `globals.css:1763` | esta branch |
| A01 | Identificação | 320, 360, 740×360 | Rodapé (Salvar alterações) só aparece rolando o modal. | média | `ProfileModal.tsx:95` (botões no fim da área que rola) | esta branch |
| A02 | Concluir | 320, 740×360 | Rodapé do modal fora da tela até rolar. | média | `ExitModal.tsx:63` | esta branch |
| A03 | Excluir perfil | 320, 740×360 | Rodapé (Excluir perfil) fora da tela até rolar. | média | `DeleteProfileModal.tsx:58` | esta branch |
| A04 | Abas Minha frequência / Folha oficial | todos | Alvo de toque com 41–42 px de altura. | média | `design-pet-sd.css:234` (`min-height: 40px`) | esta branch |
| A05 | Formulário de atividade | zoom 200% | Início e Fim com 29 px de largura: a hora não aparece (coluna da CH fixa em 56 px). | média | `design-pet-sd.css:1097` | esta branch |
| A06 | Entrada, cartões de perfil | 360, 1440 | axe `label-content-name-mismatch`: o botão "Abrir folha de …" mostra perfil, GAT e meses, que não estão no nome acessível (WCAG 2.5.3). | média | `LandingPage.tsx:252-275` | P1 |
| A07 | Entrada e painel | todos | `HTTP 404 /_vercel/insights/script.js` fora da Vercel (servidor local, CI). Na Vercel o script existe. | baixa | `layout.tsx` (`<Analytics />` sempre ativo) | P3 |
| A08 | Entrada | zoom 200% | Rolagem horizontal: os ícones do cabeçalho não quebram linha em 195 px de CSS. | média | `design-pet-sd.css` (`.entry-header-inner` sem `flex-wrap`) | P1 |
| A09 | Configurações | zoom 200% | Conteúdo cortado na largura (240 > 145 px). | média | `AdminModal.tsx:496` | P1 |
| A10 | Lista de atividades | zoom 200% | Cabeçalho da lista ("Atividades do mês · Limpar mês") cortado. | baixa | `ActivityTable.tsx:98` | P1 |
| A11 | Excluir perfil | zoom 200% | Painel 4 px mais largo que a viewport. | baixa | `globals.css:1234` (`.conclusion-panel`) | P1 |
| A12 | Várias | zoom 200% | Palavras partidas em 195 px de CSS ("Mensal", "Assíncrona", "Sobrenome", "violências"). | baixa | `overflow-wrap: anywhere` em `.choice-text`, nomes | P1 |
| A13 | Topo | 768 | Nome e "Monitor(a) · GAT 01 · …" com reticências (texto inteiro no `title`). | baixa | intencional (`design-pet-sd.css:200`) | — |
| A14 | Identificação | 320–390 | GAT com reticências sem o nome completo visível (na entrada, o nome completo agora aparece abaixo). | baixa | `ProfileModal.tsx:137` | P2 |
| V01 | Identificação | 320 | Cabeçalho próprio: título em 2 linhas e botão fechar de 32 px desenhado (área de toque de 44 px só pela regra global). | baixa | `ProfileModal.tsx:98-112` | P2 |
| V02 | Painel | todos | Dois botões primários na mesma tela: "Adicionar atividade" e "Conferir folha". | média | `page.tsx` (`.review-next .primary-button`) | P2 |
| V03 | Topo e menu | todos | "Salvar cópia" aparece no menu do participante e na barra. | baixa | `ParticipantMenu.tsx`, `Navbar.tsx` | P2 |
| V04 | Folha oficial | todos | "Voltar" repete a aba "Minha frequência" logo acima. | baixa | `page.tsx` (barra da folha) | P5 |
| V05 | Prévia da folha | 320–414 | A prévia reduzida (≈ 30%) mostra a folha inteira, mas o texto fica ilegível; ler exige "Ver em tamanho real". | baixa | consequência de B6 | P4 |
| V06 | Modais | todos | Cada modal tem seu cabeçalho e rodapé (classes Tailwind diferentes); só "Editar atividade" usa o painel em três partes. | baixa | `ConfirmModal.tsx`, `DialogContext.tsx`, `ExitModal.tsx`, `ProfileModal.tsx` | P2 |

Sem achados: campos com fonte < 16 px, imagens quebradas e erros de
JavaScript no console. O axe só apontou A06.

### Caixa alta do nome (B3)

Investiguei. O topo não tem `text-transform` nem normalização do nome
(`ParticipantMenu.tsx` exibe `user.name`; `normalizeName` em
`src/lib/storage.ts:97` só serve para detectar duplicados e não altera o que é
gravado nem o que é exibido). A única caixa alta está na **folha oficial**
(`OfficialSheet.tsx:95`, `toLocaleUpperCase`), por decisão anterior e coberta
por `scripts/verify-ui.mjs`. O teste B3 cria o perfil "maria Fictícia DA silva…"
e confere que o topo mostra o nome exatamente como foi digitado. Se o print
mostrava o topo em caixa alta, o mais provável é que o nome tenha sido digitado
assim ou venha de uma cópia restaurada (ver Perguntas).

## Decisões

Ambiguidades resolvidas pela opção mais simples:

1. **CSS das correções num arquivo próprio** (`src/app/mobile.css`, carregado
   depois de `design-pet-sd.css`). A revisão fica num lugar só, e as regras
   antigas não precisam ser reescritas.
2. **B1, componente compartilhado** `ActivityFields`: os mesmos campos no
   formulário e no modal. O modal mantém os avisos em diálogo (`alert`) e o
   formulário mantém o erro em linha, como já faziam. A data passa a ficar
   limitada ao mês da folha também no modal (`min`/`max`). O `showPicker` ao
   clicar saiu, porque o formulário principal não o usa.
3. **B1, painel em três partes** (`.dialog-panel`): cabeçalho e rodapé fixos,
   só o meio rola. Os demais modais ganharam rodapé que gruda no pé da área que
   rola (`position: sticky`), sem mudar o markup (a migração completa é o P2).
4. **B2, abas da entrada**: rótulo curto só em "Restaurar cópia" → "Restaurar"
   (< 480 px), com `aria-label="Restaurar cópia"` (o texto visível continua
   contido no nome acessível, WCAG 2.5.3). "Primeiro acesso" pode quebrar em
   2 linhas entre palavras: trocar por um rótulo curto ("Novo") criaria nome
   acessível diferente do texto visível.
5. **B2, cartões de perfil**: uma coluna abaixo de 360 px; acima disso, 2
   colunas sem partir palavra.
6. **B3, ações do topo**: ficam as três na barra (Salvar / Restaurar /
   Concluir), mesma altura, rótulos curtos < 480 px com `aria-label` completo.
   Mover Salvar e Restaurar para o menu mudaria o fluxo já testado do menu e
   esconderia a cópia de segurança, que é a principal proteção dos dados.
7. **B3, cartão do perfil**: no celular (< 768 px), nome numa linha e
   "Perfil · GAT nn" na outra, com reticências e texto inteiro no `title`. O
   tema do GAT aparece no topo do menu e, no desktop, continua na segunda linha.
8. **Abas abaixo de 360 px sem ícone**: em 320 px, "Minha frequência" e "Folha
   oficial" com ícone não cabem; o rótulo tem prioridade. Acima disso, o ícone
   tem 18 px fixos e `flex-shrink: 0`.
9. **B5**: a opção ativa usa fundo suave, borda e peso da marca (como os outros
   grupos de opção do app), e não laranja cheio; o único primário é "Imprimir /
   salvar PDF". "Voltar" e os downloads são secundários.
10. **B6, prévia escalada** (`SheetPreview`): `transform: scale` calculado
    pela largura do container (ResizeObserver), com a altura reservada pela
    escala. "Ver em tamanho real" volta à escala 1 com rolagem horizontal na
    área da prévia, sem rolar a página. A impressão usa a cópia em
    `.print-only-wrapper`, que não passa pela prévia; o teste B6 confere
    `transform: none` na impressão e as 2 páginas do PDF.
11. **Zoom de 200% em 390 px** emulado como viewport de 195 px de CSS com
    `deviceScaleFactor` 2, o mesmo que o zoom do navegador faz. Os achados só
    nesse modo (A08–A12) ficam para o P1, exceto A05, que tem a mesma causa de B1 e foi corrigido aqui: o critério de sucesso desta branch são
    as larguras listadas acima.
12. **Capturas versionadas**: só 360 px (claro e escuro) e 1440 px (claro), em
    `antes/` e `depois/`. O resto é ignorado pelo `.gitignore` da pasta e pode
    ser gerado de novo.
13. **Branch** `fix/mobile-layout` reapontada para `fix/next-16-4-6` (pedido do
    mantenedor): a auditoria e as correções rodam sobre o Next 16.4.6.

## Perguntas

Segui sem esperar resposta; cada item diz o que assumi.

1. Os prints B1–B6 não chegaram. Se algum mostrava algo além do descrito no
   pedido, me mande de novo. Assumi a descrição em texto.
2. Caixa alta no topo: o print era de um perfil digitado em maiúsculas ou
   restaurado de cópia? Assumi que sim; o app não converte o nome na tela.
3. A folha oficial continua com o nome em caixa alta (decisão anterior). Fica
   assim? Assumi que sim.
4. No celular, "Restaurar cópia" virou "Restaurar" (topo e entrada). O rótulo
   serve? Assumi que sim.
5. Capturas no repositório só em 360 px e 1440 px, para não pesar ~60 MB. Serve?
   Assumi que sim.

## Antes × depois

`scripts/auditar-telas.mjs` rodado de novo sobre a branch final
(`docs/validation/mobile-20261118/depois/`). Achados únicos (checagem +
seletor + viewport); "celular" = 320, 360, 390, 414, 768 e 740×360, claro e
escuro.

| checagem | antes (celular) | depois (celular) | antes (1440) | depois (1440) | antes (zoom 200%) | depois (zoom 200%) |
| --- | --- | --- | --- | --- | --- | --- |
| rolagem-horizontal | 0 | 0 | 0 | 0 | 1 | 1 |
| texto-cortado | 6 | 0 | 0 | 0 | 3 | 2 |
| palavra-partida | 4 | 0 | 0 | 0 | 7 | 0 |
| alvo-pequeno | 6 | 0 | 1 | 0 | 4 | 1 |
| modal-rodape-fora-da-tela | 12 | 0 | 0 | 0 | 5 | 0 |
| modal-mais-largo | 0 | 0 | 0 | 0 | 1 | 1 |
| axe:label-content-name-mismatch | 2 | 2 | 2 | 2 | 0 | 0 |
| erro-console (404 do Analytics) | 6 | 6 | 1 | 1 | 1 | 1 |
| reticencias-com-title (intencional) | 5 | 9 | 0 | 0 | 1 | 3 |
| logos-folha | 0 | 0 | 0 | 0 | 0 | 1 |
| **total** | **41** | **17** | **4** | **3** | **23** | **10** |

Leitura:

- **Celular**: nenhuma rolagem horizontal, texto cortado, palavra partida,
  alvo pequeno ou modal fora da tela. O que sobra é A06 (axe, P1), A07 (404 do
  Analytics fora da Vercel, P3) e reticências intencionais com o texto inteiro
  no `title`. As reticências aumentaram porque o nome e o GAT passaram a ficar
  numa linha (B2, B3).
- **Zoom de 200%**: sobram A08 (cabeçalho da entrada), A09 (Configurações),
  A10 (lista), A11 (excluir perfil) e as abas da entrada com 34 px de largura,
  todos anteriores e propostos no P1. Em 195 px de CSS, a prévia da folha fica
  com os logos de 6 px de altura (V05, P4). Na primeira rodada "depois", as
  larguras mínimas novas alargavam a página nesse modo; o commit `be60f85`
  corrigiu isso.
- O "texto cortado" da prévia escalada (`.sheet-fit`) é recorte proposital; o
  script e os testes o ignoram (`d04f671`).

## Corrigido nesta branch

| ids | commit |
| --- | --- |
| auditoria (E0) | `c39bd06` test: auditoria de telas no celular |
| B1, A01, A02, A03, A05 | `63449ad` fix(ui): editar atividade com os mesmos campos do formulário (B1) |
| B2 | `7e433c9` fix(ui): entrada sem cortar nem partir palavras no celular (B2) |
| B3, A04 | `3fc0476` fix(ui): topo do painel em duas linhas e ações da mesma altura (B3) |
| B4 | `b4d8bee` fix(ui): resumo sem mês repetido (B4) |
| B5, B6 | `4e008cd` fix(ui): barra e prévia da folha oficial no celular (B5, B6) |
| testes B1–B6 | `10bec27` test: layout no celular e no desktop e um teste por bug (B1–B6) |
| B1 (rodapé em 320–360 px, achado na rodada "depois") | `88c75aa` fix(ui): Cancelar e Salvar numa linha no rodapé do modal de edição |
| B3 (fonte de Concluir, achado na rodada "depois") | `bde6c58` fix(ui): mesma fonte em Salvar, Restaurar e Concluir no celular |
| regressão no zoom de 200% | `be60f85` fix(ui): telas muito estreitas sem rolagem lateral (zoom de 200%) |
| script | `d04f671` test: auditoria refaz um viewport e ignora o recorte da prévia escalada |

Base: `f48b15f` fix: atualiza Next para 16.4.6 (vulnerabilidade crítica), na
branch `fix/next-16-4-6`.

Testes permanentes em `tests/e2e/mobile-layout.spec.ts` (projeto `desktop`,
viewports fixados): sem rolagem horizontal, texto cortado, palavra partida,
alvo < 44 px e modal fora da viewport, em 360 e 1440 px, na entrada, no
painel, no menu, nos modais e na folha; um teste para cada bug de B1 a B6. O
de B6 inclui a regressão da impressão: prévia oculta, `transform: none` na
folha impressa, logos com altura e 2 páginas no PDF.

## Propostas de PR

Achados que não são de layout no celular (ou que só aparecem com zoom de
200%), agrupados em PRs pequenos e independentes, **em ordem de prioridade**.
Nenhum foi implementado nesta branch.

### P1 — `fix(a11y): nome acessível dos cartões de perfil e reflow com zoom de 200%`

- **Problema**: o axe aponta `label-content-name-mismatch` nos cartões da
  entrada; com zoom de 200% (195 px de CSS) há rolagem horizontal na entrada e
  conteúdo cortado em Configurações, na lista e no modal de excluir perfil.
- **Achados**: A06, A08, A09, A10, A11, A12.
- **Arquivos prováveis**: `src/components/LandingPage.tsx` (botão "Abrir
  folha de …": nome por `aria-labelledby` no nome do perfil e detalhes em
  `aria-describedby`, sem `aria-label`), `src/app/design-pet-sd.css`
  (`.entry-header-inner` com `flex-wrap`), `src/components/AdminModal.tsx`,
  `src/components/ActivityTable.tsx`, `src/app/globals.css`
  (`.conclusion-panel`), `src/app/mobile.css`.
- **Riscos**: mudar o nome acessível quebra seletores de teste ("Abrir folha
  de …") e muda o que o leitor de tela anuncia; revisar com NVDA e TalkBack.
- **Como testar**: `scripts/auditar-telas.mjs` sem achados no viewport
  `390-zoom200`; axe sem violações em 360 e 1440 px; caso e2e novo em 195 px
  com `deviceScaleFactor` 2.
- **Tamanho**: M.

```text
Objetivo: corrigir o nome acessível dos cartões de perfil da entrada e o
reflow com zoom de 200% (achados A06 e A08–A12 de docs/auditoria-mobile.md).
Itens: (1) botão "Abrir folha de …" sem aria-label: nome = nome do perfil
(aria-labelledby) e detalhes em aria-describedby; (2) cabeçalho da entrada
quebra linha em 195 px; (3) Configurações, lista de atividades e modal de
excluir perfil sem corte em 195 px; (4) nenhuma palavra partida em 195 px.
Testes: auditar-telas.mjs sem achados em 390-zoom200; axe zerado; e2e novo em
195 px com deviceScaleFactor 2; atualizar seletores que usam "Abrir folha de".
Fechamento: lint, test:ui, test:contrast, typecheck, build e test:e2e;
branch fix/a11y-reflow; commits fix(a11y): …; sem push.
```

### P2 — `refactor(ui): modais no mesmo painel e um botão primário por tela`

- **Problema**: cada modal tem cabeçalho e rodapé próprios (Tailwind solto);
  só "Editar atividade" usa o painel em três partes. O painel tem dois botões
  primários ("Adicionar atividade" e "Conferir folha"); "Salvar cópia" aparece
  no menu e na barra; no modal de identificação, o GAT com reticências não
  mostra o nome completo.
- **Achados**: V01, V02, V03, V06, A14.
- **Arquivos prováveis**: novo `src/components/DialogPanel.tsx` (cabeçalho,
  corpo e rodapé), `ProfileModal.tsx`, `ConfirmModal.tsx`,
  `src/context/DialogContext.tsx`, `ExitModal.tsx`, `DeleteProfileModal.tsx`,
  `EditActivityModal.tsx`, `src/app/page.tsx` (`.review-next`) e
  `src/app/mobile.css` (sai o rodapé `sticky` genérico).
- **Riscos**: foco inicial e devolução de foco nos diálogos (testes de teclado
  em `frequency.spec.ts` e `perfis.spec.ts`); os testes acham botões como
  "Sim, excluir" e "Entendido" pelo nome.
- **Como testar**: e2e existentes; `layoutProblems` de
  `tests/e2e/mobile-layout.spec.ts` em todos os modais; um teste que conta
  `.primary-button:visible` por tela.
- **Tamanho**: G (pode sair em dois: modais; botões e redundância).

```text
Objetivo: um só componente de painel para todos os modais e um botão primário
por tela (achados V01, V02, V03, V06 e A14 de docs/auditoria-mobile.md).
Itens: (1) DialogPanel com cabeçalho de uma linha, fechar de 44 px, corpo que
rola e rodapé fixo, a partir do .dialog-panel de EditActivityModal; (2) migrar
ProfileModal, ConfirmModal, DialogContext, ExitModal e DeleteProfileModal;
(3) "Conferir folha" como secundário; (4) decidir se "Salvar cópia" fica só na
barra; (5) nome completo do GAT abaixo do campo no modal de identificação.
Testes: e2e existentes (foco e teclado); layoutProblems em todos os modais em
360 e 1440 px; contagem de .primary-button visível por tela.
Fechamento: CI completo; branch refactor/dialog-panel; commits refactor(ui):
e fix(ui): …; sem push.
```

### P3 — `perf: Analytics só na Vercel e imagens da marca menores`

- **Problema**: fora da Vercel (servidor local, CI), o `<Analytics />` pede
  `/_vercel/insights/script.js` e recebe 404. As imagens da marca são PNGs de
  122 a 147 KB (`cabecalho-ficha.png`, `marca-completa.png`,
  `compartilhamento.png`).
- **Achados**: A07 e revisão de peso (sem achado automático).
- **Arquivos prováveis**: `src/app/layout.tsx` (`<Analytics />` só com
  `process.env.VERCEL`), `public/images/pet-sd/*` e `scripts/brand/` (versões
  otimizadas sem mudar cores nem proporções).
- **Riscos**: a faixa de logos tem de continuar nítida na impressão (manter 2×
  a altura impressa de 12 mm); regra de identidade visual em
  `src/components/Brand.tsx`.
- **Como testar**: `auditar-telas.mjs` sem `erro-console`; comparar o PDF da
  folha antes e depois; Lighthouse no celular.
- **Tamanho**: P.

```text
Objetivo: tirar o 404 do Analytics fora da Vercel e reduzir o peso das imagens
da marca (achado A07 de docs/auditoria-mobile.md).
Itens: (1) <Analytics /> só quando process.env.VERCEL estiver definido;
(2) PNGs da marca otimizados (mesmas dimensões e cores, sem redesenhar),
gerados por scripts/brand; (3) conferir a faixa de logos no PDF impresso.
Testes: auditar-telas.mjs sem erro-console; e2e de impressão; comparação
visual do PDF da folha.
Fechamento: CI completo; branch perf/analytics-imagens; commits perf: …;
sem push.
```

### P4 — `test(print): regressão visual da folha impressa e leitura da prévia`

- **Problema**: a impressão é protegida por testes de conteúdo e de contagem
  de páginas, não por comparação visual. No celular, a prévia reduzida (≈ 30%)
  mostra a folha inteira, mas o texto só fica legível em "Ver em tamanho real".
- **Achados**: V05 e a regressão do B6.
- **Arquivos prováveis**: `tests/e2e/frequency.spec.ts` (captura da página
  impressa com `toHaveScreenshot` em mídia print, com fonte fixa) e
  `src/components/SheetPreview.tsx` (zoom por pinça na prévia ou botão "Abrir
  PDF" no celular).
- **Riscos**: as capturas de referência variam com as fontes do sistema (falta
  a Times New Roman no Linux do CI); fixar a fonte nos testes ou rodar só no
  desktop do CI.
- **Como testar**: `npx playwright test --update-snapshots` uma vez e revisão
  das imagens de referência.
- **Tamanho**: M.

```text
Objetivo: proteger a folha impressa com regressão visual e melhorar a leitura
da prévia no celular (achado V05 de docs/auditoria-mobile.md).
Itens: (1) toHaveScreenshot da folha em mídia print (1ª página e instruções),
com fonte fixa; (2) prévia: zoom por pinça ou botão "Abrir PDF" no celular,
sem afetar a impressão.
Testes: snapshots revisados; e2e B6 de mobile-layout.spec.ts continua verde.
Fechamento: CI completo; branch test/print-visual; commits test(print): …;
sem push.
```

### P5 — `fix(ui): textos e microcopy das telas`

- **Problema**: "Voltar" repete a aba "Minha frequência"; o mesmo campo se
  chama "GAT" na entrada e "Grupo tutorial (GAT)" no modal; a nota "100% no
  navegador" do modal de identificação usa `text-xs`; "Prévia reduzida a N%"
  pode virar só "Prévia reduzida".
- **Achados**: V04 e revisão de textos (sem achado automático).
- **Arquivos prováveis**: `src/app/page.tsx`, `ProfileModal.tsx`,
  `SheetPreview.tsx` e `src/config/program.ts` (textos do programa ficam lá,
  ADR 0001).
- **Riscos**: os testes acham elementos pelo texto.
- **Como testar**: e2e; revisão das capturas de 360 px.
- **Tamanho**: P.

```text
Objetivo: alinhar textos e microcopy (achado V04 de docs/auditoria-mobile.md).
Itens: (1) remover ou renomear "Voltar" na barra da folha; (2) um só nome para
o campo GAT; (3) notas com 14 px no mínimo; (4) texto da barra da prévia.
Testes: e2e (atualizar seletores de texto); capturas em 360 px.
Fechamento: CI completo; branch fix/microcopy; commits fix(ui): …; sem push.
```

### P6 — `test: robustez de cópia, restauração e comprovantes grandes`

- **Problema**: a auditoria só cobriu o aviso de cópia inválida. Não há teste
  de restauração com comprovantes perto do limite (20 MB por arquivo, 40 MB e
  30 páginas no total), nem do aviso de cota do navegador em 320 px.
- **Achados**: nenhum (prevenção).
- **Arquivos prováveis**: `tests/e2e/compat.spec.ts`,
  `src/lib/attachment-backup.ts`, `src/lib/attachments.ts` e
  `scripts/auditar-telas.mjs` (estado de cota estourada).
- **Riscos**: fixtures grandes deixam o CI lento; gerar os arquivos no teste.
- **Como testar**: e2e com comprovantes sintéticos gerados em memória.
- **Tamanho**: M.

```text
Objetivo: cobrir cópia, restauração e comprovantes grandes com testes, sem
mudar o formato salvo (docs/auditoria-mobile.md, P6).
Itens: (1) restaurar cópia com comprovantes perto dos limites; (2) aviso de
cota excedida em 320 px, sem corte; (3) cópia com acentos e nomes longos.
Testes: e2e com arquivos sintéticos gerados no teste; auditar-telas.mjs com o
estado de cota.
Fechamento: CI completo; branch test/robustez-dados; commits test: …; sem push.
```

## Como verificar no próprio celular

1. Abra o deploy de prévia da Vercel deste PR no celular (ou `npm run build &&
   npm start` e acesse `http://<IP-do-computador>:5000` na mesma rede).
2. **Primeiro acesso**: os perfis aparecem inteiros ("Coordenador(a)" numa
   linha); o GAT fica numa linha, com o nome completo embaixo.
3. Crie um perfil fictício e confira o **topo**: nome numa linha, "Perfil · GAT
   nn" na outra; Salvar / Restaurar / Concluir do mesmo tamanho; o tema do GAT
   aparece ao abrir o menu do participante.
4. Adicione uma atividade e toque em **Editar**: mesmas pílulas e opções do
   formulário, Data numa linha, Início | Fim | CH na mesma linha, e Cancelar e
   Salvar sempre visíveis no pé.
5. **Resumo**: o mês aparece só no seletor; Mensal | Semanal com toque fácil.
6. **Folha oficial**: Minha folha | Modelo em branco como opções; um só botão
   laranja (Imprimir / salvar PDF); a prévia mostra a folha inteira, com a
   faixa de logos; "Ver em tamanho real" permite rolar para os lados.
7. Imprima ou salve o PDF: Carta paisagem, igual a antes.
8. Repita com o celular deitado e no tema escuro.

## Descrição do PR

```markdown
## fix(ui): layout no celular (auditoria B1–B6)

Auditoria de todas as telas no celular (320 a 768 px, paisagem 740×360, claro e escuro) e correção dos problemas de layout. Achados, decisões e propostas de PR em `docs/auditoria-mobile.md`.

### O que muda
- **B1 Editar atividade**: o modal usa os mesmos campos do formulário (`ActivityFields`): pílulas de preenchimento rápido, modalidade em grupo, Data em linha inteira e Início | Fim | CH na mesma linha. O cabeçalho fica numa linha e o rodapé é fixo.
- **B2 Primeiro acesso**: nenhuma palavra partida ("Coordenador(a)"); cartões de perfil em uma coluna abaixo de 360 px; "Restaurar" como rótulo curto; GAT numa linha, com o nome completo embaixo.
- **B3 Topo**: cartão do perfil em 2 linhas; Salvar / Restaurar / Concluir com a mesma altura e a mesma fonte; abas com 44 px. O nome aparece como foi digitado (não há caixa alta na tela).
- **B4 Resumo**: sem o mês repetido.
- **B5 Folha oficial**: controle segmentado claro; Imprimir / salvar PDF é o único botão primário.
- **B6 Prévia**: a faixa de logos sumia porque uma moldura com `overflow-hidden` cortava a folha de 1050 px. A prévia agora é escalada pela largura do container, com a opção "Ver em tamanho real". A impressão não muda.
- Modais: rodapé visível sem rolar em 320 px e na paisagem.

### Fora deste PR
Seis PRs propostos (acessibilidade e zoom de 200%, painel único de modal, Analytics e imagens, regressão visual da impressão, microcopy, robustez de dados), com prompt pronto em `docs/auditoria-mobile.md`.

### Como testar
- `npm run lint && npm run test:ui && npm run test:contrast && npm run typecheck && npm run build && npm run test:e2e`
- `node scripts/auditar-telas.mjs http://127.0.0.1:5000 <pasta>` com `npm start` rodando
- Roteiro manual no celular em `docs/auditoria-mobile.md`

### Dados
Nada muda no formato salvo (`localStorage` `_v3` e IndexedDB). Capturas e testes só com dados fictícios.

Depende de #<PR do Next 16.4.6> (branch `fix/next-16-4-6`).
```
