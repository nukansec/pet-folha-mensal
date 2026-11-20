// Dates are publication dates in São Paulo, not the build or the visitor's date.
export const RELEASES = [
  {
    date: "2026-11-19",
    title: "Concluir confere a CH e meta síncrona na visão Semanal",
    changes: [
      "Ao concluir com menos de 32 h, ou de 16 h síncronas/In Loco, o app avisa quanto falta e deixa gerar a folha assim mesmo.",
      "A visão Semanal também mostra a barra das 16 h síncronas/In Loco.",
      "Na visão Semanal, as faixas dizem “Dias 2 a 8” e “Dia 1 (semana parcial)”, e as barras ficam alinhadas.",
      "Para salvar a folha em PDF, use o destino “Salvar como PDF”: a “Microsoft Print to PDF” gira a folha para retrato. As instruções na tela foram atualizadas.",
      "Botões revisados em todas as telas: o texto não passa mais da borda em celulares estreitos nem com o zoom do navegador em 200%.",
      "No Concluir, os botões seguem o padrão da Folha oficial (Imprimir, Baixar .docx), a assinatura no gov.br tem seção própria e o botão final “Concluir” encerra a sessão e volta para a tela de entrada.",
      "Salvar cópia baixa o .json para continuar depois; PDF e Word ficam no Concluir e na Folha oficial.",
      "Na Folha oficial, os botões ficaram iguais em Minha folha e no Modelo em branco: Imprimir (que também salva em PDF), Baixar .docx e Voltar.",
      "Nada muda nos seus registros: os dados salvos continuam abrindo iguais.",
    ],
  },
  {
    date: "2026-11-19",
    title: "Meta síncrona e preenchimento pelo histórico",
    changes: [
      "A barra do mês mostra, em laranja mais escuro, as horas em atividades Síncronas ou In Loco, com a marca das 16 h obrigatórias.",
      "O preenchimento rápido agora mostra as atividades que você já registrou: escolha uma e só ajuste a data.",
      "Saíram os modelos padrão do preenchimento rápido.",
      "Nada muda nos seus registros: os dados salvos continuam abrindo iguais.",
    ],
  },
  {
    date: "2026-11-19",
    title: "Datas livres, folha em Word e assinatura gov.br",
    changes: [
      "A data da atividade é livre: a folha de Novembro aceita também 26/10, para quem fecha a folha de 26 a 25 ou de 20 a 19.",
      "Na folha oficial e no Concluir, “Baixar .docx (Word)” gera a sua folha preenchida no modelo oficial, para editar ou completar à mão.",
      "Novo botão “Assinar no gov.br”, que abre o serviço de assinatura eletrônica.",
      "Atividade que passa da meia-noite (ex.: 23h às 3h) é aceita e conta no dia em que começou.",
      "Botão “Duplicar” em cada atividade, para repetir a mesma atividade em outra data.",
      "Na folha, campo vazio de uma atividade aparece como “-”.",
      "Correções: a cópia baixada no celular não deixa mais o aviso de “sem cópia”, e fotos de comprovação voltam a ser aceitas quando o site é aberto pelo IP da rede.",
      "Nada muda nos seus registros: os dados salvos continuam abrindo iguais.",
    ],
  },
  {
    date: "2026-11-18",
    title: "Ajustes para o celular",
    changes: [
      "Editar uma atividade usa os mesmos campos do formulário, com os botões sempre à vista.",
      "Nenhum rótulo parte palavra no meio, e o topo mostra o seu nome e o seu perfil em duas linhas.",
      "Salvar, Restaurar e Concluir ficam do mesmo tamanho; o mês não aparece mais repetido no resumo.",
      "Na folha oficial, a prévia cabe na tela com a faixa de logos, e dá para vê-la em tamanho real. A impressão continua igual.",
      "Atualização de segurança do Next.js.",
      "Nada muda nos seus registros: os dados salvos continuam abrindo iguais.",
    ],
  },
  {
    date: "2026-11-18",
    title: "Perfis, menu do participante e visão semanal",
    changes: [
      "Na entrada, cada perfil aparece num cartão com Abrir, Editar e Excluir. Antes de excluir, o app mostra o que será apagado e oferece uma cópia do perfil inteiro.",
      "O seu nome no topo abre um menu: editar identificação, trocar participante, salvar cópia e sair.",
      "Modalidade, perfil e preenchimento rápido viraram opções visíveis, mais fáceis de tocar no celular.",
      "O resumo do mês ganhou a visão Semanal, com a CH de cada semana e a semana atual destacada.",
      "Nada muda nos seus registros: os dados salvos continuam abrindo iguais.",
    ],
  },
  {
    date: "2026-11-18",
    title: "Ajustes no formulário e nova modalidade",
    changes: [
      "Nova modalidade “Interação em tempo real (In Loco)” para as atividades presenciais. Registros antigos de “Síncrona presencial” passam a aparecer como In Loco.",
      "O preenchimento rápido tem quatro modelos: Reunião Geral, Capacitação, Visita Técnica e Pesquisa Bibliográfica e Estudos Autônomos.",
      "Sem início ou fim, a CH mostra um traço em vez de “0h”.",
      "Os botões das janelas de confirmação não saem mais da caixa no celular.",
      "O site mudou de endereço (o antigo redireciona para o novo), e o botão “Avaliar o site” abre o formulário de avaliação.",
    ],
  },
  {
    date: "2026-11-18",
    title: "Novo visual com a marca do PET-SD",
    changes: [
      "O app ganhou o logo do PET-Saúde: Informação e Saúde Digital e as cores branco e laranja. A folha oficial continua em preto e branco.",
      "O formulário de atividade ficou em uma coluna, com a CH ao lado dos horários e as opções sempre inteiras, também no celular.",
      "A faixa de horas mostra quanto falta para as 32 h do mês, e a descrição longa de uma atividade abre com “ver mais”.",
      "O primeiro acesso já começa no GAT 01, e os GATs aparecem em ordem.",
    ],
  },
  {
    date: "2026-11-17",
    title: "Folha no modelo do PET-SD",
    changes: [
      "A folha segue o modelo “Registro de Frequência e Atividades – PET-SD”, em papel Carta na horizontal.",
      "Cada atividade tem Unidade/Local e Descrição, e a CH é a duração exata (ex.: 1h30).",
      "Os GATs, perfis e modalidades vêm do regimento e do projeto institucional do PET-SD/UFG.",
    ],
  },
];
