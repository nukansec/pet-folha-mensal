"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, Download, LogOut, Pencil, Users } from "lucide-react";
import { UserProfile } from "@/types";

export interface ParticipantMenuProps {
  user: UserProfile;
  gatName: string;
  onEditProfile: () => void;
  onSwitchParticipant: () => void;
  onSaveCopy: () => void;
  onSignOut: () => void;
}

/**
 * Cartão do perfil no topo como botão de menu (padrão "menu button" da
 * WAI-ARIA): aria-haspopup/aria-expanded no botão; setas, Home e End movem o
 * foco entre os itens; Esc fecha e devolve o foco ao botão; Tab ou clique fora
 * fecham. Cada item só chama a ação; as proteções (rascunho, cópia) ficam na
 * página, as mesmas do Concluir.
 */
export function ParticipantMenu({
  user,
  gatName,
  onEditProfile,
  onSwitchParticipant,
  onSaveCopy,
  onSignOut,
}: ParticipantMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLButtonElement);
    const move = (next: number) => {
      event.preventDefault();
      list[(next + list.length) % list.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(list.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") setOpen(false);
  }

  function choose(action: () => void) {
    // Devolve o foco ao botão antes da ação: um diálogo aberto pela ação
    // guarda esse foco e o restaura ao fechar.
    close();
    action();
  }

  const item = (label: string, icon: ReactNode, action: () => void) => (
    <button type="button" role="menuitem" tabIndex={-1} onClick={() => choose(action)}>
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="participant-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="profile-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        title={`${user.name} · ${user.role} · GAT ${user.gatNumber} ${gatName}`}
      >
        <span aria-hidden="true">{user.gatNumber}</span>
        <span>
          <strong>{user.name}</strong>
          <small>
            {user.role} · GAT {user.gatNumber} · {gatName}
          </small>
        </span>
        <span className="sr-only">: menu do participante</span>
        <ChevronDown size={18} aria-hidden="true" className="profile-chevron" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Menu do participante"
          className="participant-menu-list"
          onKeyDown={onMenuKey}
        >
          {item("Editar identificação", <Pencil size={18} aria-hidden="true" />, onEditProfile)}
          {item("Trocar participante", <Users size={18} aria-hidden="true" />, onSwitchParticipant)}
          {item("Salvar cópia", <Download size={18} aria-hidden="true" />, onSaveCopy)}
          {item("Sair", <LogOut size={18} aria-hidden="true" />, onSignOut)}
        </div>
      )}
    </div>
  );
}
