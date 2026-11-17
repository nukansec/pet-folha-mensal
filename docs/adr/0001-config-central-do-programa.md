# ADR 0001: dados do programa centralizados em `src/config/program.ts`

- **Data:** 17/11/2026
- **Status:** aceita
- **Contexto do fork:** adaptação do app do PET-Saúde Clima para o PET-Saúde:
  Informação e Saúde Digital (PET-SD) UFG 2025–2027.

## Contexto

No projeto original, o nome do programa, o edital, as instituições, os GATs, os
perfis, as modalidades, a meta de horas e os links de formulários estavam
espalhados em strings literais por componentes, testes e documentação (mais de 60
ocorrências encontradas no inventário do E0, em `docs/adaptacao-pet-sd.md`).
Trocar de programa exigia editar dezenas de arquivos e era fácil esquecer uma
ocorrência, como um link de Forms ou o texto da nota de rodapé.

## Decisão

Todo dado que identifica o programa fica em um único módulo,
`src/config/program.ts`, exportado como a constante `PROGRAM` (`as const`):

- identidade: nome, sigla, campus, edição, edital e instituições;
- regras: meta mensal (32 h), referência semanal (8 h), prazo exibido no app,
  vigência (primeiro e último mês), modalidades e perfis;
- cadastro padrão: os 13 GATs (número, rótulo, eixos e título) e os modelos
  rápidos de atividade;
- links opcionais (formulário de atividades e de avaliação): string vazia esconde
  o botão correspondente;
- textos e arquivos da folha oficial: título, faixa de logos, nota de prazo,
  rótulos de assinatura, instruções e modelos em branco;
- créditos do projeto original.

Os componentes, o `storage.ts`, o `pet-calculator.ts` e os testes leem desse
módulo. O que o participante ou o painel local personalizam (GATs, perfis e
modelos) continua no `localStorage`, com os valores da config como padrão.

## Consequências

**A favor**

- Outro PET pode reaproveitar o app trocando um arquivo e a imagem do cabeçalho,
  sem caçar strings pelo código.
- Os testes verificam o texto que vem da config, então uma mudança de regra
  aparece em um só diff.
- Fica explícito, em um lugar, o que é dado do programa e o que é lógica do app.

**Contra**

- **Mais conflito ao puxar do upstream.** O projeto original continua com strings
  literais; quase todo commit dele que mexer em textos de componentes vai
  conflitar com este fork. Um merge do upstream passa a exigir resolução manual,
  arquivo por arquivo.
- A config é um módulo TypeScript, não um arquivo de dados: mudar o programa exige
  rebuild e deploy (não há edição em tempo de execução). Para um app estático na
  Vercel, isso é aceitável.
- Alguns textos ainda dependem de gramática portuguesa no componente (plural de
  "hora", por exemplo) e não são totalmente genéricos.

## Alternativas consideradas

- **Variáveis de ambiente (`NEXT_PUBLIC_*`).** Rejeitada: listas (GATs, perfis,
  instruções) ficariam em JSON dentro de variáveis, sem tipagem e difíceis de revisar.
- **Arquivo JSON em `public/`, lido em tempo de execução.** Rejeitada por ora:
  exigiria carregar e validar a config antes de renderizar e perderia a checagem de
  tipos do TypeScript, sem ganho real para um único programa.
- **Manter as strings e só substituí-las.** Rejeitada: repete o problema na próxima
  adaptação e não reduz o risco de sobras do programa anterior.
