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
| E1 Paleta e tokens | concluído | `feat(ui): paleta branca e laranja do PET-SD` | `npm run test:contrast` | — |
| E2 Marca | concluído | `feat(ui): logo do PET-SD na interface e nos ícones` | `python scripts/brand/gerar-marca.py "<PNG oficial>"`; `npm run build` e conferir `<head>` | vetorial oficial e aprovação da coordenação (dúvidas 1 e 4) |
| E3 Layout e botões | concluído | `feat(ui): layout e hierarquia de botões no padrão do Clima` | `npm run test:e2e`; capturas em `depois/` (E5) | lateral × duas linhas (dúvida 2) |
| E4 Ferramentas | concluído | `fix(ui): GAT 01 como padrão e GATs em ordem numérica`; `fix(ui): textos no singular e botões de confirmação acessíveis` | e2e “primeiro acesso começa no GAT 01…” | — |
| E5 Testes e “depois” | concluído | `test: validação visual do novo design` | e2e “sem texto cortado, foco visível e folha oficial em preto e branco”; `docs/validation/design-20261118/` | — |
| E6 Documentação | concluído | `docs: documentação do novo design` | CI completo do zero (seção c) | — |

## Linha de base (E0)

- `npm ci`, `lint`, `test:ui`, `typecheck`, `build` e `test:e2e` (26 testes)
  passaram em 2026-11-18, antes de qualquer mudança. Local: Node 26.13 (o
  `package.json` pede 22.x; o CI usa `.nvmrc` = 22).
- Capturas geradas por `scripts/capturar-telas.mjs` (Playwright, dados
  fictícios, JPEG 70 %) em 1440 e 390 px, claro e escuro:
  - `antes/clima/`: https://pet-folha-mensal.vercel.app
  - `antes/pet-sd/`: https://pet-folha-mensal-three.vercel.app (endereço antigo; hoje redireciona para https://pet-sd-folha-mensal.vercel.app)
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

- **Paleta.** Ação em `#c2410c` (5,18:1 com branco), hover `#9a3412`. Texto
  laranja em `#b43c0a`, um pouco mais escuro que o botão: o `#c2410c` dava
  4,48:1 num badge com 10 % de laranja ao fundo, e o script de contraste
  pegou. `#f26a35` (laranja do logo) só na barra de progresso e na prévia
  (3,05:1: serve para gráfico, não para texto). Azul do logo `#1a5a8e` em
  “UFG” e em informação. Escuro: botão `#fb923c` com texto grafite
  `#1c1917` (7,7:1), porque branco sobre laranja claro não passa.
- **Perigo** ganhou tokens próprios (`--danger-fill`): o vermelho do botão
  destrutivo em hover tinha 3,76:1 com branco.
- **Tema claro como padrão:** sem `pet_theme` salvo, abre claro; quem tinha
  escolhido escuro continua no escuro.
- **Ícones e Open Graph.** `favicon.ico`, `icon.png` e `apple-icon.png` são
  arquivos especiais do Next 16 em `src/app/`. A imagem de compartilhamento
  foi para `public/` e é declarada no `metadata`, porque o
  `opengraph-image.alt.txt` não gerou `og:image:alt` no build.
- **Apple icon com fundo branco:** o iOS preenche transparência com preto.
- **Marca completa no tema escuro** fica sobre uma placa branca: o subtítulo
  azul-escuro do logo some no fundo escuro, e não se pode mudar a cor da marca.
- **CSS novo em arquivo próprio** (`src/app/design-pet-sd.css`, depois de
  `globals.css`): o `globals.css` tem regras repetidas em camadas, então isolar
  o layout novo deixa a cascata previsível e o diff revisável. O bloco “tela
  única” (desktop com altura da janela e cabeçalho em uma linha) foi removido:
  era ele que cortava o perfil e espremia o formulário.
- **Formulário à direita, mas primeiro no DOM:** no celular e para quem navega
  por teclado, o lançamento vem antes da lista; no desktop o grid o coloca à
  direita, como no Clima.
- **Uma ação primária por tela:** na entrada, “Começar agora” é contorno e só
  leva ao cartão; o primário é “Abrir minha folha”.
- **Selects:** opção escolhida quebra linha em vez de cortar.
- **Faixa de horas:** “19 de 32 h”, “Faltam 13h para o mínimo mensal” e a regra
  (referência semanal e excedente) visíveis, não mais só em `title`.

## Dúvidas para o Brunno

Respostas de 2026-11-18:

