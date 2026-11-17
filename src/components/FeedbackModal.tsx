"use client";

import { ExternalLink, X } from "lucide-react";
import { PROGRAM } from "@/config/program";
import { Modal } from "./Modal";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sem link configurado, o modal não abre e o botão "Avaliar" não aparece.
export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const url = PROGRAM.links.feedbackForm;
  if (!isOpen || !url) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Avaliação e sugestões">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Avaliação e sugestões</h2>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-muted mb-6">
          Envie sugestões ou relate um problema pelo formulário.
        </p>
        <a
          className="primary-button w-full"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Abrir formulário <ExternalLink size={16} />
        </a>
      </div>
    </Modal>
  );
}
