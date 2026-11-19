"use client";

import { useRef } from "react";
import { UserProfile, GATS } from "@/types";
import { useTheme } from "@/lib/theme";
import {
  Download,
  FileText,
  HelpCircle,
  ListChecks,
  Moon,
  Settings2,
  Sun,
  Upload,
  ArrowRight,
} from "lucide-react";
import { Brand } from "./Brand";
import { ParticipantMenu } from "./ParticipantMenu";

interface NavbarProps {
  user: UserProfile;
  activeTab: "dashboard" | "official";
  onTabChange: (tab: "dashboard" | "official") => void;
  onOpenProfileModal: () => void;
  hasChanges: boolean;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onOpenAdmin: () => void;
  onOpenExitModal: () => void;
  onOpenFeedback: () => void;
  onOpenHelp: () => void;
  onSwitchParticipant: () => void;
  onSignOut: () => void;
}

export function Navbar({
  user,
  activeTab,
  onTabChange,
  onOpenProfileModal,
  hasChanges,
  onExportBackup,
  onImportBackup,
  onOpenAdmin,
  onOpenExitModal,
  onOpenHelp,
  onSwitchParticipant,
  onSignOut,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const gatName = user.gatName || GATS[user.gatNumber]?.name || "PET";
  return (
    <header className="workspace-nav">
      <a href="#conteudo" className="skip-link">
        Pular para o conteúdo
      </a>
      <div className="workspace-nav-top">
        <Brand />
        <ParticipantMenu
          user={user}
          gatName={gatName}
          onEditProfile={onOpenProfileModal}
          onSwitchParticipant={onSwitchParticipant}
          onSaveCopy={onExportBackup}
          onSignOut={onSignOut}
        />
        <div className="workspace-tools">
          <button
            className="icon-button"
            onClick={onOpenHelp}
            aria-label="Abrir ajuda"
            title="Ajuda"
          >
            <HelpCircle size={20} />
          </button>
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
            }
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="icon-button"
            onClick={onOpenAdmin}
            aria-label="Abrir configurações locais"
            title="Configurações"
          >
            <Settings2 size={20} />
          </button>
        </div>
      </div>
      <div className="workspace-nav-bottom">
        <nav className="workspace-tabs" aria-label="Seções da folha">
          <button
            aria-pressed={activeTab === "dashboard"}
            onClick={() => onTabChange("dashboard")}
          >
            <ListChecks size={18} aria-hidden="true" />
            Minha frequência
          </button>
          <button
            aria-pressed={activeTab === "official"}
            onClick={() => onTabChange("official")}
          >
            <FileText size={18} aria-hidden="true" />
            Folha oficial
          </button>
        </nav>
        <div className="backup-tools" aria-label="Cópia de segurança">
          <button onClick={onExportBackup} aria-label="Salvar cópia" title="Baixar a cópia de segurança (.json) deste perfil">
            <Download size={17} aria-hidden="true" />
            <span>Salvar<span className="label-extra"> cópia</span></span>
          </button>
          <button onClick={() => fileRef.current?.click()} aria-label="Restaurar cópia" title="Abrir uma cópia de segurança (.json)">
            <Upload size={17} aria-hidden="true" />
            <span>Restaurar<span className="label-extra"> cópia</span></span>
          </button>
          <button className="conclude-button" onClick={onOpenExitModal} title="Guardar a cópia e o PDF, ou sair">
            Concluir
            {hasChanges && (
              <span
                className="change-indicator"
                aria-label="Alterações nesta sessão"
              />
            )}
            <ArrowRight size={17} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            aria-label="Restaurar cópia de segurança"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportBackup(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </header>
  );
}
