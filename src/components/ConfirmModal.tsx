"use client";

import { Modal } from "./Modal";
import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} label={title}>
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-[var(--page-shadow)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? "bg-danger/10 text-danger border border-danger/20"
                  : "bg-warning/10 text-warning border border-warning/20"
              }`}
            >
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">{title}</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar confirmação"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-raised cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="dialog-actions pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--control-border)] hover:bg-raised text-body text-sm font-semibold cursor-pointer transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-[var(--page-shadow)] ${
              isDestructive
                ? "bg-danger-fill hover:bg-danger-fill-strong text-on-danger"
                : "bg-brand hover:bg-brand-strong text-on-brand"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