1. **Arquivo vetorial do logo:** não existe hoje. Fica o PNG oficial de
   1024 px como fonte; se um vetorial surgir, basta trocar a entrada do
   `scripts/brand/gerar-marca.py`.
2. **Barra lateral × duas linhas:** decisão adiada até ver o site no ar
   (preview da Vercel no PR). Por ora, duas linhas.
3. **Links de avaliação e de formulário de atividades:** em aberto (pergunta
   reformulada ao Brunno). Sem link, os botões continuam ocultos; nada a mudar.
4. **Aprovação do logo pela coordenação:** ainda não. O PR fica em rascunho e
   não deve ir para a `main` (produção) antes da aprovação.
5. GAT sem zero à esquerda na folha: respondida pelo repositório
   (`docs/validation/pet-sd-20261117/README.md`, “como no modelo”).

## Ferramentas revisadas (E4)

| Ferramenta | Situação | O que mudou |
| --- | --- | --- |
| Salvar cópia | toast de sucesso, aviso de erro, `title` explicando o .json | contorno no cabeçalho (secundária) |
| Restaurar cópia | diálogo mostra participante, mês e contagem antes de gravar | “1 atividades” → “1 atividade” |
| Concluir | modal separa cópia e PDF e avisa ao sair sem cópia | sem mudança de fluxo |
| Limpar mês | confirmação com a contagem | singular (“A atividade de … será removida.”); botões de 44 px |
| Excluir atividade | confirmação com data e CH | título “Excluir atividade?”; botões de 44 px e 14 px |
| Configurações (PIN) | inalterado | GATs listados em ordem numérica |
| Ajuda | modal com dúvidas frequentes | `title` no ícone |
| Troca de mês | confirma rascunho não salvo | sem mudança |
| Troca de perfil / identificação | modal de perfil | GATs em ordem; select com opção inteira |
| Comprovantes do mês | estado vazio “Nenhum comprovante neste mês.” | sem mudança |
| Modelo em branco | rodapé (PDF) e aba da folha (.docx e PDF) | link no rodapé de todas as telas |
| Imprimir / salvar PDF | primário na aba Folha oficial | sem mudança |
| Primeiro acesso | — | **bug:** abria no GAT 10 (ordem de chaves em JS); agora GAT 01 |
| Toast | `role="status"` | 12 px → 14 px |

## Testes novos (E5)

- `sem texto cortado, foco visível e folha oficial em preto e branco` (e2e,
  desktop e celular): mede `scrollWidth > clientWidth` em rótulos, botões,
  links, títulos e células, e a largura da opção escolhida nos selects, em 390
  e 1440 px, nos dois temas, na entrada (com o GAT de nome mais longo), no
  painel e com o modelo rápido mais longo; confere o anel de foco no botão
  primário; confere que toda cor da folha oficial é cinza (r = g = b) nos dois
  temas. Contraprova: a mesma medição reprova a produção atual
  (“GAT 11 · Segunda opinião em oftalmologia” ocupa 315 px num espaço de 264 px).
- `primeiro acesso começa no GAT 01, lista os GATs em ordem e conta no
  singular` (e2e) e `GATs em ordem numérica e contagens no singular`
  (`test:ui`).
- `verify-ui.mjs`: a entrada precisa ter a marca, “Vamos começar”, os três
  passos e os dois arquivos, nessa ordem.

### Defeitos que os testes pegaram durante o trabalho

1. **Estouro horizontal de 158 px em 390 px na entrada:** `.entry-header nav`
   (globals.css) vencia `.entry-anchors { display: none }` por especificidade.
   Achado por bisseção automática do CSS (o teste de comprovantes no celular
   travava porque o diálogo ficava fora da tela rolada).
2. **Estouro em 768 px no painel:** o botão de perfil não encolhia; apareceu
   quando o GAT padrão foi corrigido para o 01, de nome mais longo.
3. **Select cortado na entrada e no modelo rápido em 390 px.** Select nativo
   não quebra linha e a fonte não pode baixar de 16 px (zoom do iOS). Criado
   `FullSelect` (`src/components/ui/full-select.tsx`): o select nativo fica
   transparente por cima de uma caixa que mostra a opção inteira com quebra;
   foco, teclado e leitor de tela continuam nativos.
4. **Texto auxiliar de 13 px** (perfil, cabeçalho da tabela) abaixo do mínimo
   de 14 px do `docs/ui-ux.md`.

## Antes × depois

Imagens lado a lado (Clima | PET-SD antes | PET-SD depois) em
`docs/validation/design-20261118/comparacao/`. Principais:

