# Interface e experiência de uso

O percurso prioriza preencher a frequência em poucos passos, inclusive no
celular: abrir perfil → escolher mês → lançar e revisar → conferir a folha →
guardar a cópia (.json) e o PDF. A estrutura de telas segue o app original
(PET-Saúde Clima); esta página descreve o estado do fork PET-SD. Decisões e
capturas do design atual: [design-pet-sd.md](design-pet-sd.md).

## Paleta e tokens

Branco e laranja, derivados do logo. Os componentes usam só tokens semânticos
de `src/app/globals.css`; nenhum tom bruto nem nome de cor herdado.

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--background` / `--surface` | `#fafaf9` / `#ffffff` | `#1a1716` / `#221f1d` | página / cartões |
| `--foreground` / `--body` / `--muted` | grafite `#1c1917` / `#44403c` / `#57534e` | `#f5f5f4` / `#d6d3d1` / `#a8a29e` | texto |
| `--brand` / `--brand-strong` | `#c2410c` / `#9a3412` | `#fb923c` / `#fdba74` | botão primário / hover |
| `--on-brand` | branco | grafite | texto sobre `--brand` |
| `--brand-text` | `#b43c0a` | `#fb923c` | links, abas ativas, ícones de destaque |
| `--brand-soft` | `#fff4ed` | laranja 10 % | fundos suaves, hover de secundário |
| `--brand-vivid` | `#f26a35` | `#f26a35` | só decorativo: barra de progresso, prévia |
| `--focus-ring` | `#c2410c` | `#fb923c` | anel de foco |
| `--info` | `#1a5a8e` (azul do logo) | `#8cc4ec` | “UFG”, informação |
| `--danger`, `--danger-fill`, `--warning` | vermelho e âmbar | — | erro, ação destrutiva, alerta; nunca laranja da marca |

- Contraste AA conferido por `npm run test:contrast`
  (`scripts/checar-contraste.mjs`, lê os tokens do CSS): 4,5:1 para texto, 3:1
  para bordas de controle, foco e gráficos. O laranja vivo do logo dá 3,05:1 no
  branco, por isso nunca vira texto.
- Tema claro é o padrão; a escolha salva (`pet_theme`) é preservada.
- A folha oficial e a impressão não usam tokens: preto e branco, como o modelo.

## Botões

- **Uma ação primária por tela**, laranja cheio: “Abrir minha folha”,
  “Adicionar atividade”, “Conferir folha”, “Imprimir / salvar PDF”.
- **Secundárias** em contorno (`.secondary-button`): Salvar cópia, Restaurar
  cópia, Concluir, Começar agora.
- **Terciárias** como texto sublinhado (`.text-button`) ou ícone: Limpar mês,
  ver mais, editar, excluir, ajuda, tema, configurações.
- Botão só de ícone tem `aria-label` e `title`. Alvo mínimo de 44 px.
- Destrutivas confirmam com contagem (“A atividade de … será removida.”).

## Logo

- Arquivos derivados do PNG oficial por `scripts/brand/gerar-marca.py`
  (recorte, redimensionamento e compressão; sem redesenho nem troca de cor):
  `public/images/pet-sd/simbolo.png` (cabeçalho), `marca-completa.png`
  (entrada), `compartilhamento.png` (Open Graph 1200×630) e, em `src/app/`,
  `favicon.ico`, `icon.png` (512) e `apple-icon.png` (180, fundo branco).
- `Brand` = símbolo + “PET-SD UFG” + “Folha de frequência mensal”;
  `BrandMark` = marca completa. No tema escuro a marca completa fica sobre uma
  placa branca, porque o subtítulo azul-escuro some no fundo escuro.

## Entrada e retomada

- Sequência da página: marca e prévia fictícia (hero), cartão “Vamos começar”
  com as abas, “Três passos por mês”, “Dois arquivos”, novidades e dúvidas.
- “Continuar” lista os perfis guardados neste navegador em **cartões**
  (iniciais, nome, perfil · GAT e meses com atividades). O cartão inteiro abre a
  folha; **Editar** (lápis) abre a identificação e **Excluir** (lixeira, rótulo
  “Excluir perfil de …”) abre a confirmação. No celular, Editar e Excluir ficam
  numa linha abaixo do nome. Dá para abrir outro mês sem restaurar arquivo.
- **Excluir perfil**: o diálogo lista o que sai do navegador (identificação,
  atividades e meses, comprovantes), oferece “Salvar cópia antes” (o perfil
  inteiro, formato 1.4) e só apaga pelo botão vermelho “Excluir perfil”.
  Sem perfis, a entrada abre em “Primeiro acesso”.
- “Primeiro acesso” pede nome, **Perfil** em cartões de rádio (padrão
  Monitor(a)) e **GAT** em lista (padrão GAT 01). Navegador novo começa sem perfis.
- Nome já cadastrado oferece “Continuar com este perfil”, sem recriar nem apagar
  meses anteriores.
- “Restaurar cópia” aceita o .json salvo pelo app (versões 1.0 a 1.4). O PDF não
  restaura registros. A entrada explica, sem expansão, a diferença entre JSON e PDF.
- Frame e Segmented Control foram adaptados de componentes de terceiros;
  [origem e licença](THIRD-PARTY-UI.md).

## Minha frequência

- Mês, participante e GAT definem o contexto. O seletor cobre a vigência da
  config (ago/2025 a ago/2027); um mês restaurado fora do intervalo continua
  selecionável.
- O resumo mostra a **CH do mês** (`21 horas`, `33h30`), o número de atividades e
  quanto falta para o mínimo de 32 h. Não declara aptidão para envio.
