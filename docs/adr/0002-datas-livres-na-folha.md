# ADR 0002: datas livres na folha, sem período fixo

- **Data:** 19/11/2026
- **Status:** aceita

## Contexto

Até aqui a folha era o mês do calendário: o campo Data aceitava só de 01 ao
último dia do mês escolhido. Na prática, o programa fecha a folha em outros
cortes. Parte dos GATs registra de **26 de um mês a 25 do seguinte**; outros, de
**20 a 19**. Com o limite do calendário, a pessoa não conseguia lançar na folha de
Novembro uma atividade de 28/10, embora ela pertença a essa folha.

A primeira proposta foi um ciclo fixo (dia 26 a 25) configurável em
`program.ts`, com a chave salva passando a significar "a folha do ciclo" e uma
migração `_v3` → `_v4` que redistribuía cada atividade pela data. Ela foi
descartada antes de entrar: com cortes diferentes entre as pessoas, qualquer
ciclo fixo recortaria errado a folha de quem usa outro, e a migração moveria
atividades já lançadas para a folha errada.

## Decisão

- **A data é livre.** O formulário aceita qualquer data válida dentro da vigência
  do programa, com um mês de folga antes do primeiro (folhas que começam no mês
  anterior, como 20/07 a 19/08). O limite existe só contra erro de digitação no
  ano (`DATE_LIMITS` em `src/lib/pet-calculator.ts`).
- **A atividade fica na folha em que foi lançada.** O `AAAA-MM` da chave
  `pet_folha_activities_v3_<perfil>_<AAAA-MM>` continua sendo a folha escolhida
  no seletor; o app não recorta período nem move atividades.
- **Sem mudança de formato:** as chaves continuam `_v3`, sem migração. Cópias
  de segurança 1.0 a 1.4 continuam restaurando. Na cópia 1.4, a atividade pode
  estar até um mês antes ou depois da folha; mais longe que isso indica cópia
  corrompida e é recusada.
- **Visão semanal:** as faixas cobrem o mês da folha e se estendem até as datas
  lançadas fora dele, para que a soma das semanas seja sempre o total da folha.
- **Mês aberto e data sugerida** vêm do relógio em Brasília (`todayInBrasilia`),
  não do fuso do aparelho.

## Consequências

- Cada pessoa organiza a folha pelo corte do seu GAT, e o app não precisa saber
  qual é. A folha impressa continua com "Mês de Referência" e a coluna Data em
  `dd/mm`, como o modelo oficial.
- O app não avisa quando uma mesma atividade é lançada em duas folhas, nem
  quando uma folha mistura cortes. Se o programa padronizar o corte, dá para
  voltar a limitar o período com um aviso (não um bloqueio) e sem migração.
