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
- Saída: `docs/validation/mobile-20261118/antes/` (`resumo.md`,
  `achados.json`, capturas). No repositório ficam só as capturas de 360 px
  (claro e escuro) e 1440 px (claro); o conjunto completo (~30 MB por rodada)
  é gerado de novo com o script.

Os prints B1–B6 citados no pedido não chegaram à sessão. Os ids B1–B6 seguem a
descrição em texto do pedido, e as capturas do script os confirmaram.

## Achados

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
| A07 | Entrada e painel | todos | `HTTP 404 /_vercel/insights/script.js` fora da Vercel (servidor local, CI). Na Vercel o script existe. | baixa | `layout.tsx` (`<Analytics />` sempre ativo) | P4 |
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
| V04 | Folha oficial | todos | "Voltar" repete a aba "Minha frequência" logo acima. | baixa | `page.tsx` (barra da folha) | P3 |
| V05 | Prévia da folha | 320–414 | A prévia reduzida (≈ 30%) mostra a folha inteira, mas o texto fica ilegível; ler exige "Ver em tamanho real". | baixa | consequência de B6 | P5 |
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

## Propostas de PR

Em preparação (épico E2).
