"use client";

import { Modal } from "./Modal";
import React, { useState, useEffect } from "react";
import { UserProfile, UserRole, GATInfo, sortedGats } from "@/types";
import { normalizeName } from "@/lib/storage";
import { X, Check, User } from "lucide-react";
import { useDialog } from "@/context/DialogContext";
import { FullSelect } from "@/components/ui/full-select";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allProfiles: UserProfile[];
  gats: Record<string, GATInfo>;
  roles: string[];
  onSaveProfile: (updated: UserProfile) => boolean | void;
}

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  allProfiles,
  gats,
  roles,
  onSaveProfile,
}: ProfileModalProps) {
  const { alert } = useDialog();
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email ?? "");
  const [role, setRole] = useState<UserRole>(currentUser.role);
  const [gatNumber, setGatNumber] = useState(currentUser.gatNumber);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Opening the profile editor must discard a previously cancelled draft.
      setName(currentUser.name);
      setEmail(currentUser.email ?? "");
      setRole(currentUser.role);
      setGatNumber(currentUser.gatNumber);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Checar duplicata com outro participante existente
    const normalizedNew = normalizeName(name);
    if (
      allProfiles.some(
        (p) =>
          p.id !== currentUser.id && normalizeName(p.name) === normalizedNew,
      )
    ) {
      await alert({
        title: "Nome duplicado",
        message: `Já existe outro participante cadastrado com o nome "${name.trim()}".`,
        variant: "warning",
      });
      return;
    }

    const gatInfo = gats[gatNumber];
    const saved = onSaveProfile({
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      role,
      gatNumber,
      gatName: gatInfo?.name || `GAT ${gatNumber}`,
    });
    if (saved !== false) onClose();
    else
      await alert({
        title: "Identificação não salva",
        message:
          "Não foi possível gravar. O preenchimento foi mantido. Verifique o armazenamento do navegador e tente novamente.",
        variant: "warning",
      });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      label="Identificação do participante"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-[var(--page-shadow)] transition-all max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-line mb-4">
          <div className="flex items-center gap-2">
            <User className="size-4.5 text-brand-text" />
            <h3 className="text-sm sm:text-base font-bold text-ink">
              Identificação do participante
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg text-muted hover:text-ink hover:bg-raised flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="field">
            <label htmlFor="profilemodal-field-1">Nome completo</label>
            <input
              id="profilemodal-field-1"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="profile-email">E-mail (opcional)</label>
            <input id="profile-email" type="email" value={email} autoComplete="email"
              onChange={(event) => setEmail(event.target.value)} />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="field">
              <label htmlFor="profilemodal-field-2">Grupo tutorial (GAT)</label>
              <FullSelect
                id="profilemodal-field-2"
                singleLine
                value={gatNumber}
                onChange={(e) => setGatNumber(e.target.value)}
              >
                {sortedGats(gats).map((info) => (
                  <option key={info.number} value={info.number}>
                    GAT {info.number} · {info.name}
                  </option>
                ))}
              </FullSelect>
            </div>

            <div className="field">
              <label htmlFor="profilemodal-field-3">Perfil</label>
              <FullSelect
                id="profilemodal-field-3"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </FullSelect>
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Seus dados são salvos exclusivamente no seu dispositivo (100% no
            navegador).
          </p>

          <div className="dialog-actions pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-line text-body hover:bg-raised cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-xs sm:text-sm font-bold rounded-xl text-on-brand bg-brand hover:bg-brand-strong cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[var(--page-shadow)]"
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
