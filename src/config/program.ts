/**
 * Dados do programa PET atendido por esta instância.
 *
 * Tudo o que identifica o programa (nome, edital, instituições, GATs, perfis,
 * modalidades, prazo, meta de horas e links) fica aqui. Os componentes leem
 * deste arquivo; nenhum outro arquivo deve repetir esses textos.
 * Motivo e custo da escolha: docs/adr/0001-config-central-do-programa.md.
 *
 * Fontes: Regimento Interno PET-SD/UFG (04/12/2025), Edital Conjunto
 * SEIDIGI/SGTES-MS nº 1/2025 e Projeto institucional PET-SD UFG (20/06/2025).
 */

export interface ProgramGat {
  number: string;
  /** Rótulo curto exibido junto do número. */
  name: string;
  /** Eixo(s) do Programa Saúde Digital (Edital, item 1.4). */
  axis: string;
  description: string;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  modality: string;
  local: string;
  isGatSpecific?: boolean;
}

const GAT_TITLES: Array<[string, string]> = [
  ["2", "Sistema de alerta com IA para violências interpessoais e autoprovocadas"],
  ["2 e 3", "Assistente Farmácia Viva: solução computacional para o Programa Farmácia Viva"],
  ["1 e 2", "Telecuidado farmacoterapêutico em doenças crônicas"],
  ["1, 2 e 3", "Formação, pesquisa, inovação e tecnologia na assistência à pessoa com câncer"],
  ["1", "Letramento digital para a saúde com jovens da comunidade"],
  ["3", "Gestão da informação em saúde: integração ensino-serviço para análise e uso de dados"],
  ["1 e 2", "Cultura de saúde digital: controle social e políticas públicas de saúde"],
  ["2 e 3", "Geotecnologias na prevenção e controle de arboviroses em Goiânia"],
  ["2", "Saúde digital e telenefrologia na Atenção Primária à Saúde"],
  ["2", "Teleambulatório de especialidades médicas (teleinterconsulta)"],
  ["1 e 2", "Segunda opinião formativa em oftalmologia"],
  ["1 e 2", "Saúde mental digital: RAPS e apoio a estudantes do ensino superior"],
  ["2 e 3", "Teleodontologia: informação em saúde bucal na Rede de Atenção à Saúde"],
];