| Tela | Arquivo |
| --- | --- |
| Entrada, desktop | `comparacao/entrada-claro-1440.jpg` |
| Entrada, celular escuro | `comparacao/entrada-escuro-390.jpg` |
| Painel, desktop | `comparacao/painel-claro-1440.jpg`, `painel-escuro-1440.jpg` |
| Painel, celular | `comparacao/painel-claro-390.jpg` |
| Folha oficial | `comparacao/folha-claro-1440.jpg` |

O que mudou, olhando as imagens:

- **Entrada:** de “título + cartão + bloco JSON/PDF” para a sequência do Clima:
  hero com marca e prévia fictícia (CH exata), cartão “Vamos começar”, três
  passos, dois arquivos, novidades, dúvidas.
- **Painel:** cabeçalho em duas linhas com o nome inteiro (antes “Pessoa
  Fictí…”); faixa de horas em cartão; lista à esquerda e formulário em uma
  coluna à direita (antes duas colunas espremidas, com “Modelo rápid”,
  “Interação em te” e placeholders cortados).
- **Celular:** perfil com quebra de linha; botões de cópia com o mesmo peso;
  formulário em uma coluna com CH ao lado dos horários.
- **Folha oficial:** igual (preto e branco), só a moldura da interface mudou.

O que ficou **diferente do Clima de propósito**: cabeçalho em duas linhas em vez
de barra lateral (dúvida 2); sem onboarding em carrossel; sem botão flutuante e
abas inferiores no celular; colunas Unidade/Local e Descrição, CH exata e
modalidades do PET-SD; laranja no lugar do verde.


## Relatório final

### a) O que mudou por épico

| Épico | Commits | Resumo |
| --- | --- | --- |
| E0 | `docs: diagnóstico de design e capturas de referência` | linha de base verde; `scripts/capturar-telas.mjs`; capturas do Clima e da produção; tabela de diferenças |
| E1 | `feat(ui): paleta branca e laranja do PET-SD` | tokens semânticos claro/escuro; sem verde; tema claro padrão; `test:contrast` no CI |
| E2 | `feat(ui): logo do PET-SD na interface e nos ícones` | `scripts/brand/gerar-marca.py`; símbolo, marca completa, favicon, icon, apple-icon, Open Graph; `Brand`/`BrandMark` |
| E3 | `feat(ui): layout e hierarquia de botões no padrão do Clima` | cabeçalho em duas linhas, faixa de horas, formulário em uma coluna, lista com “ver mais”, rodapé, entrada completa |
| E4 | `fix(ui): GAT 01 como padrão e GATs em ordem numérica`; `fix(ui): textos no singular e botões de confirmação acessíveis` | bug do GAT 10, plural, botões de 44 px, toast 14 px |
| E5 | `fix(ui): selects mostram a opção escolhida inteira`; `test: validação visual do novo design` | `FullSelect`; e2e de texto cortado, foco e folha P&B; capturas depois e comparações |
| E6 | `docs: documentação do novo design` | `ui-ux.md`, README, notas de versão, registro de adaptação |

### b) Por que cada decisão

- **Tokens semânticos em vez de cores com nome** (`--brand` em vez de
  `--pet-green`): o componente diz *para que* serve a cor, não *qual* cor é.
  Trocar a paleta vira mudar um bloco de CSS, e o tema escuro é só outro
  valor para o mesmo nome. Foi o que permitiu trocar verde por laranja sem
  tocar na lógica dos componentes.
- **Dois laranjas:** o do logo (`#f26a35`) tem 3,05:1 no branco, o que serve
  para um gráfico (mínimo 3:1) mas não para texto (4,5:1). Botões e links usam
  um laranja mais escuro, da mesma família. No escuro inverte: laranja claro
  com texto grafite, porque branco sobre laranja claro não passa.
- **Contraste por script, lendo o próprio CSS:** sem segunda tabela de cores
  para desatualizar. O script pegou um caso que eu não teria visto a olho (badge
  laranja a 10 %, 4,48:1).
- **Logo só recortado:** a regra de identidade visual proíbe redesenhar ou
  mudar cores. O PNG já era transparente e sem halo, então não houve remoção de
  fundo; a versão “ladrilho” não foi necessária. O script é versionado e lê o
  original por argumento, para o arquivo de 1,4 MB não entrar no repositório
  público.
