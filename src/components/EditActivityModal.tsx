"use client";

import { Modal } from "./Modal";
import React, { useState, useEffect } from "react";
import { Activity, ModalityType, ActivityTemplate } from "@/types";
import { PROGRAM } from "@/config/program";
import {
  calcPetMinutes,
  cleanActivityDescription,
  formatDuration,
} from "@/lib/pet-calculator";
import { fillTemplateName } from "./ActivityForm";
import { X, Calendar, Clock, Check, Edit3 } from "lucide-react";
import { useDialog } from "@/context/DialogContext";
import { FullSelect } from "@/components/ui/full-select";

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onSave: (
    data: Omit<Activity, "id" | "hours">,
    editingId?: string,
  ) => boolean | void;
  defaultGatNumber?: string;
  defaultGatName?: string;
  templates?: ActivityTemplate[];
  monthKey?: string;
}

export function EditActivityModal({
  isOpen,
  onClose,
  activity,
  onSave,
  defaultGatNumber = PROGRAM.defaultGat,
  defaultGatName,
  templates = [],
  monthKey,
}: EditActivityModalProps) {
  const { alert } = useDialog();

  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [modality, setModality] = useState<ModalityType>(PROGRAM.defaultModality);
  const [description, setDescription] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (activity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset modal fields when the selected record or open state changes.
      setDate(activity.date);
      setStart(activity.start);
      setEnd(activity.end);
      setModality(activity.modality);
      setDescription(cleanActivityDescription(activity.description));
      setLocal(activity.local ?? "");
      setDescricao(activity.descricao ?? "");
    }
  }, [activity, isOpen]);

  if (!isOpen || !activity) return null;

  const previewMinutes = calcPetMinutes(start, end);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cleanActivityDescription(description)) {
      await alert({
        title: "Atividade obrigatória",
        message: "Informe a atividade desenvolvida.",
        variant: "warning",
      });
      return;
    }

    if (previewMinutes <= 0) {
      await alert({
        title: "Horário inválido",
        message: "O fim deve ser posterior ao início.",
        variant: "warning",
      });
      return;
    }

    const cleanDesc = cleanActivityDescription(description);

    if (monthKey && !date.startsWith(monthKey)) {
      await alert({
        title: "Confira a data",
        message: "Escolha uma data no mês desta folha.",
        variant: "warning",
      });
      return;
    }

    const saved = onSave(
      {
        date,
        start,
        end,
        modality,
        local: local.trim(),
        description: cleanDesc,
        descricao: descricao.trim(),
      },
      activity.id,
    );

    if (saved !== false) onClose();
    else
      await alert({
        title: "Atividade não salva",
        message:
          "Não foi possível gravar. O preenchimento foi mantido. Verifique o armazenamento do navegador e tente novamente.",
        variant: "warning",
      });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Editar atividade">
      <div
        className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-[var(--page-shadow)] p-4 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-brand-text/15 text-brand-text  flex items-center justify-center font-bold">
              <Edit3 className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Editar atividade</h3>
              <p className="text-xs text-muted">
                Atualize horários, local, modalidade ou descrição do registro
              </p>
            </div>
          </div>
          <button
            aria-label="Fechar"
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg border border-line hover:bg-raised text-muted hover:text-body flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modelos rápidos no modal */}
        {templates && templates.length > 0 && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-canvas border border-line">
            <span className="text-xs text-muted">Preenchimento rápido:</span>
            <FullSelect
              aria-label="Modelo de atividade para preenchimento rápido"
              onChange={(e) => {
                const tplId = e.target.value;
                if (!tplId) return;
                const found = templates.find((t) => t.id === tplId);
                if (found) {
                  setDescription(
                    fillTemplateName(found.name, defaultGatNumber, defaultGatName),
                  );
                  setModality(found.modality);
                  setLocal(found.local);
                }
                e.target.value = "";
              }}
              defaultValue=""
              className="text-xs px-2.5 py-1.5 rounded-lg bg-surface border border-line text-body outline-none cursor-pointer focus:border-brand-text"
            >
              <option value="" disabled>
                Selecionar modelo...
              </option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {fillTemplateName(tpl.name, defaultGatNumber, defaultGatName)} ({tpl.modality})
                </option>
              ))}
            </FullSelect>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Data + Início + Fim + CH */}
          <div className="grid grid-cols-2 sm:grid-cols-[1.25fr_1fr_1fr_auto] gap-3 items-end">
            {/* Data */}
            <div>
              <label
                htmlFor="editactivitymodal-wrapped-1"
                className="block text-xs font-semibold text-body mb-1.5"
              >
                Data
              </label>
              <div className="relative flex items-center">
                <input
                  id="editactivitymodal-wrapped-1"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  required
                  className="w-full min-h-[44px] pl-3 pr-10 py-2 text-sm rounded-xl bg-canvas border border-line text-body outline-none focus:border-brand-text transition-colors cursor-pointer"
                />
                <Calendar className="absolute right-3 size-4 text-body pointer-events-none z-1" />
              </div>
            </div>

            {/* Início */}
            <div>
              <label
                htmlFor="editactivitymodal-wrapped-2"
                className="block text-xs font-semibold text-body mb-1.5"
              >
                Início
              </label>
              <div className="relative flex items-center">
                <input
                  id="editactivitymodal-wrapped-2"
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  required
                  className="w-full min-h-[44px] pl-3 pr-10 py-2 text-sm rounded-xl bg-canvas border border-line text-body outline-none focus:border-brand-text transition-colors cursor-pointer"
                />
                <Clock className="absolute right-3 size-4 text-body pointer-events-none z-1" />
              </div>
            </div>

            {/* Fim */}
            <div>
              <label
                htmlFor="editactivitymodal-wrapped-3"
                className="block text-xs font-semibold text-body mb-1.5"
              >
                Fim
              </label>
              <div className="relative flex items-center">
                <input
                  id="editactivitymodal-wrapped-3"
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  required
                  className="w-full min-h-[44px] pl-3 pr-10 py-2 text-sm rounded-xl bg-canvas border border-line text-body outline-none focus:border-brand-text transition-colors cursor-pointer"
                />
                <Clock className="absolute right-3 size-4 text-body pointer-events-none z-1" />
              </div>
            </div>

            {/* Duração Calculada */}
            <div
              className="col-span-2 sm:col-span-1 min-h-[44px] px-4 py-1 rounded-xl bg-canvas border border-line flex flex-col items-center justify-center leading-tight"
              aria-live="polite"
            >
              <span className="text-[11px] font-medium text-muted">CH</span>
              <span className="text-sm font-bold text-brand-text whitespace-nowrap">
                {formatDuration(previewMinutes)}
              </span>
            </div>
          </div>

          {/* Row 2: Modalidade */}
          <fieldset>
            <legend className="block text-xs font-semibold text-body mb-1.5">
              Modalidade
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from(new Set([...PROGRAM.modalities, modality])).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={modality === item}
                  onClick={() => setModality(item)}
                  className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    modality === item
                      ? "bg-info/10 border-info/50 text-info font-semibold"
                      : "bg-canvas border-line text-muted hover:text-body"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${modality === item ? "bg-info" : "bg-line"}`}
                  />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Row 3: Local + Atividade desenvolvida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="editactivitymodal-local"
                className="block text-xs font-semibold text-body mb-1.5"
              >
                Unidade/Local
              </label>
              <input
                id="editactivitymodal-local"
                value={local}
                maxLength={300}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex.: unidade de saúde, sala, on-line ou -"
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl bg-canvas border border-line text-body outline-none focus:border-brand-text transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="editactivitymodal-field-1"
                className="block text-xs font-semibold text-body mb-1.5"
              >
                Atividade desenvolvida
              </label>
              <input
                id="editactivitymodal-field-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Ex.: Reunião Geral"
                className="w-full min-h-[44px] px-3 py-2 text-sm rounded-xl bg-canvas border border-line text-body outline-none focus:border-brand-text transition-colors"
              />
            </div>
          </div>

          {/* Row 4: Descrição */}
          <div>
            <label
              htmlFor="editactivitymodal-descricao"
              className="block text-xs font-semibold text-body mb-1.5"
            >
              Descrição
            </label>
            <textarea
              id="editactivitymodal-descricao"
              value={descricao}
              maxLength={4000}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Pautas, conteúdos estudados ou produtos da atividade"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-canvas border border-line text-body outline-none focus:border-brand-text transition-colors resize-y min-h-[110px] max-h-[40vh] [field-sizing:content]"
            />
          </div>

          {/* Footer Actions */}
          <div className="dialog-actions pt-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-line hover:bg-raised text-body text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-strong text-on-brand text-sm font-bold transition-all shadow-[var(--page-shadow)] flex items-center gap-2 cursor-pointer"
            >
              <Check className="size-4" />
              <span>Salvar alterações</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