- **Mensal | Semanal** (grupo de rádio): Mensal mostra a barra até 32 h;
  Semanal mostra as faixas de segunda a domingo cortadas pelo mês (“Dia 1”,
  “2 a 8”…), cada uma com a CH exata (“1h30 de 8 h”) e barra laranja; a semana
  atual tem borda, fundo e o texto “Semana atual”; faixas parciais dizem
  “Semana parcial” e mantêm a referência de 8 h. Duas colunas no desktop, uma
  no celular. A escolha fica em `pet_folha_summary_view` (padrão Mensal).
- Cabeçalho em duas linhas: marca, **menu do participante** (nome completo;
  `title` com função e GAT) e ícones; depois as abas e as ações de cópia e
  Concluir. O menu (`aria-haspopup="menu"`, setas, Home/End, Esc devolve o foco)
  tem Editar identificação, Trocar participante, Salvar cópia e Sair; Trocar e
  Sair pedem confirmação com rascunho e, com alterações sem cópia, abrem a
  janela do Concluir. No celular o menu ocupa a largura útil, itens de 44 px.
- O formulário fica numa coluna, à direita no desktop: Preenchimento rápido ·
  opcional (pílulas; rolagem horizontal no celular), Data, Início/Fim com a CH ao lado, Modalidade, Unidade/Local,
  Atividade desenvolvida (obrigatória), Descrição e o botão primário. Sem início
  ou fim, a CH mostra “—” em cor neutra; o laranja só aparece com a CH
  calculada. A regra da CH fica na Ajuda e nas Dúvidas (desde 18/11/2026).
- Modais: a linha de botões quebra quando não cabe (`.dialog-actions` em
  `design-pet-sd.css`); cada botão ocupa a linha toda e o primário fica por último.
- **Grupos de opção** (`ui/choice-group.tsx`): rádios nativos transparentes
  sobre cada cartão, em `role="radiogroup"` com rótulo visível. Modalidade:
  ícone e rótulo curto (In Loco, Síncrona, Assíncrona), nome completo como nome
  acessível e na folha; coluna em ≤ 480 px. Perfil: cartões em grade.
  Marcado = borda, fundo e peso da fonte da marca; foco com o anel laranja.
- Listas longas continuam em select: **GAT** (13) e **Mês**. O GAT usa o
  `FullSelect` (opção inteira, mesma altura e foco dos campos); no modal de
  identificação ele fica em uma linha com reticências e o nome inteiro no `title`.
- A lista mostra data, horário, modalidade, local, CH e a descrição em até duas
  linhas, com “ver mais”. Editar e excluir têm nomes acessíveis; “Limpar mês” pede
  confirmação; exemplos são opcionais e identificados como fictícios.
- Lista e formulário ficam lado a lado a partir de 1024 px; abaixo disso, o
  formulário vem primeiro.

## Tipografia e conforto

| Uso | Tamanho |
| --- | --- |
| Texto principal, campos, rótulos e ações | 16 px |
| Informações auxiliares e rodapé | pelo menos 14 px |
| Títulos de blocos | 20–24 px |
| Título da área de trabalho | 28 px |

Entrelinha de 1,5–1,65, temas claro e escuro, foco visível, alvos de pelo menos
44×44 px e respeito a “reduzir movimento”. A folha oficial mantém a escala em
pontos do modelo (Times New Roman 10 pt).

## Folha oficial e impressão

- A aba **Folha oficial** mostra a prévia do “Registro de Frequência e
  Atividades – PET-SD” e alterna entre **Minha folha** e **Modelo em branco**
  (com download do .docx e do PDF em branco).
- Impressão em **Carta paisagem**, papel branco mesmo no tema escuro. A faixa de
  logos se repete em cada página, a linha de títulos da tabela se repete nas
  quebras, o bloco de nota e assinaturas não se divide e as instruções saem na
  última página.
- **Comprovação fotográfica** fica abaixo da prévia: fotos (JPEG, PNG) ou PDFs de
  até 20 MB por arquivo, 40 MB e 30 páginas por mês, impressos depois da folha, na
  ordem da lista.

## Cópia, restauração e conclusão

- “Salvar cópia” gera o .json do mês com os comprovantes (1.3); a cópia do
  perfil inteiro (1.4) é oferecida antes de excluir um perfil; “Imprimir / salvar PDF” abre a
  impressão. O diálogo “Concluir” separa as duas ações e pede confirmação para
  sair com alterações sem cópia.
- A restauração mostra participante, mês e quantidade de atividades antes de
  gravar, valida tudo antes e reverte escritas se uma etapa falhar. Os detalhes
  de suporte não incluem conteúdo do arquivo.
- Links de formulário do programa e de avaliação só aparecem se configurados em
  `src/config/program.ts`.

## Verificação

- `npm run test:ui`: renderização dos componentes, rótulos de campos, folha
  oficial (campos, perfis, 8 colunas, total, instruções), CSS de impressão.
- `npm run test:contrast`: contraste dos pares de cor nos dois temas.
- `npm run test:e2e`: percurso completo em desktop e celular, temas, larguras de
  360 a 1440 px, sem texto cortado nem estouro horizontal, foco visível, folha em
  preto e branco, falhas de gravação, cópia e restauração, comprovantes, migração
  do formato antigo e PDF de folha extensa em Carta paisagem.
- Capturas do design atual, com o Clima e o antes lado a lado:
  [validation/design-20261118](validation/design-20261118/README.md). PDFs da
  folha comparados com o modelo: [validation/pet-sd-20261117](validation/pet-sd-20261117/README.md).