export const PROGRAM = {
  /** Nome completo do programa. */
  name: "PET-Saúde: Informação e Saúde Digital",
  /** Sigla usada na interface e na folha. */
  acronym: "PET-SD",
  /** Instância local do programa. */
  campus: "UFG",
  edition: "2025–2027",
  edict: "Edital Conjunto SEIDIGI/SGTES-MS nº 1/2025",
  /** Instituições citadas em textos do app (a folha usa a faixa de logos do modelo). */
  institutions: [
    "Ministério da Saúde",
    "Universidade Federal de Goiás",
    "Secretaria Municipal de Saúde de Goiânia",
  ],
  /** E-mail institucional citado no Regimento (desligamentos). Não aparece na tela. */
  institutionalEmail: "petsaudedigital.prograd@ufg.br",

  /** Primeiro e último mês selecionáveis (cronograma de 24 meses + mês final). */
  firstMonth: "2025-08",
  lastMonth: "2027-08",

  /** Regimento, item 2: 32 h mensais; o excedente não passa para o mês seguinte. */
  monthlyTargetHours: 32,
  /** Edital, item 9.1.4: no mínimo 8 h semanais. */
  weeklyReferenceHours: 8,

  /**
   * Prazo exibido no app. A nota da folha reproduz o texto do modelo oficial
   * (sheet.deadlineNote). TODO(pet-sd): confirmar o prazo com a coordenação.
   */
  deadline: {
    day: 19,
    label: "Entregue a folha assinada ao coordenador do GAT até o dia 19.",
  },

  /** Modalidades usadas no modelo preenchido. As instruções falam em Presencial/Remota. */
  modalities: ["Interação em tempo real (Síncrona)", "Assíncrona"] as string[],

  /** Perfis na ordem das caixas da ficha. */
  roles: [
    "Coordenador(a)",
    "Tutor(a)",
    "Preceptor(a)",
    "Orientador(a) de serviço",
    "Monitor(a)",
  ] as string[],
  defaultRole: "Monitor(a)",

  defaultGat: "01",
  gats: Object.fromEntries(
    GAT_TITLES.map(([axis, description], index) => {
      const number = String(index + 1).padStart(2, "0");
      return [number, { number, name: `GAT ${number}`, axis: `Eixo ${axis}`, description }];
    }),
  ) as Record<string, ProgramGat>,

  /** Modelos rápidos genéricos. {gatNumber} é trocado pelo GAT do participante. */
  templates: [
    { id: "tpl-reuniao-gat", name: "Reunião semanal do GAT {gatNumber}", modality: "Interação em tempo real (Síncrona)", local: "UFG", isGatSpecific: true },
    { id: "tpl-reuniao-frente", name: "Reunião da frente de trabalho", modality: "Interação em tempo real (Síncrona)", local: "Google Meet" },
    { id: "tpl-ata", name: "Elaboração de ata", modality: "Assíncrona", local: "-" },
    { id: "tpl-estudos", name: "Grupo de estudos", modality: "Interação em tempo real (Síncrona)", local: "UFG" },
    { id: "tpl-capacitacao", name: "Capacitação", modality: "Interação em tempo real (Síncrona)", local: "UFG" },
    { id: "tpl-visita", name: "Visita técnica", modality: "Interação em tempo real (Síncrona)", local: "Unidade de saúde" },
    { id: "tpl-estudo-assincrono", name: "Pesquisa bibliográfica e estudo autônomo", modality: "Assíncrona", local: "-" },
  ] as ProgramTemplate[],

  /** Links opcionais. Vazio = o botão correspondente não aparece. */
  links: {
    /** Formulário de registro de atividades do programa, se houver. TODO(pet-sd) */
    activityForm: "" as string,
    /** Formulário de avaliação do site, se houver. TODO(pet-sd) */
    feedbackForm: "" as string,
    /** Repositório deste fork. */
    repository: "https://github.com/nukansec/pet-folha-mensal",
  },

  /** Créditos do projeto original (este app é um fork). */
  credits: {
    upstreamRepository: "https://github.com/vvvvvdal/pet-folha-mensal",
    authors: [
      { name: "Felipe Gonçalves Vidal", url: "https://www.linkedin.com/in/vvvvvdal/" },
      { name: "Robert Francisco Taveira", url: "https://www.linkedin.com/in/robert-taveira/" },
    ],
  },

  /** Textos e arquivos da folha oficial, iguais ao modelo do programa. */
  sheet: {
    title: "REGISTRO DE FREQUÊNCIA E ATIVIDADES – PET-SD",
    headerImage: "/images/pet-sd/cabecalho-ficha.png",
    headerImageAlt:
      "Logomarcas do PET-Saúde Informação e Saúde Digital, Prefeitura de Goiânia, SUS/SES, Governo de Goiás e UFG",
    deadlineNote:
      "*Envio obrigatório até o primeiro dia útil do mês posterior às atividades ao coordenador do GAT. O não envio desta ficha devidamente preenchida no prazo acarretará a não validação da bolsa.",
    participantSignature: "Assinatura do Participante:",
    responsibleSignature: "Assinatura do Responsável:",
    instructions: [
      "Preencha os campos de identificação (Nome, GAT, Perfil, Mês de Referência).",
      "Para cada atividade, registre Data, Unidade/Local, descrição da Atividade, horários e CH (horas).",
      "Utilize a coluna 'Modalidade' (Presencial/Remota).",
      "Ao final do mês, assine e colete a assinatura(s) do(s) responsável(is), pelo Gov.br",
      "Envie o arquivo conforme o prazo indicado na observação do rodapé da primeira página.",
    ],
    blankTemplateDocx: "/templates/pet-sd-registro-de-frequencia-modelo-em-branco.docx",
  },
} as const;

export type Program = typeof PROGRAM;
