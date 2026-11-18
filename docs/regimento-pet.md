# Regimento do PET-SD/UFG: resumo para o app

Resumo em paráfrase do **Regimento Interno do PET-Saúde: Informação e Saúde
Digital – UFG** (Goiânia, 04/12/2025; arquivo de origem
`Regimento-Interno_PET-Saude-Digital.pdf`, distribuído pela coordenação), com
complementos do **Edital Conjunto SEIDIGI/SGTES-MS nº 1/2025** e do modelo da
ficha "Registro de Frequência e Atividades – PET-SD". Este texto não substitui os
documentos oficiais; em caso de dúvida, vale o regimento.

## Programa

- Iniciativa do Ministério da Saúde com a UFG, para integrar ensino, pesquisa e
  extensão em Saúde Digital, de forma interdisciplinar. Parceiros citados no app:
  Ministério da Saúde, UFG e Secretaria Municipal de Saúde de Goiânia.
- Duração de 24 meses (edital). O cronograma do app cobre ago/2025 a ago/2027.
- Eixos do edital: (1) cultura de saúde digital, formação e educação permanente;
  (2) soluções tecnológicas e serviços de saúde digital no SUS; (3)
  interoperabilidade, análise e disseminação de dados e informações de saúde.
- Estrutura: coordenação geral, coordenação de grupo tutorial, tutores(as),
  preceptores(as), orientadores(as) de serviço e monitores(as). Na ficha, os
  perfis são Coordenador(a), Tutor(a), Preceptor(a), Orientador(a) de serviço e
  Monitor(a).

## Carga horária e frequência

- Mínimo de **32 horas por mês**, distribuídas entre ensino, pesquisa, extensão e
  gestão conforme o plano de trabalho do GAT. O edital fala em pelo menos 8 horas
  semanais.
- Pode-se cumprir mais de 32 horas, mas o **excedente não é aproveitado** no mês
  seguinte.
- Não cumprir a frequência mínima suspende a bolsa do mês, sem compensação
  posterior. (O texto do regimento diz "100% (setenta e cinco por cento)"; a
  inconsistência está registrada em `docs/adaptacao-pet-sd.md`.)
- Capacitações: carga mínima de duas horas; eventos externos podem ser validados
  mediante registro.

## Tipos de atividade

- **In loco**: em ambiente físico institucional ou comunitário (reuniões,
  oficinas, cursos, eventos, visitas técnicas), nos serviços e territórios do SUS.
- **Síncronas**: em tempo real, on-line.
- **Assíncronas**: sem interação simultânea, com produto que comprove a atividade.

No modelo da ficha, a coluna Modalidade usa "Interação em tempo real (Síncrona)" e
"Assíncrona"; o app deixa essa lista configurável.

## Registro, comprovação e entrega

- Cada integrante preenche mensalmente a ficha individual: mês, data, atividade,
  carga horária, modalidade e assinatura.
- Atividades presenciais e in loco precisam de **registro fotográfico**, guardado
  na pasta oficial do grupo; produtos das atividades síncronas e assíncronas vão
  para o Drive oficial.
- Prazo: o regimento fala em entrega ao coordenador até o dia 25 para conferência;
  o rodapé da ficha fala em envio até o primeiro dia útil do mês seguinte. O app
  reproduz o rodapé e deixa o prazo exibido configurável (ver divergências em
  `docs/adaptacao-pet-sd.md`).
- As fichas são validadas pelo coordenador(a) e/ou tutor(a) do GAT, que
  consolidam o compilado mensal para a coordenação geral.

## Cálculo de CH no app

A ficha registra Início, Fim e CH em horas e minutos (por exemplo, `1h30`). O app
calcula a CH como a duração exata entre início e fim, sem arredondamento, e soma
o total do mês em minutos. Ver `src/lib/pet-calculator.ts`.

## Ética, dados e identidade visual

- Integridade acadêmica, respeito à LGPD, aos códigos de ética profissional e ao
  Comitê de Ética em Pesquisa; uso responsável de inteligência artificial conforme
  o guia da UFG.
- Logomarcas da UFG, do Ministério da Saúde e do PET-SD/UFG seguem o padrão
  institucional; materiais e postagens precisam de aprovação da coordenação do GAT.
- Publicações mencionam a condição do autor no programa e a afiliação
  Ministério da Saúde/UFG.

## Desligamento

Pode ocorrer por pedido, descumprimento de carga horária, baixo rendimento,
conduta inadequada, perda de vínculo ou fim da bolsa; é comunicado por e-mail
institucional, com ciência da coordenação do GAT.