- **CSS novo em arquivo separado:** o `globals.css` herdado tinha o mesmo
  seletor definido em até quatro lugares. Um arquivo carregado depois tem a
  palavra final de forma previsível, e o diff mostra o design novo inteiro num
  lugar só. O custo é a dívida que fica no `globals.css` (ver e).
- **Duas linhas em vez da lateral do Clima:** foi o pedido, e é a mudança menor
  e reversível. A lateral fica como dúvida 2.
- **Formulário primeiro no DOM, à direita na tela:** no celular e para quem
  usa teclado, lançar é a tarefa principal; no desktop, o grid reproduz o Clima.
- **`FullSelect`:** um `<select>` nativo não quebra linha, e baixar a fonte de
  16 px faz o iOS aproximar a tela. Deixar o select nativo transparente por
  cima de uma caixa com o texto mantém teclado, leitor de tela e o seletor
  nativo do celular, sem reimplementar um combobox.

### c) Como verificar

```bash
rm -rf .next && npm ci
npm run lint && npm run test:ui && npm run test:contrast
npm run typecheck && npm run build && npm run test:e2e
```

- Capturas: `docs/validation/design-20261118/{antes/clima,antes/pet-sd,depois/pet-sd}`;
  lado a lado em `docs/validation/design-20261118/comparacao/`.
- Regenerar: ver `docs/validation/design-20261118/README.md`.
- Marca: `python scripts/brand/gerar-marca.py "<pasta do PET>/Marca_do_PETSaude.png"`.

### d) Descrição pronta de PR

> **feat: novo design do PET-SD (branco e laranja, logo oficial, layout do Clima)**
>
> **O quê.** Troca a paleta verde herdada por branco e laranja derivados do
> logo, coloca o logo do PET-SD na interface, nos ícones e no Open Graph, e
> reorganiza as telas na estrutura do PET-Saúde Clima: cabeçalho em duas
> linhas, faixa de horas, formulário em uma coluna, lista com “ver mais” e
> entrada com prévia, três passos e dois arquivos. Corrige o GAT padrão (abria
> no 10), textos no plural com 1 item, selects cortados e estouros
> horizontais em 390 e 768 px.
>
> **Por quê.** Identidade visual do programa e a clareza de uso do app de
> referência, sem perder nada do PET-SD (8 colunas, Unidade/Local, Descrição,
> CH exata, modalidades, folha oficial).
>
> **Como testar.** `npm ci`, `lint`, `test:ui`, `test:contrast`, `typecheck`,
> `build`, `test:e2e`. Abrir o preview da Vercel no celular: primeiro acesso,
> lançar uma atividade, escolher um modelo rápido longo, conferir a folha,
> alternar o tema.
>
> **Onde revisar com atenção.** `src/app/design-pet-sd.css` (layout novo);
> remoção do bloco “tela única” em `globals.css`; `src/components/ui/full-select.tsx`;
> `sortedGats` em `src/types/index.ts`; a folha oficial não deve ter mudado
> (`OfficialSheet.tsx` intacto; teste de P&B); imagens em `public/images/pet-sd/`
> (aprovação do logo pela coordenação).

### e) Dúvidas, TODO(design) e o que ficou diferente do Clima

- Dúvidas: 1 respondida (não há vetorial); 2 aguarda o preview; 3 em aberto;
  4 pendente (bloqueia o merge). A 5 foi respondida pelo próprio repositório.
- `TODO(design)`: nenhum no código. A dívida que fica é o `globals.css` com
  regras repetidas em camadas (as que o `design-pet-sd.css` sobrescreve
  continuam lá); limpar exige revisar tela por tela e fica para outra branch.
- Diferente do Clima de propósito: duas linhas em vez de lateral; sem carrossel
  de onboarding; sem abas inferiores nem botão flutuante no celular; sem filtro
  “Pendentes”/“Forms” por atividade (o PET-SD não tem o formulário por
  atividade); CH exata em vez de “hora iniciada conta inteira”; colunas e
  modalidades do PET-SD.

### f) O que o Brunno faz antes de publicar

1. Responder as dúvidas 1–4 (principalmente a 4: aprovar o logo com a
   coordenação, regra de identidade visual do regimento).
2. `git push -u origin feat/design-pet-sd` (só `origin`; nada no `upstream`).
3. Abrir o PR no fork com a descrição da seção d.
4. Esperar o CI (agora com `test:contrast`) e revisar o preview da Vercel.
5. Merge na `main` → deploy automático na Vercel.
6. Conferir a produção no celular (entrada, primeiro acesso, lançamento,
   folha, impressão) e nos dois temas.
