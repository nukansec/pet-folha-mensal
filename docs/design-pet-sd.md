# Design do PET-SD: paleta branca e laranja, marca e layout do Clima

Registro do trabalho na branch `feat/design-pet-sd`. Objetivo: dar ao app do
PET-SD a experiência do PET-Saúde Clima (estrutura, hierarquia de botões,
respiro, clareza das ferramentas), com paleta branca e laranja e com o logo do
PET-SD, sem perder nada do PET-SD (8 colunas, Unidade/Local, Descrição, CH
exata, modalidades, GATs, folha oficial).

## Progresso

| Épico | Status | Commits | Como verificar | Pendências |
| --- | --- | --- | --- | --- |
| E0 Diagnóstico e “antes” | concluído | `docs: diagnóstico de design e capturas de referência` | `docs/validation/design-20261118/antes/` | respostas da lista de dúvidas |
| E1 Paleta e tokens | pendente | | | |
| E2 Marca | pendente | | | |
| E3 Layout e botões | pendente | | | |
| E4 Ferramentas | pendente | | | |
| E5 Testes e “depois” | pendente | | | |
| E6 Documentação | pendente | | | |

## Linha de base (E0)

- `npm ci`, `lint`, `test:ui`, `typecheck`, `build` e `test:e2e` (26 testes)
  passaram em 2026-11-18, antes de qualquer mudança. Local: Node 26.13 (o
  `package.json` pede 22.x; o CI usa `.nvmrc` = 22).
- Capturas geradas por `scripts/capturar-telas.mjs` (Playwright, dados
  fictícios, JPEG 70 %) em 1440 e 390 px, claro e escuro:
  - `antes/clima/`: https://pet-folha-mensal.vercel.app
  - `antes/pet-sd/`: https://pet-folha-mensal-three.vercel.app
  - Cada pasta tem `resumo.txt` com as telas que não existem num dos sites
    (o Clima não tem modal “Concluir” nem “Configurações” acessível direto).

## Diagnóstico: Clima × PET-SD hoje

Observação central: **o Clima publicado mudou depois do último commit em
`upstream/main`**. No desktop ele usa **barra lateral** (marca, GAT, navegação
Frequência / Folha / Comprovantes e o perfil no pé da lateral) e uma faixa
superior só com “Restaurar cópia” e “Salvar cópia”. No celular, barra compacta
(logo, menu “Cópia”, avatar), navegação inferior em abas e botão flutuante
“Adicionar atividade”. O código dessa versão não está no upstream; a referência
de layout é o site.

