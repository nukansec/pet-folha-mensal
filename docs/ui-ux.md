# Interface e experiência de uso

O percurso prioriza preencher a frequência em poucos passos, inclusive no
celular: abrir perfil → escolher mês → lançar e revisar → conferir a folha →
guardar a cópia (.json) e o PDF. A base da interface vem do projeto original;
esta página descreve o estado do fork PET-SD.

## Entrada e retomada

- “Continuar” lista os perfis guardados neste navegador; dá para abrir outro mês
  sem restaurar arquivo. “Primeiro acesso” pede nome, **Perfil** (padrão
  Monitor(a)) e **GAT** (padrão GAT 01). Navegador novo começa sem perfis.
- Nome já cadastrado oferece “Continuar com este perfil”, sem recriar nem apagar
  meses anteriores.
- “Restaurar cópia” aceita o .json salvo pelo app (versões 1.0 a 1.3). O PDF não
  restaura registros. A entrada explica, sem expansão, a diferença entre JSON e PDF.
- Frame e Segmented Control foram adaptados de componentes de terceiros;
  [origem e licença](THIRD-PARTY-UI.md).

## Minha frequência

- Mês, participante e GAT definem o contexto. O seletor cobre a vigência da
  config (ago/2025 a ago/2027); um mês restaurado fora do intervalo continua
  selecionável.
- O resumo mostra a **CH do mês** (`21 horas`, `33h30`), o número de atividades e
  quanto falta para o mínimo de 32 h. Não declara aptidão para envio.
- O formulário tem Data, Modalidade, Início, Fim, CH calculada na hora,
  Unidade/Local, Atividade desenvolvida (obrigatória) e Descrição. Modelos rápidos
  preenchem atividade, modalidade e local.
- A lista mostra data, horário, modalidade, local, CH e o início da descrição
  (duas linhas). Editar e excluir têm nomes acessíveis; “Limpar mês” pede
  confirmação; exemplos são opcionais e identificados como fictícios.
- Formulário e lista ficam lado a lado quando há espaço e em uma coluna no celular.

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

- “Salvar cópia” gera o .json com os comprovantes; “Imprimir / salvar PDF” abre a
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
- `npm run test:e2e`: percurso completo em desktop e celular, temas, larguras de
  360 a 1440 px, falhas de gravação, cópia e restauração, comprovantes, migração
  do formato antigo e PDF de folha extensa em Carta paisagem.
- Capturas e comparação com o modelo: [validation/pet-sd-20261117](validation/pet-sd-20261117/README.md).
