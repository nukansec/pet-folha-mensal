"use client";

import { ChevronDown, X } from "lucide-react";
import { PROGRAM } from "@/config/program";
import { Modal } from "./Modal";

const questions = [
  [
    "Como começo minha folha?",
    "No primeiro acesso, informe nome, perfil e GAT. Nos próximos meses, use “Continuar” neste mesmo navegador e escolha o mês. Você não precisa do arquivo anterior para abrir um novo mês.",
  ],
  [
    "Como troco, edito ou excluo um perfil?",
    "Na folha, toque no seu nome no topo: o menu tem Editar identificação, Trocar participante, Salvar cópia e Sair. Na entrada, em “Continuar”, cada perfil tem Abrir, Editar e Excluir. Excluir apaga do navegador o perfil, as atividades de todos os meses e os comprovantes; antes, salve a cópia do perfil inteiro, que “Restaurar cópia” traz de volta.",
  ],
  [
    "O que é a visão semanal?",
    `No resumo do mês, escolha “Semanal” para ver a CH de cada semana (segunda a domingo) e a referência de ${PROGRAM.weeklyReferenceHours} h. A primeira e a última semana do mês podem ser parciais: elas continuam no mês vizinho, por isso a referência não é reduzida. Para a folha vale o mínimo de ${PROGRAM.monthlyTargetHours} h no mês.`,
  ],
  [
    "O que é o JSON e como restauro uma folha?",
    "O JSON é a cópia editável da sua folha: guarda sua identificação, atividades e comprovantes. Use “Restaurar cópia” e selecione o arquivo .json salvo anteriormente. O PDF e o Word não restauram os registros: para baixá-los, use “Concluir” ou a aba Folha oficial.",
  ],
  [
    "Onde ficam meus dados?",
    "Neste navegador. Nada é enviado a um servidor. Use “Salvar cópia” para baixar o arquivo .json; limpar os dados do navegador pode apagar seus registros. Guarde a cópia em local seguro.",
  ],
  [
    "Perdi a cópia. Posso continuar?",
    "Se usou este navegador, abra seu perfil em “Continuar”: os meses anteriores continuam locais. Em outro aparelho ou após limpar os dados, você pode criar uma folha para o novo mês; os registros antigos dependem da cópia ou do navegador original. Não há sincronização automática.",
  ],
  [
    "Como a carga horária (CH) é calculada?",
    `A CH é a duração exata entre início e fim, em minutos: 16h30 às 18h00 = 1h30; 11h00 às 13h00 = 2h. Atividade que passa da meia-noite conta inteira no dia em que começou: 23h00 às 3h00 = 4h (até 12 h). A data é livre: lance também dias do mês anterior se a folha do seu GAT fecha no dia 25 ou no dia 19. O mínimo é de ${PROGRAM.monthlyTargetHours}h no mês e o excedente não passa para o mês seguinte.`,
  ],
  [
    "Preciso comprovar as atividades?",
    "Atividades presenciais e in loco precisam de registro fotográfico. Na aba “Folha oficial”, anexe as fotos (JPEG ou PNG) ou um PDF abaixo da prévia; eles saem nas páginas seguintes do PDF. Os produtos das atividades síncronas e assíncronas vão para o Drive oficial do grupo.",
  ],
  [
    "Como imprimo e assino?",
    `Na Folha oficial, clique em “Imprimir”. Para o PDF, em Destino escolha “Salvar como PDF”: a folha sai em Carta deitada, como o modelo oficial. Não use “Microsoft Print to PDF”, que gira a folha para retrato. Em Mais definições, desmarque “Cabeçalhos e rodapés”. Confira a folha e os comprovantes e assine pelo Gov.br. ${PROGRAM.deadline.label}`,
  ],
];

export function FAQ() {
  return (
    <div className="faq-list">
      {questions.map(([question, answer]) => (
        <details key={question}>
          <summary>
            {question}
            <ChevronDown size={18} aria-hidden="true" />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}

export function HelpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Ajuda com sua folha">
      <div className="help-panel">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2>Ajuda</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar ajuda"
          >
            <X size={20} />
          </button>
        </div>
        <FAQ />
      </div>
    </Modal>
  );
}