| Tela | Clima | PET-SD hoje | O que fazer |
| --- | --- | --- | --- |
| Cabeçalho (desktop) | Lateral + faixa de cópia (ver acima) | Uma linha só: marca, abas, perfil, 3 ícones, Salvar/Restaurar, Concluir; tudo apertado | Duas linhas (pedido do Brunno): 1) marca, perfil, ícones; 2) abas à esquerda, cópia e Concluir à direita. Lateral fica como dúvida 2 |
| Perfil no cabeçalho | Nome inteiro em duas linhas na lateral | “Pessoa Fictí…” cortado, sem `title` | Nome com quebra/reticências e `title` com nome completo, função e GAT |
| Título + mês | “Frequência” grande + GAT; seletor de mês à direita | Igual em estrutura, título menor | Manter; título 28–32 px |
| Faixa de horas | Cartão próprio: número grande “de 32 horas”, “faltam X h”, barra cheia | Número, “X para o mínimo” e barra fina na mesma linha do título | Cartão em largura total: número grande + “de 32 h”, barra laranja, texto do que falta |
| Formulário | Painel à direita, uma coluna, “Modelo” no topo, CH (“Horas PET”) ao lado dos horários | Painel à esquerda em duas colunas: “Modelo rápido”, Modalidade, placeholders e Atividade desenvolvida cortados | Painel à direita em uma coluna: Preenchimento rápido · opcional, Data, Início/Fim + CH, Modalidade, Unidade/Local, Atividade desenvolvida, Descrição, regra da CH em uma linha, botão primário |
| Selects | Modalidade cortada (“Síncrona virt”) no próprio Clima | Modalidade e modelo cortados | Select em largura total; opção inteira visível (o PET-SD fica melhor que a referência aqui) |
| Lista de atividades | Tabela compacta (data/horário, atividade + modalidade, horas, ações) | Tabela com Unidade/Local e descrição; descrição sem limite claro no celular | Manter colunas do PET-SD; descrição em 2 linhas com “ver mais”; ações com rótulo; cartões no celular |
| Barra final | “Registre também… Terminou? Confira a folha” + **Conferir folha** (primário) | Igual, com o prazo | Manter; alinhar espaçamento |
| Rodapé | Créditos à esquerda; Projeto, Modelo em branco, Novidades, Ajuda, Avaliar | No painel só “Ajuda”; na entrada “Código-fonte”, “Modelo em branco”, “Ajuda” | Projeto, Modelo em branco, Ajuda sempre; “Avaliar” só com link configurado |
| Entrada | Hero com título grande, CTA “Começar agora” + “Continuar minha folha”, prévia da folha; cartão de acesso (onboarding em carrossel e abas Primeiro acesso / Restaurar cópia); “Três passos por mês” (1–3); “Dois arquivos”; dúvidas frequentes | Título simples, cartão de acesso + bloco “JSON e PDF”, novidades e dúvidas | Hero com marca completa e prévia da folha (dados fictícios, CH exata), cartão “Vamos começar” com as abas, passos 1–3, “Dois arquivos”, dúvidas. Sem carrossel de onboarding (custo alto, ganho baixo) |
| Folha oficial | Abas Minha folha / Modelo em branco, Imprimir (primário) e Voltar | Mesma estrutura | Só paleta da interface; a folha continua preto e branco |
| Modais | Ajuda, editar, limpar | Ajuda, configurações, concluir, editar, limpar | Botões no padrão primário/contorno/texto; foco laranja |
| Celular (390 px) | Barra compacta, abas inferiores, botão flutuante | Cabeçalho alto (marca, perfil, abas, cópia) antes do conteúdo | Cabeçalho compacto: marca + perfil + ícones; abas e cópia numa segunda faixa enxuta. Abas inferiores ficam para a dúvida 2 |
| Cor | Verde (`#007c46`) | Verde herdado | Laranja escuro para ação, laranja vivo só decorativo, azul do logo como secundário |

## Decisões

- **Cabeçalho em duas linhas, não barra lateral.** O pedido diz “cabeçalho em
  duas linhas como o Clima”, mas o Clima publicado hoje usa lateral. Sigo o
  texto do pedido (mudança menor e reversível) e pergunto (dúvida 2).
- **Referência = site publicado**, não `upstream/main`, porque o código novo do
  Clima não está no repositório. A estrutura é reproduzida com o código do
  próprio fork; textos e marca do Clima não são copiados.
- **Logo já é transparente.** O PNG oficial (1024×1024, RGBA) tem fundo com alfa
  0; a “sombra escura” só aparece quando se descarta o canal alfa. Não é preciso
  remover fundo nem glow; a versão “ladrilho” não é necessária.
- **Capturas em JPEG 70 %** e modais só no tema claro, para não pesar o repo
  (~4 MB por conjunto).
- O `npm ci` da linha de base falhou porque um `next dev` deste projeto estava
  aberto e travava o binário do lightningcss; os processos desse dev server
  foram encerrados para reinstalar as dependências.

## Dúvidas para o Brunno

1. Existe arquivo vetorial oficial do logo do PET-SD (SVG, PDF, AI)? Hoje uso o
   PNG de 1024 px da pasta do PET.
2. O Clima publicado trocou o cabeçalho por **barra lateral** no desktop e
   **abas inferiores + botão flutuante** no celular. Mantenho o cabeçalho em
   duas linhas (como pedido) ou migro para a lateral?
3. Há link de **formulário de avaliação** (botão “Avaliar”) ou de
   **formulário de atividades** do programa? Sem eles, os botões ficam ocultos.
4. A coordenação já aprovou o uso do logo no app? (Regra de identidade visual
   do regimento: materiais precisam de aprovação do GAT/coordenação.)
5. A folha imprime “GAT: 1”, e o app usa “01”. O modelo oficial prevê zero à
   esquerda? (Não mexi: a folha está fora do escopo de design.)

## Antes × depois

Preenchido no E5.
