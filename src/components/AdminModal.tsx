"use client";

import { Modal } from "./Modal";
import React, { useEffect, useState } from "react";
import { UserProfile, GATInfo, sortedGats } from "@/types";
import {
  saveGats,
  saveRoles,
  updateRoleName,
  updateGatInfo,
} from "@/lib/storage";
import {
  Shield,
  X,
  Lock,
  Briefcase,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { useDialog } from "@/context/DialogContext";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles?: UserProfile[];
  gats: Record<string, GATInfo>;
  roles: string[];
  onProfilesChange?: (updated: UserProfile[]) => void;
  onGatsChange: (updated: Record<string, GATInfo>) => void;
  onRolesChange: (updated: string[]) => void;
  defaultTab?: "roles" | "gats";
}

type AdminAccessStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "unconfigured"
  | "unavailable";

// Eixos do Edital (item 1.4); um GAT pode atuar em mais de um.
const AXIS_OPTIONS = [
  "Eixo 1",
  "Eixo 2",
  "Eixo 3",
  "Eixo 1 e 2",
  "Eixo 1 e 3",
  "Eixo 2 e 3",
  "Eixo 1, 2 e 3",
];

export function AdminModal({
  isOpen,
  onClose,
  profiles = [],
  gats,
  roles,
  onProfilesChange,
  onGatsChange,
  onRolesChange,
  defaultTab = "roles",
}: AdminModalProps) {
  const { confirm, alert } = useDialog();
  const [accessStatus, setAccessStatus] =
    useState<AdminAccessStatus>("checking");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"roles" | "gats">(
    () => {
      if (typeof window !== "undefined") {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab === "roles" || tab === "gats")
          return tab;
      }
      return defaultTab;
    },
  );

  // Formulário de Edição / Nova Função (Role)
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRoleOriginal, setEditingRoleOriginal] = useState<string | null>(
    null,
  );
  const [editingRoleNewName, setEditingRoleNewName] = useState("");

  // Formulário de Edição / Novo GAT
  const [newGatNumber, setNewGatNumber] = useState("");
  const [newGatName, setNewGatName] = useState("");
  const [newGatAxis, setNewGatAxis] = useState("Eixo 1");
  const [newGatDesc, setNewGatDesc] = useState("");
  const [editingGatOriginalNumber, setEditingGatOriginalNumber] = useState<
    string | null
  >(null);
  const [editingGat, setEditingGat] = useState<GATInfo | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    fetch("/api/admin/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Falha ao consultar a sessão");
        return response.json() as Promise<{
          configured: boolean;
          authenticated: boolean;
        }>;
      })
      .then(({ configured, authenticated }) => {
        if (!configured) {
          setAccessStatus("unconfigured");
        } else {
          setAccessStatus(authenticated ? "authenticated" : "unauthenticated");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setAccessStatus("unavailable");
      });

    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setAccessStatus("checking");
    setPinInput("");
    setPinError(null);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setPinError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (response.ok) {
        setAccessStatus("authenticated");
        setPinInput("");
        return;
      }

      if (response.status === 503) {
        setAccessStatus("unconfigured");
        return;
      }

      setPinError(
        response.status === 401
          ? "PIN incorreto. Tente novamente."
          : "Não foi possível validar o acesso.",
      );
    } catch {
      setPinError("Servidor indisponível. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    setPinError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) throw new Error("Falha ao encerrar a sessão");

      setAccessStatus("unauthenticated");
      setPinInput("");
    } catch {
      setPinError("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // AÇÕES: FUNÇÕES / TIPOS DE PESSOAS (ROLES) - COM EDIÇÃO
  // ============================================================

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRoleName.trim();
    if (!clean) return;
    if (roles.some((r) => r.toLowerCase() === clean.toLowerCase())) {
      await alert({
        title: "Perfil existente",
        message: "Este perfil já está cadastrado.",
        variant: "warning",
      });
      return;
    }
    const updated = [...roles, clean];
    saveRoles(updated);
    onRolesChange(updated);
    setNewRoleName("");
  };

  const handleStartEditRole = (role: string) => {
    setEditingRoleOriginal(role);
    setEditingRoleNewName(role);
  };

  const handleSaveEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoleOriginal) return;
    const clean = editingRoleNewName.trim();
    if (!clean) return;

    if (
      clean.toLowerCase() !== editingRoleOriginal.toLowerCase() &&
      roles.some((r) => r.toLowerCase() === clean.toLowerCase())
    ) {
      await alert({
        title: "Nome Existente",
        message: "Já existe outro perfil com este nome.",
        variant: "warning",
      });
      return;
    }

    updateRoleName(editingRoleOriginal, clean);
    const updatedRoles = roles.map((r) =>
      r === editingRoleOriginal ? clean : r,
    );
    onRolesChange(updatedRoles);

    // Atualiza usuários em tela
    const updatedProfiles = profiles.map((p) =>
      p.role === editingRoleOriginal ? { ...p, role: clean } : p,
    );
    onProfilesChange?.(updatedProfiles);

    setEditingRoleOriginal(null);
    setEditingRoleNewName("");
  };

  const handleDeleteRole = async (roleToDelete: string) => {
    const ok = await confirm({
      title: "Excluir perfil",
      message: `Deseja realmente excluir o perfil "${roleToDelete}"?`,
      confirmText: "Excluir",
      variant: "danger",
    });
    if (ok) {
      const updated = roles.filter((r) => r !== roleToDelete);
      saveRoles(updated);
      onRolesChange?.(updated);
    }
  };

  // ============================================================
  // AÇÕES: GRUPOS TUTORIAIS (GATS) - COM EDIÇÃO
  // ============================================================

  const handleAddGat = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = newGatNumber.trim().padStart(2, "0");
    const name = newGatName.trim();
    if (!num || !name) return;

    if (gats[num]) {
      await alert({
        title: "GAT Existente",
        message: `O GAT ${num} já existe.`,
        variant: "warning",
      });
      return;
    }

    const updated: Record<string, GATInfo> = {
      ...gats,
      [num]: {
        number: num,
        name,
        fullName: `GAT ${num} (${name})`,
        axis: newGatAxis.trim() || "Eixo 1",
        description: newGatDesc.trim() || `GAT ${num}`,
      },
    };

    saveGats(updated);
    onGatsChange(updated);

    setNewGatNumber("");
    setNewGatName("");
    setNewGatDesc("");
  };

  const handleStartEditGat = (num: string, info: GATInfo) => {
    setEditingGatOriginalNumber(num);
    setEditingGat({ ...info });
  };

  const handleSaveEditGat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGatOriginalNumber || !editingGat) return;

    const num = editingGat.number.trim().padStart(2, "0");
    const name = editingGat.name.trim();
    if (!num || !name) return;

    // Se mudou o número e o novo número já existe em outro GAT
    if (num !== editingGatOriginalNumber && gats[num]) {
      await alert({
        title: "GAT Existente",
        message: `O GAT ${num} já existe.`,
        variant: "warning",
      });
      return;
    }

    const finalGat: GATInfo = {
      ...editingGat,
      number: num,
      name,
      fullName: `GAT ${num} (${name})`,
    };

    updateGatInfo(editingGatOriginalNumber, finalGat);

    const updatedGats = { ...gats };
    if (editingGatOriginalNumber !== num) {
      delete updatedGats[editingGatOriginalNumber];
    }
    updatedGats[num] = finalGat;
    onGatsChange(updatedGats);

    // Atualiza participantes em tela
    const updatedProfiles = profiles.map((p) => {
      if (p.gatNumber === editingGatOriginalNumber) {
        return {
          ...p,
          gatNumber: num,
          gatName: name,
        };
      }
      return p;
    });
    onProfilesChange?.(updatedProfiles);

    setEditingGatOriginalNumber(null);
    setEditingGat(null);
  };

  const handleDeleteGat = async (gatNum: string) => {
    const ok = await confirm({
      title: "Excluir GAT",
      message: `Deseja realmente excluir o GAT ${gatNum}?`,
      confirmText: "Excluir",
      variant: "danger",
    });
    if (ok) {
      const updated = { ...gats };
      delete updated[gatNum];
      saveGats(updated);
      onGatsChange?.(updated);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} label="Configurações locais">
      <div
        className="w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-line bg-surface shadow-[var(--page-shadow)] flex flex-col max-h-[92dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-canvas">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Shield className="size-5 sm:size-6 text-brand-text shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-ink">
              Configurações Locais
            </h3>
            {accessStatus === "authenticated" && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-text/10 text-brand-text border border-brand-text/20 font-semibold hidden sm:inline-block">
                Sessão validada
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {accessStatus === "authenticated" && (
              <button
                aria-label="Encerrar sessão das configurações"
                type="button"
                onClick={handleLogout}
                disabled={isSubmitting}
                className="min-h-[40px] px-3 rounded-xl text-body hover:text-danger hover:bg-raised text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Encerrar sessão das configurações"
              >
                <LogOut className="size-4" />
                <span>Sair</span>
              </button>
            )}
            <button
              aria-label="Fechar painel"
              onClick={handleClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted hover:text-ink hover:bg-raised cursor-pointer transition-colors"
              title="Fechar painel"
            >
              <X className="size-5 sm:size-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {accessStatus === "checking" ? (
          <div
            className="p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4"
            role="status"
          >
            <Lock className="size-7 text-brand-text animate-pulse" />
            <p className="text-sm text-body">Verificando sessão do painel...</p>
          </div>
        ) : accessStatus !== "authenticated" ? (
          /* TELA DE BLOQUEIO LOCAL VALIDADO PELO SERVIDOR */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-5">
            <div className="size-14 sm:size-16 rounded-2xl bg-brand-text/10 border border-brand-text/20 flex items-center justify-center text-brand-text">
              <Lock className="size-6 sm:size-7" />
            </div>
            <div>
              <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-ink">
                Configurações Locais
              </h4>
              <p className="text-xs sm:text-sm text-body mt-1.5 max-w-md">
                Digite o PIN para acessar as configurações de GATs e funções
                deste navegador.
              </p>
            </div>

            {accessStatus === "unconfigured" ? (
              <p
                className="w-full max-w-md rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
                role="alert"
              >
                Bloqueio indisponível: configure ADMIN_PIN_HASH e
                ADMIN_SESSION_SECRET no servidor.
              </p>
            ) : accessStatus === "unavailable" ? (
              <p
                className="w-full max-w-md rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger"
                role="alert"
              >
                Não foi possível consultar o servidor. Feche o painel e tente
                novamente.
              </p>
            ) : (
              <form
                onSubmit={handleLogin}
                className="w-full max-w-sm space-y-4 pt-2"
              >
                <div>
                  <input
                    aria-label="Digite o PIN de acesso"
                    type="password"
                    autoFocus
                    autoComplete="current-password"
                    maxLength={128}
                    placeholder="Digite o PIN de acesso"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (pinError) setPinError(null);
                    }}
                    className={`w-full text-center px-4 py-3 min-h-[48px] text-base sm:text-lg tracking-widest font-mono rounded-xl bg-canvas border ${
                      pinError
                        ? "border-danger text-danger"
                        : "border-line text-ink"
                    } outline-none focus:border-brand-text transition-colors`}
                  />
                  {pinError && (
                    <p className="text-xs text-danger mt-2 flex items-center justify-center gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      {pinError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !pinInput.trim()}
                  className="w-full min-h-[48px] py-3 px-6 text-sm sm:text-base font-bold rounded-xl bg-brand text-on-brand hover:bg-brand-strong transition-all cursor-pointer shadow-[var(--page-shadow)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Validando..." : "Acessar Painel"}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* PAINEL COMPLETO COM ABAS */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navegação de Abas */}
            <div className="flex border-b border-line bg-canvas text-xs sm:text-sm font-semibold px-3 sm:px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("roles")}
                className={`min-h-[48px] py-3 px-3.5 sm:px-4 flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "roles"
                    ? "border-brand-text text-brand-text"
                    : "border-transparent text-muted hover:text-body"
                }`}
              >
                <Briefcase className="size-4" />
                <span>Perfis ({roles.length})</span>
              </button>
              <button
                onClick={() => setActiveTab("gats")}
                className={`min-h-[48px] py-3 px-3.5 sm:px-4 flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeTab === "gats"
                    ? "border-brand-text text-brand-text"
                    : "border-transparent text-muted hover:text-body"
                }`}
              >
                <Layers className="size-4" />
                <span>GATs ({Object.keys(gats).length})</span>
              </button>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
              {/* ============================================================
                  ABA 1: FUNÇÕES / TIPOS DE PESSOAS (ROLES) - COM EDIÇÃO
                  ============================================================ */}
              {activeTab === "roles" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-body">
                      Configure os tipos de participantes e vínculos permitidos
                      no projeto (SUS/UFG).
                    </span>
                  </div>

                  <form
                    onSubmit={handleAddRole}
                    className="flex flex-col sm:flex-row gap-2.5"
                  >
                    <input
                      aria-label="Ex: Pesquisador, Bolsista de Extensão, Coordenador de Eixo..."
                      type="text"
                      required
                      placeholder="Ex: Pesquisador, Bolsista de Extensão, Coordenador de Eixo..."
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="flex-1 min-h-[46px] px-4 py-2.5 text-sm sm:text-base rounded-xl bg-canvas border border-line text-ink outline-none focus:border-brand-text transition-colors"
                    />
                    <button
                      type="submit"
                      className="min-h-[46px] px-5 py-2.5 text-sm sm:text-base font-semibold rounded-xl bg-brand text-on-brand hover:bg-brand-strong cursor-pointer flex items-center justify-center gap-2 transition-all shadow-[var(--page-shadow)]"
                    >
                      <Plus className="size-4" />
                      <span>Adicionar perfil</span>
                    </button>
                  </form>

                  {/* Lista de Funções com Edição */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {roles.map((r) => {
                      const isEditing = editingRoleOriginal === r;

                      if (isEditing) {
                        return (
                          <form
                            key={r}
                            onSubmit={handleSaveEditRole}
                            className="p-3 rounded-xl border border-brand-text/40 bg-brand-text/10 flex items-center gap-2"
                          >
                            <input
                              type="text"
                              required
                              autoFocus
                              value={editingRoleNewName}
                              onChange={(e) =>
                                setEditingRoleNewName(e.target.value)
                              }
                              className="flex-1 min-h-[40px] px-3 py-1.5 text-sm rounded-lg bg-surface border border-line text-ink outline-none focus:border-brand-text"
                            />
                            <button
                              aria-label="Salvar alteração"
                              type="submit"
                              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-brand text-on-brand hover:bg-brand-strong cursor-pointer"
                              title="Salvar alteração"
                            >
                              <Check className="size-4" />
                            </button>
                            <button
                              aria-label="Cancelar"
                              type="button"
                              onClick={() => setEditingRoleOriginal(null)}
                              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted hover:bg-raised cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="size-4" />
                            </button>
                          </form>
                        );
                      }

                      return (
                        <div
                          key={r}
                          className="p-3.5 sm:p-4 rounded-xl border border-line bg-canvas flex items-center justify-between hover:border-line transition-colors"
                        >
                          <div>
                            <div className="text-sm sm:text-base font-semibold text-body">
                              {r}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              aria-label="Editar nome do perfil"
                              type="button"
                              onClick={() => handleStartEditRole(r)}
                              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted hover:text-brand-text hover:bg-raised cursor-pointer transition-colors"
                              title="Editar nome do perfil"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              aria-label="Excluir perfil"
                              type="button"
                              onClick={() => handleDeleteRole(r)}
                              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-raised cursor-pointer transition-colors"
                              title="Excluir perfil"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================
                  ABA 2: GRUPOS TUTORIAIS (GATS) - COM EDIÇÃO
                  ============================================================ */}
              {activeTab === "gats" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-body">
                      Cadastre novos GATs ou ajuste a estrutura temática
                      territorial.
                    </span>
                  </div>

                  {/* Edição de GAT Selecionado */}
                  {editingGat && (
                    <form
                      onSubmit={handleSaveEditGat}
                      className="p-4 sm:p-5 rounded-2xl border border-brand-text/40 bg-brand-text/10 space-y-4 animate-fade-in"
                    >
                      <div className="font-bold text-base text-brand-text">
                        Editando GAT {editingGatOriginalNumber}:{" "}
                        {editingGat.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label
                            htmlFor="adminmodal-field-1"
                            className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                          >
                            Número
                          </label>
                          <input
                            id="adminmodal-field-1"
                            type="text"
                            required
                            value={editingGat.number}
                            onChange={(e) =>
                              setEditingGat({
                                ...editingGat,
                                number: e.target.value,
                              })
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="adminmodal-field-2"
                            className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                          >
                            Nome / Bioma
                          </label>
                          <input
                            id="adminmodal-field-2"
                            type="text"
                            required
                            value={editingGat.name}
                            onChange={(e) =>
                              setEditingGat({
                                ...editingGat,
                                name: e.target.value,
                              })
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="adminmodal-field-3"
                            className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                          >
                            Eixo Temático
                          </label>
                          <select
                            id="adminmodal-field-3"
                            value={editingGat.axis}
                            onChange={(e) =>
                              setEditingGat({
                                ...editingGat,
                                axis: e.target.value,
                              })
                            }
                            className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text cursor-pointer"
                          >
                            {Array.from(new Set([...AXIS_OPTIONS, editingGat.axis])).map((axis) => (
                              <option key={axis} value={axis}>{axis}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="adminmodal-field-4"
                          className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                        >
                          Tema do GAT
                        </label>
                        <input
                          id="adminmodal-field-4"
                          type="text"
                          value={editingGat.description}
                          onChange={(e) =>
                            setEditingGat({
                              ...editingGat,
                              description: e.target.value,
                            })
                          }
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text"
                        />
                      </div>
                      <div className="dialog-actions pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGatOriginalNumber(null);
                            setEditingGat(null);
                          }}
                          className="min-h-[44px] px-4 py-2 rounded-xl text-body hover:bg-raised text-sm font-semibold cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="min-h-[44px] px-5 py-2 font-semibold text-sm rounded-xl bg-brand text-on-brand hover:bg-brand-strong cursor-pointer transition-all"
                        >
                          Salvar GAT
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Adicionar Novo GAT */}
                  <form
                    onSubmit={handleAddGat}
                    className="p-4 sm:p-5 rounded-2xl border border-line bg-canvas space-y-4"
                  >
                    <div className="font-bold text-base text-ink">
                      Adicionar Novo GAT
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label
                          htmlFor="adminmodal-field-5"
                          className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                        >
                          Número (ex: 06)
                        </label>
                        <input
                          id="adminmodal-field-5"
                          type="text"
                          required
                          placeholder="06"
                          value={newGatNumber}
                          onChange={(e) => setNewGatNumber(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adminmodal-field-6"
                          className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                        >
                          Nome / Bioma (ex: Guariroba)
                        </label>
                        <input
                          id="adminmodal-field-6"
                          type="text"
                          required
                          placeholder="Nome do fruto ou árvore..."
                          value={newGatName}
                          onChange={(e) => setNewGatName(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="adminmodal-field-7"
                          className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                        >
                          Eixo Temático
                        </label>
                        <select
                          id="adminmodal-field-7"
                          value={newGatAxis}
                          onChange={(e) => setNewGatAxis(e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text cursor-pointer"
                        >
                          {Array.from(new Set([...AXIS_OPTIONS, newGatAxis])).map((axis) => (
                            <option key={axis} value={axis}>{axis}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="adminmodal-field-8"
                        className="block text-xs sm:text-sm text-body font-medium mb-1.5"
                      >
                        Tema do GAT
                      </label>
                      <input
                        id="adminmodal-field-8"
                        type="text"
                        placeholder="Ex: Vigilância de arboviroses na Região Norte..."
                        value={newGatDesc}
                        onChange={(e) => setNewGatDesc(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 text-sm sm:text-base rounded-xl bg-surface border border-line text-ink outline-none focus:border-brand-text"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="min-h-[44px] px-5 py-2.5 font-semibold text-sm rounded-xl bg-brand text-on-brand hover:bg-brand-strong cursor-pointer flex items-center gap-2 transition-all shadow-[var(--page-shadow)]"
                      >
                        <Plus className="size-4" />
                        <span>Adicionar GAT</span>
                      </button>
                    </div>
                  </form>

                  {/* Cards de GATs Atuais com Edição */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {sortedGats(gats).map((info) => {
                      const num = info.number;
                      return (
                        <div
                          key={num}
                          className="p-4 sm:p-5 rounded-2xl border border-line bg-canvas flex flex-col justify-between hover:border-line transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm sm:text-base font-bold text-brand-text">
                                GAT {num}: {info.name}
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-md bg-raised text-body font-medium">
                                {info.axis}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-body leading-relaxed mb-3">
                              {info.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-end pt-2.5 border-t border-line">
                            <div className="flex items-center gap-1.5">
                              <button
                                aria-label="Editar GAT"
                                type="button"
                                onClick={() => handleStartEditGat(num, info)}
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted hover:text-brand-text hover:bg-raised cursor-pointer transition-colors"
                                title="Editar GAT"
                              >
                                <Edit2 className="size-4" />
                              </button>
                              <button
                                aria-label="Excluir GAT"
                                type="button"
                                onClick={() => handleDeleteGat(num)}
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-raised cursor-pointer transition-colors"
                                title="Excluir GAT"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
