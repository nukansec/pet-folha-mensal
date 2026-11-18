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

// [eixos, rótulo curto, título] — Projeto institucional PET-SD UFG, "Descrição dos GATs".
const GAT_LIST: Array<[string, string, string]> = [
  ["2", "Alerta de violências com IA", "Sistema de alerta para situações de violências interpessoais e autoprovocadas em prontuário eletrônico utilizando inteligência artificial"],
  ["2 e 3", "Farmácia Viva", "Assistente Farmácia Viva: solução computacional para auxiliar na operacionalização do Programa Farmácia Viva"],
  ["1 e 2", "Telecuidado farmacoterapêutico", "Telecuidado farmacoterapêutico: monitoramento terapêutico e manejo de reações adversas em pacientes com doenças crônicas"],
  ["1, 2 e 3", "Cuidado à pessoa com câncer", "Formação, pesquisa, inovação e tecnologia para assistência à pessoa com câncer"],
  ["1", "Letramento digital", "Letramento digital para a saúde: engajando jovens da comunidade"],
  ["3", "Gestão da informação em saúde", "Gestão da informação em saúde: integração ensino-serviço para análise e uso de dados por estudantes e trabalhadores do SUS"],
  ["1 e 2", "Cultura de saúde digital", "Cultura de saúde digital: controle social e saúde digital no cenário das políticas públicas de saúde"],
  ["2 e 3", "Geotecnologias e arboviroses", "Mapeando epidemias: geotecnologias na prevenção e controle de arboviroses no município de Goiânia"],
  ["2", "Telenefrologia", "Saúde digital e telenefrologia na Atenção Primária à Saúde"],
  ["2", "Teleambulatório", "Fomentar a criação de teleambulatório de especialidades médicas"],
  ["1 e 2", "Segunda opinião em oftalmologia", "Produção de segunda opinião formativa em oftalmologia"],
  ["1 e 2", "Saúde mental digital", "Saúde mental digital: fortalecimento da RAPS e apoio aos estudantes do ensino superior"],
  ["2 e 3", "Teleodontologia", "Teleodontologia: registro da informação em saúde bucal e disponibilidade na Rede de Atenção à Saúde"],
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

  /**
   * Modalidades na ordem dos menus. "In Loco" é a atividade presencial (exige
   * registro fotográfico). As instruções da ficha falam em Presencial/Remota.
   * Código e dados usam o nome, nunca a posição na lista.
   */
  modalities: [
    "Interação em tempo real (In Loco)",
    "Interação em tempo real (Síncrona)",
    "Assíncrona",
  ] as string[],
  /** Modalidade inicial do formulário e de registros sem modalidade. */
  defaultModality: "Interação em tempo real (Síncrona)",

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
  /** Eixos do Edital (item 1.4), usados no cadastro de GATs. */
  axes: [
    "Eixo 1: cultura de saúde digital, formação e educação permanente em saúde",
    "Eixo 2: soluções tecnológicas e serviços de saúde digital no âmbito do SUS",
    "Eixo 3: interoperabilidade, análise e disseminação de dados e informações de saúde",
  ] as string[],
  gats: Object.fromEntries(
    GAT_LIST.map(([axis, name, description], index) => {
      const number = String(index + 1).padStart(2, "0");
      return [number, { number, name, axis: `Eixo ${axis}`, description }];
    }),
  ) as Record<string, ProgramGat>,

  /**
   * Modelos do preenchimento rápido: nome = Atividade desenvolvida.
   * local vazio = a pessoa preenche (o campo fica vazio ao escolher o modelo).
   * {gatNumber} no nome é trocado pelo GAT do participante.
   */
  templates: [
    { id: "tpl-reuniao-geral", name: "Reunião Geral", modality: "Interação em tempo real (In Loco)", local: "UFG" },
    { id: "tpl-capacitacao-online", name: "Capacitação", modality: "Interação em tempo real (Síncrona)", local: "Online" },
    { id: "tpl-visita-tecnica", name: "Visita Técnica", modality: "Interação em tempo real (In Loco)", local: "" },
    { id: "tpl-pesquisa-estudos", name: "Pesquisa Bibliográfica e Estudos Autônomos", modality: "Assíncrona", local: "Online" },
  ] as ProgramTemplate[],
  /**
   * Lista padrão até a versão de 18/11/2026. Se o navegador ainda guarda
   * exatamente esta lista (sem edição), ela é lida como a lista nova acima.
   */
  legacyTemplates: [
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
    /** Endereço público do app (base das URLs absolutas do Open Graph). */
    site: "https://pet-sd-folha-mensal.vercel.app",
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
    /** Modelo em branco gerado do .docx oficial (sem dados de participante). */
    blankTemplateDocx: "/templates/pet-sd-registro-de-frequencia-modelo-em-branco.docx",
    blankTemplatePdf: "/templates/pet-sd-registro-de-frequencia-modelo-em-branco.pdf",
  },
} as const;

export type Program = typeof PROGRAM;
