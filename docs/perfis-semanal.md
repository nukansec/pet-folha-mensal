# Perfis, menu do participante, seletores e visão semanal (18/11/2026)

Branch `feat/perfis-semanal`. Registro do diagnóstico, das decisões, do
progresso por épico e do relatório final.

## Progresso

| Épico | Status | Commits | Como verificar | Pendências |
| --- | --- | --- | --- | --- |
| E0 Reconhecimento | feito | `docs: diagnóstico de perfis e visão semanal` | este arquivo; `docs/validation/perfis-20261118/antes/` | — |
| E1 Créditos | feito | `docs: autoria da versão PET-SD nos créditos` | rodapé (entrada e painel); README › Créditos; `test:ui` "botão Avaliar o site…" | — |
| E2 Menu do participante | feito | `feat(ui): menu do participante no topo` | clique no cartão do topo; `tests/e2e/perfis.spec.ts` › "menu do participante" | — |
| E3 Gerenciar perfis | feito | `feat: editar e excluir perfis na entrada` | entrada › Continuar; `test:ui` (resumo, exclusão, edição, cópia 1.4); `perfis.spec.ts` › "gerenciar perfis na entrada" | — |
| E4 Seletores | feito | `feat(ui): seletores em grupos de opção` | formulário, modal de edição, primeiro acesso, modal de identificação; `perfis.spec.ts` › "seletores em grupos de opção"; `frequency.spec.ts` › "modelos rápidos…" | — |

## E0 — Diagnóstico

### Linha de base do CI (main 269f816)

- `lint`, `typecheck`, `test:ui`, `test:contrast` e `build`: passam.
- `test:e2e`: 37 de 38 na primeira rodada. Falhou
  `[mobile] avaliação do site abre o formulário…` por tempo esgotado em
  `getByLabel('Nome completo')`. Rodado de novo isolado (`--repeat-each 2`):
  4/4 passam. Teste instável sob o servidor de desenvolvimento, não regressão.

### Capturas "antes"

`docs/validation/perfis-20261118/antes/`, geradas por
`scripts/capturar-perfis.mjs … antes` (entrada "Continuar" e "Primeiro
acesso", painel, resumo mensal, formulário, modal de identificação; 1440 e
390 px; claro e escuro) e `scripts/capturar-vidal-semanal.mjs` (app original,
perfil fictício e exemplos do próprio app: `vidal-mensal-*`, `vidal-semanal-*`).

O app original mostra as faixas "Dia 1, 2 a 8, 9 a 15, 16 a 22, 23 a 29,
Dia 30" (novembro/2026), em duas colunas no desktop e uma no celular, e usa a
mesma meta de 8 h nas faixas parciais ("Dia 1 · 0 de 8 h").

### Como os dados são gravados

| Dado | Onde | Chave |
| --- | --- | --- |
| Perfis | localStorage | `pet_folha_profiles_v3` (lista JSON de `UserProfile`) |
| Perfil ativo | localStorage | `pet_folha_active_profile_id_v3` (id) |
| Atividades | localStorage, uma chave por perfil e mês | `pet_folha_activities_v3_<id>_<AAAA-MM>` |
| Comprovantes | IndexedDB `pet-folha-comprovantes`, store `months` | chave `[id, "AAAA-MM"]`, valor = lista de `{id, name, file: Blob, pages}` |
| GATs, perfis (papéis), modelos | localStorage | `pet_folha_config_*_v3` (globais, não são do participante) |
| Tema | localStorage | `pet_theme` |
| Dados do formato antigo | localStorage | `pet_folha_*_v2*` e `pet_folha_migrated_from_v2` |

**Excluir um perfil apaga:** o item em `pet_folha_profiles_v3`; todas as
chaves `pet_folha_activities_v3_<id>_<AAAA-MM>` (correspondência exata do id
seguido de `_` e de um mês, para não pegar um id que comece igual); todas as
entradas `[id, *]` do IndexedDB; e o perfil ativo, se for ele.
**Não apaga:** configurações globais, tema, outros perfis e as chaves `_v2`
(origem da migração única; a marca `pet_folha_migrated_from_v2` impede que o
perfil volte por migração).

Outros achados:

- `deleteUserProfile` existe em `storage.ts`, mas não é usado e só remove o
  perfil da lista (atividades e comprovantes ficariam órfãos).
- `handleSaveProfile` (page) grava com `saveProfiles`, que desduplica por
  `normalizeName`: um nome repetido apagaria o outro perfil. Hoje só o
  `ProfileModal` impede isso. `updateUserProfileAdmin` já valida no storage.
- A cópia (.json, formato 1.3) é de **um perfil e um mês**. Não existe cópia
  do perfil inteiro.
- O mês escolhido continua o mesmo ao trocar de participante (estado da
  página); mantido.
- "Sair / trocar participante" (Concluir) zera o perfil ativo e volta à
  entrada; com alterações sem cópia, mostra o aviso "Sair sem salvar cópia".
- A fixture `tests/fixtures/dados-v3-main.json` foi gerada pela interface da
  main atual (`scripts/gerar-fixture-compat.mjs`): dois perfis fictícios, dois
  meses, um comprovante PNG no IndexedDB. É a base do teste da regra de ouro.

### Perguntas (sigo com a opção conservadora; marcadas `TODO(perfis)` se tocarem código)

