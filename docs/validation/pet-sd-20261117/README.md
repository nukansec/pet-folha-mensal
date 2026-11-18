# Validação visual: folha PET-SD (17/11/2026)

Capturas e PDFs gerados com `scripts/capture-validation.mjs` (Playwright,
Chromium) sobre `next dev`, com **dados 100% fictícios**. Comparação feita com o
modelo oficial "REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD" (.docx do programa,
exportado para PDF pelo Word) e com o modelo em branco gerado em
`public/templates/`.

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `folha-comum.pdf` | 9 atividades fictícias, total 21 horas (3 páginas: registro, assinaturas, instruções) |
| `folha-25-linhas.pdf` | 25 atividades, quebra de tabela com cabeçalho repetido (4 páginas) |
| `folha-vazia.pdf` | mês sem atividades (2 páginas) |
| `folha-modelo-em-branco.pdf` | aba "Modelo em branco" (2 páginas, como o .docx) |
| `folha-comum-{claro,escuro}-{desktop,390px}.png` | prévia na aba "Folha oficial" nos dois temas e larguras |
| `folha-25-linhas-claro-desktop.png`, `folha-vazia-claro-desktop.png`, `folha-modelo-em-branco-claro-desktop.png` | prévias |
| `painel-claro-{desktop,390px}.png` | tela de lançamento com os campos novos |

Para regenerar: `npm run dev` e, em outro terminal,
`node scripts/capture-validation.mjs . http://127.0.0.1:5000 docs/validation/pet-sd-AAAAMMDD`.

## O que confere com o modelo

- Papel Carta paisagem (792 × 612 pt), conferido no PDF e no teste e2e.
- Faixa de logomarcas do próprio modelo, com o mesmo recorte do Word, repetida no
  topo de cada página.
- Título, tabela de identificação (Nome, GAT, Perfil com caixas e "X", Mês de
  Referência), nome em maiúsculas e GAT sem zero à esquerda, como no modelo.
- Oito colunas com as larguras proporcionais do `.docx` (`w:gridCol`), data em
  `dd/mm`, CH em `2h`/`1h30`, Times New Roman 10 pt.
- Linha "Total de CH no mês: N horas" em 12 pt negrito, nota de prazo em itálico,
  "Assinatura do Participante:" e "Assinatura do Responsável:".
- Página final "Instruções de preenchimento" com os cinco itens do modelo.

## Diferenças que restam

1. **Cabeçalho da tabela repetido.** O Word não repete a linha de títulos na
   quebra de página (`w:tblHeader` desligado); o app repete, de propósito, para
   facilitar a leitura de folhas longas.
2. **Assinaturas juntas.** O bloco nota + assinaturas não se divide: se não couber
   depois do total, vai inteiro para a página seguinte. No modelo preenchido, a
   assinatura do responsável caiu sozinha na página seguinte.
3. **Linhas vazias.** A folha preenchida completa até 8 linhas e sempre deixa ao
   menos uma vazia (o modelo preenchido tinha uma); o modelo em branco tem 12.
4. **Margens.** O Word usa 2 cm e põe a faixa de logos na área de cabeçalho
   (1,27 cm). O app usa 12 mm no topo, 20 mm nas laterais e 15 mm embaixo, com a
   faixa dentro da página; o resultado visual é próximo, não idêntico.
5. **Espaçamento das caixas de perfil.** Uniforme no app; irregular no modelo.
6. **Prévia em tela no celular.** A folha mantém a largura do papel e rola na
   horizontal dentro da área de prévia (a página em si não rola).