1. A cópia do perfil inteiro (antes de excluir) usa um formato novo **1.4**
   (`months: [...]`). "Salvar cópia" do dia a dia continua 1.3 (um mês). Quer
   que "Salvar cópia" passe a salvar todos os meses?
2. Faixas parciais da visão semanal usam a mesma meta de 8 h (como o app
   original), com o rótulo "semana parcial". Prefere meta proporcional?
3. O modal de edição de atividade mantém o "Preenchimento rápido" como lista
   (ação pontual, não um valor); só o formulário principal vira chips. Ok?
4. "Trocar participante" e "Sair" com alterações sem cópia abrem a mesma
   janela do Concluir (reaproveitada), com o botão principal renomeado. Ok?

## Decisões

- **E1** — Autor em `PROGRAM.author` (nome e GitHub), ao lado de
  `PROGRAM.credits`; o rodapé não tem nome fixo. LICENSE intocada.
- **E2** — Menu no padrão WAI-ARIA "menu button" (`role="menu"`,
  `menuitem`, foco móvel por setas/Home/End, Esc devolve o foco ao botão, Tab
  e clique fora fecham). O nome acessível do botão é o texto visível + "menu do
  participante" (rótulo visível contido no nome, WCAG 2.5.3).
- **E2** — Trocar e Sair reaproveitam as proteções do Concluir em vez de
  duplicá-las: `confirmDraft` (rascunho) e, se houver alterações na sessão, o
  próprio `ExitModal`, com o botão principal renomeado ("Trocar participante"
  / "Sair") e o mesmo aviso "sair sem salvar cópia". Sem alterações, sai
  direto. Motivo: uma só regra de saída para manter e testar.
- **E2** — Trocar participante volta à entrada na aba Continuar com foco no
  título "Vamos começar"; Sair volta à entrada padrão com o aviso "Sessão
  encerrada". As duas zeram o perfil ativo, como o Concluir.
- **E2** — GAT no modal: `FullSelect` ganhou `singleLine` (uma linha, reticências,
  texto inteiro no `title`); o resto do app continua quebrando a linha.
  "Salvar alterações" e títulos em caixa de frase também no modal de edição.
- **E3** — Exclusão completa: perfil, atividades de todos os meses
  (`pet_folha_activities_v3_<id>_<AAAA-MM>`, id exato) e comprovantes
  (`IDBKeyRange.bound([id], [id, []])`: só as chaves daquele id). Os
  comprovantes saem **primeiro**; se o IndexedDB falhar, nada é apagado.
  O inverso deixaria comprovantes órfãos sem perfil para alcançá-los.
- **E3** — "Salvar cópia antes" gera a cópia do **perfil inteiro**, formato
  **1.4** (`months: [{monthKey, activities, attachments}]`). A 1.3 só tinha um
  mês e não serviria para "restaurar o perfil inteiro". Restaurar 1.4 troca só
  os meses da cópia (atividades e comprovantes) numa transação IndexedDB com
  rollback do localStorage, como a 1.3. Cópias 1.0–1.3 continuam iguais.
  Versões antigas do app recusam a 1.4 com a mensagem de versão incompatível.
- **E3** — Editar pela entrada usa o mesmo `ProfileModal`; a gravação passou
  a usar `updateUserProfileAdmin`, que recusa nome igual a outro perfil
  (`normalizeName`). Antes, `saveProfiles` desduplicava e um nome repetido
  apagaria o outro perfil se o modal deixasse passar.
- **E3** — Confirmação explícita = segundo passo com botão de perigo
  vermelho (`.danger-button`, token `--danger-fill`), nunca o laranja da marca.
  Sem caixa "digite o nome": a cópia antes já é oferecida e o custo de digitar
  no celular não compensa para dados locais.
- **E3** — Sem perfis (o último excluído), a entrada cai em "Primeiro acesso".
- **E4** — Grupos de opção com **rádios nativos** transparentes sobre cada
  cartão, dentro de `role="radiogroup"` + `aria-labelledby`, em vez de botões
  com `aria-checked` e teclado escrito à mão. O navegador já entrega setas,
  Tab pela opção marcada, "x de n" no leitor de tela e foco; menos código para
  errar. O rádio cobre o cartão inteiro (inclusive a borda) e mede ≥ 44 px.
- **E4** — Modalidade: rótulo curto e ícone na tela (`PROGRAM.modalityShortLabels`),
  nome completo como nome acessível, `title` e valor gravado; a folha não
  muda. Modalidade fora da lista (dado antigo ou personalizado) vira uma opção
  extra, como fazia o select. Em ≤ 480 px vira coluna. O modal de edição usa o
  mesmo componente.
- **E4** — Preenchimento rápido: pílulas (quebram linha no desktop, rolagem
  horizontal no celular). As setas aplicam o modelo ao navegar, como o select
  nativo fazia ao trocar de opção. No **modal de edição** o "Selecionar modelo…"
  continua lista: lá é uma ação pontual sem estado "Em branco", não um valor
  (pergunta 3 do E0).
- **E4** — Perfil: cartões (grade; 2 colunas em ≤ 480 px) na entrada e no modal.
  GAT (13) e Mês ficam em select: GAT no `FullSelect` (mesma altura, borda,
  seta e foco dos campos); o Mês ganhou o mesmo anel de foco na caixa.
- **E4** — Bug encontrado nos testes: `.activity-fields .field label
  { position: static }` vencia a regra do cartão e o rádio escapava; os
  seletores dos grupos usam `> label.choice` para ganhar especificidade.
