"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  UserProfile,
  Activity,
  UserRole,
  GATInfo,
  ActivityTemplate,
} from "@/types";
import { PROGRAM } from "@/config/program";
import {
  getStoredProfiles,
  getProfilesForAccess,
  getActiveProfile,
  setActiveProfileId,
  getActivitiesForMonth,
  saveActivitiesForMonth,
  loadSampleActivitiesForUser,
  exportUserData,
  applyUserData,
  inspectUserData,
  getRestoreDiagnostic,
  type RestoreCode,
  getStoredGats,
  getStoredRoles,
  getStoredTemplates,
  registerProfile,
  updateUserProfileAdmin,
  deleteUserProfile,
  getProfileActivitySummary,
} from "@/lib/storage";
import {
  decodeAttachments,
  deleteProfileAttachments,
  encodeAttachments,
  listAttachments,
  listProfileAttachments,
  prepareAttachmentPages,
  type Attachment,
} from "@/lib/attachments";
import { buildProfileBackup, restoreWithAttachments } from "@/lib/attachment-backup";
import { fileSlug, saveJsonFile } from "@/lib/download";
import {
  calcPetHours,
  calcPetMinutes,
  formatDuration,
  sumActivityMinutes,
  getMonthYearLabel,
  formatDateBR,
  cleanActivityDescription,
  sortActivitiesChronologically,
  getCurrentMonth,
  PROJECT_MONTHS,
  pluralize,
} from "@/lib/pet-calculator";
import { Navbar } from "@/components/Navbar";
import { ProfileModal } from "@/components/ProfileModal";
import { AdminModal } from "@/components/AdminModal";
import { StatsGrid } from "@/components/StatsGrid";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityTable } from "@/components/ActivityTable";
import { EditActivityModal } from "@/components/EditActivityModal";
import { OfficialSheet } from "@/components/OfficialSheet";
import { MonthlyAttachments } from "@/components/MonthlyAttachments";
import { LandingPage } from "@/components/LandingPage";
import { ExitModal } from "@/components/ExitModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { SiteFooter } from "@/components/SiteFooter";
import { HelpModal } from "@/components/Help";
import {
  DeleteProfileModal,
  type DeleteProfileSummary,
} from "@/components/DeleteProfileModal";
import {
  Calendar,
  Download,
  Printer,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useDialog } from "@/context/DialogContext";

export default function Home() {
  const { alert, confirm } = useDialog();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  // Como a sessão termina: Concluir, Trocar participante ou Sair (menu).
  const [exitMode, setExitMode] = useState<"conclude" | "switch" | "exit">(
    "conclude",
  );
  // "switch" abre a entrada na aba Continuar, com foco na lista de perfis.
  const [entryIntent, setEntryIntent] = useState<"default" | "switch">(
    "default",
  );
  const [monthKey, setMonthKey] = useState(getCurrentMonth);
  const [ready, setReady] = useState(false);
  const [draftDirty, setDraftDirty] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [restoreIssue, setRestoreIssue] = useState<{
    code: RestoreCode;
    message: string;
  } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const importInProgress = useRef(false);
  const [formRevision, setFormRevision] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "official">(
    "dashboard",
  );
  const [showBlankTemplate, setShowBlankTemplate] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [attachmentsBusy, setAttachmentsBusy] = useState(false);
  const [preparingPrint, setPreparingPrint] = useState(false);
  const printInProgress = useRef(false);
  const printSheetRef = useRef<HTMLDivElement>(null);
  const printAttachmentsRef = useRef<HTMLDivElement>(null);
  const clearPrintAttachments = useRef<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Perfil aberto no modal de identificação a partir da entrada (Editar).
  const [entryEditing, setEntryEditing] = useState<UserProfile | null>(null);
  // Perfil em exclusão e o que será apagado (attachments null = não foi possível ler).
  const [deleting, setDeleting] = useState<{
    profile: UserProfile;
    summary: DeleteProfileSummary;
  } | null>(null);

  const activeProfileId = activeUser?.id;
  useEffect(() => () => clearPrintAttachments.current?.(), [activeProfileId, monthKey, showBlankTemplate]);

  // Estados Dinâmicos de Configuração (GATs, Funções e Templates)
  const [gats, setGats] = useState<Record<string, GATInfo>>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);

  // Inicialização Local-First
  useEffect(() => {
    try {
      const loadedProfiles = getStoredProfiles();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Browser records are hydrated after SSR to preserve the existing local storage contract.
      setProfiles(loadedProfiles);

      const loadedGats = getStoredGats();
      setGats(loadedGats);

      const loadedRoles = getStoredRoles();
      setRoles(loadedRoles);

      const loadedTemplates = getStoredTemplates();
      setTemplates(loadedTemplates);

      const urlParams =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      if (urlParams?.get("admin") === "1") {
        setIsAdminModalOpen(true);
      }

      setReady(true);
      const active = getActiveProfile();
      if (active) {
        setActiveUser(active);
        const acts = getActivitiesForMonth(active.id, monthKey);
        setActivities(sortActivitiesChronologically(acts));
      } else {
        setActiveUser(null);
      }
    } catch {
      setStorageError(
        "Leitura indisponível. Permita o armazenamento neste navegador para acessar e salvar sua folha.",
      );
      setReady(true);
    }
  }, [monthKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectProfile = (user: UserProfile) => {
    try {
      setActiveProfileId(user.id);
      const acts = getActivitiesForMonth(user.id, monthKey);
      setActiveUser(user);
      setActivities(sortActivitiesChronologically(acts));
      setEditingActivity(null);
      setHasChanges(false);
      setDraftDirty(false);
      setStorageError("");
    } catch {
      setStorageError(
        "Não foi possível abrir o perfil. Permita o armazenamento neste navegador e tente novamente.",
      );
    }
  };

  const confirmDraft = async () => {
    if (!draftDirty) return true;
    const discard = await confirm({
      title: "Atividade ainda não adicionada",
      message:
        "O formulário tem alterações. Deseja descartá-las para continuar?",
      confirmText: "Descartar preenchimento",
      cancelText: "Continuar editando",
      variant: "warning",
    });
    if (discard) {
      setDraftDirty(false);
      setFormRevision((revision) => revision + 1);
    }
    return discard;
  };

  const changeMonth = async (value: string) => {
    if (value === monthKey) return;
    // Sem rascunho, troca o mês no mesmo evento: o select é controlado e um
    // await aqui faria o React restaurar o valor antigo até o estado mudar.
    if (draftDirty && !(await confirmDraft())) return;
    setDraftDirty(false);
    setEditingActivity(null);
    setMonthKey(value);
  };

  const openConclusion = async () => {
    if (await confirmDraft()) {
      setDraftDirty(false);
      setExitMode("conclude");
      setIsExitModalOpen(true);
    }
  };

  const endSession = (mode: "conclude" | "switch" | "exit") => {
    setDraftDirty(false);
    setActiveTab("dashboard");
    setIsExitModalOpen(false);
    setActiveProfileId(null);
    setActiveUser(null);
    setActivities([]);
    setEditingActivity(null);
    setHasChanges(false);
    setEntryIntent(mode === "switch" ? "switch" : "default");
    if (mode !== "switch") showToast("Sessão encerrada com sucesso.");
  };

  /**
   * Trocar participante e Sair (menu do topo) seguem as proteções do
   * Concluir: rascunho no formulário pede confirmação (confirmDraft); com
   * alterações sem cópia, abre a mesma janela do Concluir, que lembra de
   * salvar a cópia sem impedir a saída.
   */
  const leaveSession = async (mode: "switch" | "exit") => {
    if (!(await confirmDraft())) return;
    setDraftDirty(false);
    if (hasChanges) {
      setExitMode(mode);
      setIsExitModalOpen(true);
      return;
    }
    endSession(mode);
  };

  const persistActivities = (next: Activity[], message: string): boolean => {
    if (!activeUser) return false;
    try {
      const sorted = sortActivitiesChronologically(next);
      saveActivitiesForMonth(activeUser.id, monthKey, sorted);
      setActivities(sorted);
      setHasChanges(true);
      setStorageError("");
      showToast(message);
      return true;
    } catch {
      setStorageError(
        "Não foi possível salvar. Verifique o espaço e as permissões do navegador. Seu preenchimento foi mantido; tente novamente.",
      );
      return false;
    }
  };

  /**
   * Grava a identificação pelo storage, que recusa nome igual ao de outro
   * perfil (normalizeName): saveProfiles desduplica por nome e, sem essa
   * checagem, um nome repetido apagaria o outro perfil.
   */
  const handleSaveProfile = (updated: UserProfile) => {
    try {
      const result = updateUserProfileAdmin(updated);
      if (!result.success) return false;
      const stored = getStoredProfiles();
      setProfiles(stored);
      const saved = stored.find((profile) => profile.id === updated.id) ?? updated;
      if (activeUser?.id === updated.id) {
        setActiveUser(saved);
        setHasChanges(true);
      }
      showToast("Identificação atualizada.");
      return true;
    } catch {
      setStorageError(
        "Não foi possível salvar a identificação. Verifique o armazenamento e tente novamente.",
      );
      return false;
    }
  };

  const handleCreateNewProfile = async (
    name: string,
    gatNumber: string,
    role: UserRole,
  ) => {
    try {
      const result = registerProfile({ name, role, gatNumber });
      if (result.existingUser) {
        const user = result.existingUser;
        const resume = await confirm({
          title: "Sua folha já está neste navegador",
          message: `${user.name} · ${user.role} · GAT ${user.gatNumber}. Você pode continuar com este perfil e escolher o mês, sem precisar do arquivo anterior.`,
          confirmText: "Continuar com este perfil",
          cancelText: "Voltar",
          variant: "info",
        });
        if (resume) handleSelectProfile(user);
        return;
      }
      if (!result.success || !result.user) {
        await alert({
          title: "Confira a identificação",
          message: result.error || "Não foi possível criar o perfil.",
          variant: "warning",
        });
        return;
      }
      setProfiles(getStoredProfiles());
      handleSelectProfile(result.user);
    } catch {
      setStorageError(
        "Não foi possível guardar o perfil. Permita o armazenamento neste navegador e tente novamente.",
      );
    }
  };

  // Manipulação de Atividades (Salvar / Editar / Excluir)
  const handleSaveActivity = (
    data: Omit<Activity, "id" | "hours">,
    editingId?: string,
  ) => {
    if (!activeUser) return false;
    if (
      !data.date.startsWith(monthKey) ||
      calcPetMinutes(data.start, data.end) <= 0
    ) {
      setStorageError(
        "Confira a data e os horários: a atividade deve pertencer ao mês selecionado e o fim deve ser posterior ao início.",
      );
      return false;
    }
    const hours = calcPetHours(data.start, data.end);
    const next = editingId
      ? activities.map((activity) =>
          activity.id === editingId
            ? { ...activity, ...data, id: editingId, hours }
            : activity,
        )
      : [
          ...activities,
          {
            ...data,
            id:
              globalThis.crypto?.randomUUID?.() ??
              `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            hours,
          },
        ];
    const saved = persistActivities(
      next,
      editingId ? "Atividade atualizada." : "Atividade adicionada.",
    );
    if (saved) setEditingActivity(null);
    return saved;
  };

  const handleDeleteActivity = async (id: string) => {
    if (!activeUser) return;
    const act = activities.find((a) => a.id === id);
    const confirmed = await confirm({
      title: "Excluir atividade?",
      message: act
        ? `Deseja realmente remover o registro "${cleanActivityDescription(act.description)}" de ${formatDateBR(act.date)} (${formatDuration(calcPetMinutes(act.start, act.end))})?`
        : "Deseja realmente remover esta atividade da sua folha mensal?",
      confirmText: "Sim, excluir",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!confirmed) return;

    if (editingActivity?.id === id) {
      setEditingActivity(null);
    }
    persistActivities(
      activities.filter((activity) => activity.id !== id),
      "Atividade excluída.",
    );
  };

  const handleLoadSamples = () => {
    if (!activeUser) return;
    try {
      const samples = loadSampleActivitiesForUser(activeUser.id, monthKey);
      persistActivities(
        samples,
        "Exemplos carregados. Substitua pelos seus registros reais.",
      );
    } catch {
      setStorageError(
        "Não foi possível carregar os exemplos. Verifique o armazenamento.",
      );
    }
  };

  const handleClearMonth = () => {
    if (persistActivities([], "Atividades deste mês removidas."))
      setEditingActivity(null);
  };

  const handlePrint = async (blank = showBlankTemplate): Promise<boolean> => {
    const wrapper = printSheetRef.current;
    const proofs = printAttachmentsRef.current;
    if (!wrapper || !proofs || !activeUser || printInProgress.current || attachmentsBusy)
      return false;

    printInProgress.current = true;
    setPreparingPrint(true);
    clearPrintAttachments.current?.();
    try {
      const scope = { profileId: activeUser.id, monthKey };
      const stillCurrent = () =>
        wrapper.isConnected &&
        wrapper.dataset.profileId === scope.profileId &&
        wrapper.dataset.month === scope.monthKey &&
        wrapper.dataset.blank === String(blank);

      if (!stillCurrent()) return false;

      if (!blank) {
        const attachments = await listAttachments(scope).catch(() => null);
        if (!attachments) {
          const proceed = await confirm({
            title: "Imprimir só a folha?",
            message: "O navegador não conseguiu ler os comprovantes deste mês. Você pode tentar novamente ou imprimir apenas a folha oficial.",
            confirmText: "Imprimir só a folha",
            cancelText: "Voltar",
            variant: "warning",
          });
          if (!proceed) return false;
        } else if (attachments.length) {
          const { images, release } = await prepareAttachmentPages(attachments);
          if (!stillCurrent()) {
            release();
            return false;
          }
          proofs.replaceChildren(...images.map((image) => {
            const page = document.createElement("div");
            page.className = "print-attachment-page";
            image.alt = "";
            page.append(image);
            return page;
          }));
          const cleanup = () => {
            proofs.replaceChildren();
            release();
            window.removeEventListener("afterprint", cleanup);
            clearPrintAttachments.current = null;
          };
          clearPrintAttachments.current = cleanup;
          window.addEventListener("afterprint", cleanup, { once: true });
        }
      }

      if (!stillCurrent()) return false;
      window.print();
      return true;
    } catch (error) {
      clearPrintAttachments.current?.();
      await alert({
        title: "Não foi possível preparar o PDF",
        message: error instanceof Error ? error.message : "Tente imprimir novamente.",
        variant: "warning",
      });
      return false;
    } finally {
      printInProgress.current = false;
      setPreparingPrint(false);
    }
  };

  const printParticipantSheet = async () => {
    setShowBlankTemplate(false);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    return handlePrint(false);
  };

  // Exportar Backup Local em JSON
  const handleExportBackup = async (): Promise<boolean> => {
    if (!activeUser || attachmentsBusy) return false;
    let jsonString: string;
    try {
      const items = await listAttachments({ profileId: activeUser.id, monthKey });
      jsonString = exportUserData(activeUser, monthKey, await encodeAttachments(items));
    } catch {
      setStorageError(
        "Não foi possível ler os registros para criar a cópia. Verifique o armazenamento e tente novamente.",
      );
      return false;
    }
    const filename = `backup-frequencia-${fileSlug(activeUser.name)}-${monthKey}.json`;
    const outcome = await saveJsonFile(jsonString, filename);
    if (outcome === "saved") {
      setHasChanges(false);
      showToast("Cópia da folha salva com sucesso!");
      return true;
    }
    if (outcome === "cancelled") {
      showToast("Salvamento cancelado.");
      return false;
    }
    if (outcome === "downloaded") {
      showToast("Download da cópia de segurança iniciado.");
      return true;
    }
    setStorageError(
      "O download não foi iniciado. Tente salvar a cópia novamente.",
    );
    return false;
  };

  /** Cópia do perfil inteiro (1.4), oferecida antes de excluir. */
  const handleExportProfile = async (profile: UserProfile): Promise<boolean> => {
    let json: string;
    try {
      json = await buildProfileBackup(profile);
    } catch {
      await alert({
        title: "Cópia não criada",
        message:
          "Não foi possível ler os registros ou comprovantes deste perfil. Nada foi apagado.",
        variant: "warning",
      });
      return false;
    }
    const outcome = await saveJsonFile(
      json,
      `backup-perfil-completo-${fileSlug(profile.name)}.json`,
    );
    if (outcome === "saved" || outcome === "downloaded") {
      showToast(
        outcome === "saved"
          ? "Cópia do perfil salva."
          : "Download da cópia do perfil iniciado.",
      );
      return true;
    }
    if (outcome === "cancelled") showToast("Salvamento cancelado.");
    return false;
  };

  const requestDeleteProfile = async (profile: UserProfile) => {
    const { months, activities } = getProfileActivitySummary(profile.id);
    let attachments: number | null = null;
    try {
      const stored = await listProfileAttachments(profile.id);
      attachments = Object.values(stored).reduce((total, items) => total + items.length, 0);
    } catch {
      attachments = null;
    }
    setDeleting({ profile, summary: { months, activities, attachments } });
  };

  /**
   * Exclui perfil, atividades de todos os meses e comprovantes. Comprovantes
   * primeiro: se o IndexedDB falhar, nada é apagado e o aviso explica.
   */
  const confirmDeleteProfile = async (): Promise<boolean> => {
    if (!deleting) return false;
    const { profile } = deleting;
    try {
      await deleteProfileAttachments(profile.id);
    } catch {
      await alert({
        title: "Perfil não excluído",
        message:
          "O navegador não conseguiu apagar os comprovantes deste perfil. Nada foi apagado; tente novamente.",
        variant: "warning",
      });
      return false;
    }
    try {
      deleteUserProfile(profile.id);
    } catch {
      setStorageError(
        "Os comprovantes foram apagados, mas o navegador não conseguiu apagar o perfil e as atividades. Tente excluir novamente.",
      );
      return false;
    }
    setProfiles(getStoredProfiles());
    if (activeUser?.id === profile.id) {
      setActiveUser(null);
      setActivities([]);
      setHasChanges(false);
    }
    setDeleting(null);
    showToast(`Perfil de ${profile.name} excluído.`);
    return true;
  };

  // Importar Backup Local em JSON
  const handleImportBackup = async (file: File) => {
    if (importInProgress.current) return;
    importInProgress.current = true;
    if (!(await confirmDraft())) {
      importInProgress.current = false;
      return;
    }
    setRestoring(true);
    setRestoreIssue(null);
    try {
      const content = await file.text();
      const preview = inspectUserData(content);
      if (!preview.success) {
        setRestoreIssue({ code: preview.code, message: preview.error! });
        return;
      }
      const months = preview.months ?? [];
      // Comprovantes por mês; mês sem o campo preserva os já salvos.
      let attachments: Record<string, Attachment[]> | undefined;
      try {
        for (const month of months) {
          if (!month.attachmentData) continue;
          attachments ??= {};
          attachments[month.monthKey] = await decodeAttachments(month.attachmentData);
        }
      } catch (error) {
        setRestoreIssue({
          code: "INVALID_BACKUP",
          message: error instanceof Error ? error.message : "A cópia contém comprovantes inválidos.",
        });
        return;
      }
      const existing = profiles.find(
        (profile) => profile.id === preview.user!.id,
      );
      const contents = attachments === undefined
        ? "A cópia antiga preserva os comprovantes já salvos."
        : "Comprovantes na cópia: " +
          Object.values(attachments).reduce((total, items) => total + items.length, 0) +
          ".";
      const whole = months.length > 1 || preview.months?.[0]?.monthKey !== preview.monthKey;
      const scope = whole
        ? `${pluralize(months.length, "mês", "meses")} · ${pluralize(
            months.reduce((total, month) => total + month.activities.length, 0),
            "atividade",
            "atividades",
          )}`
        : `${getMonthYearLabel(preview.monthKey!)} · ${pluralize(preview.activities!.length, "atividade", "atividades")}`;
      const replaced = whole
        ? "Os dados deste perfil nos meses da cópia serão substituídos. Os outros meses serão preservados."
        : "Os dados deste perfil e deste mês serão substituídos pela cópia. Os outros meses serão preservados.";
      const accepted = await confirm({
        title: "Restaurar esta cópia?",
        message: `${preview.user!.name} · ${scope}. ${contents} ${existing ? replaced : "O perfil e os registros desta cópia serão adicionados neste navegador."}`,
        confirmText: "Restaurar cópia",
        cancelText: "Cancelar",
        variant: "warning",
      });
      if (!accepted) return;
      const result = attachments === undefined
        ? applyUserData(preview)
        : await restoreWithAttachments(preview, attachments);
      if (!result.success) {
        setRestoreIssue({ code: result.code, message: result.error! });
        return;
      }
      setProfiles(getStoredProfiles());
      setMonthKey(result.monthKey!);
      setActiveUser(result.user!);
      setActivities(result.activities!);
      setFormRevision((revision) => revision + 1);
      setDraftDirty(false);
      setHasChanges(false);
      setStorageError("");
      showToast("Cópia restaurada. Confira o mês e os registros.");
    } catch {
      setRestoreIssue({
        code: "STORAGE_FAILED",
        message:
          "Não foi possível ler ou abrir a cópia. Verifique o arquivo e as permissões deste navegador e tente novamente.",
      });
    } finally {
      setRestoring(false);
      importInProgress.current = false;
    }
  };

  const notices = (
    <>
      {storageError && (
        <div className="operation-notice" role="alert">
          <p>{storageError}</p>
        </div>
      )}
      {restoring && (
        <p className="operation-notice" role="status">
          Lendo e conferindo a cópia…
        </p>
      )}
      {restoreIssue && (
        <div className="operation-notice" role="alert">
          <strong>Não foi possível restaurar</strong>
          <p>{restoreIssue.message}</p>
          <details>
            <summary>Detalhes para suporte</summary>
            <p>
              Estes detalhes não incluem seus registros. Selecione e copie se
              precisar pedir ajuda.
            </p>
            <pre tabIndex={0}>{getRestoreDiagnostic(restoreIssue.code)}</pre>
          </details>
          <button
            className="secondary-button"
            onClick={() => setRestoreIssue(null)}
          >
            Fechar aviso
          </button>
        </div>
      )}
    </>
  );

  if (!ready)
    return (
      <main className="loading-sheet" aria-busy="true">
        Abrindo sua folha…
      </main>
    );

  // Se não houver participante ativo, exibir Landing Page informativa e privada
  if (!activeUser) {
    return (
      <>
        {notices}
        <LandingPage
          profiles={getProfilesForAccess(profiles)}
          onSelectProfile={handleSelectProfile}
          initialTab={entryIntent === "switch" ? "local" : undefined}
          focusAccess={entryIntent === "switch"}
          profileSummaries={Object.fromEntries(
            profiles.map((profile) => [
              profile.id,
              getProfileActivitySummary(profile.id),
            ]),
          )}
          onEditProfile={setEntryEditing}
          onDeleteProfile={(profile) => void requestDeleteProfile(profile)}
          onLoginWithJson={handleImportBackup}
          onCreateProfile={handleCreateNewProfile}
          gats={gats}
          roles={roles}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
        />

        {entryEditing && (
          <ProfileModal
            isOpen
            onClose={() => setEntryEditing(null)}
            currentUser={entryEditing}
            allProfiles={profiles}
            gats={gats}
            roles={roles}
            onSaveProfile={handleSaveProfile}
          />
        )}

        <DeleteProfileModal
          isOpen={Boolean(deleting)}
          profile={deleting?.profile ?? null}
          summary={deleting?.summary ?? null}
          onClose={() => setDeleting(null)}
          onSaveCopy={() =>
            deleting ? handleExportProfile(deleting.profile) : Promise.resolve(false)
          }
          onConfirm={confirmDeleteProfile}
        />

        {/* Modal de configurações locais */}
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          profiles={profiles}
          gats={gats}
          roles={roles}
          templates={templates}
          onProfilesChange={(updated) => {
            setProfiles(updated);
          }}
          onGatsChange={(updated) => setGats(updated)}
          onRolesChange={(updated) => setRoles(updated)}
          onTemplatesChange={(updated) => setTemplates(updated)}
        />

        {/* Modal de Feedback & Avaliação */}
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />

        {/* Toast Notificação */}
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-4 right-4 left-4 sm:left-auto px-3.5 py-2 rounded-lg border border-brand-text/25 bg-surface shadow-[var(--page-shadow)] text-sm font-medium text-body z-50 flex items-center gap-2 animate-fade-in"
          >
            <CheckCircle2 className="size-3.5 text-brand-text shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // Soma em minutos inteiros: CH exata sem erro de ponto flutuante.
  const totalMinutes = sumActivityMinutes(activities);
  const monthLabel = getMonthYearLabel(monthKey);

  return (
    <>
      <div className="screen-only dashboard-shell">
        {/* Header Superior Fixo com Blur */}
        <Navbar
          user={activeUser}
          activeTab={activeTab}
          onTabChange={async (tab) => {
            if (tab === activeTab || (await confirmDraft())) {
              setDraftDirty(false);
              setActiveTab(tab);
            }
          }}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          hasChanges={hasChanges}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenExitModal={openConclusion}
          onOpenFeedback={() => setIsFeedbackModalOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onSwitchParticipant={() => void leaveSession("switch")}
          onSignOut={() => void leaveSession("exit")}
        />

        <main id="conteudo" className="workspace-main" data-tab={activeTab}>
          {notices}
          <div className="workspace-overview">
            <div>
              <h1>
                {activeTab === "dashboard"
                  ? "Minha frequência"
                  : "Folha oficial"}
              </h1>
              <p>
                {activeTab === "dashboard"
                  ? `GAT ${activeUser.gatNumber} · ${activeUser.gatName || gats[activeUser.gatNumber]?.name || "PET"}`
                  : "Confira os dados antes de imprimir e assinar."}
              </p>
            </div>
            <label className="workspace-month">
              <Calendar className="size-4 text-brand-text" />
              <span>Mês</span>
              <select
                aria-label="Mês da folha"
                value={monthKey}
                onChange={(e) => void changeMonth(e.target.value)}
              >
                {Array.from(new Set([...PROJECT_MONTHS, monthKey]))
                  .sort()
                  .map((month) => (
                    <option key={month} value={month}>
                      {getMonthYearLabel(month)}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          {/* ABA 1: PAINEL DE LANÇAMENTOS */}
          {activeTab === "dashboard" && (
            <div>
              <StatsGrid
                totalMinutes={totalMinutes}
                activitiesCount={activities.length}
                targetHours={PROGRAM.monthlyTargetHours}
                monthLabel={monthLabel}
              />
              <div className="frequency-workbench">
                <ActivityForm
                  key={`${activeUser.id}-${monthKey}-${formRevision}`}
                  monthKey={monthKey}
                  onDirtyChange={setDraftDirty}
                  onSave={handleSaveActivity}
                  defaultGatNumber={activeUser.gatNumber}
                  defaultGatName={
                    activeUser.gatName || gats[activeUser.gatNumber]?.name
                  }
                  templates={templates}
                />

                <ActivityTable
                  key={JSON.stringify([activeUser.id, monthKey])}
                  activities={activities}
                  totalMinutes={totalMinutes}
                  editingId={editingActivity ? editingActivity.id : null}
                  onEdit={(act) => setEditingActivity(act)}
                  onDelete={handleDeleteActivity}
                  user={activeUser}
                  monthLabel={monthLabel}
                  onLoadSamples={handleLoadSamples}
                  onClearMonth={handleClearMonth}
                />
              </div>
              <div className="review-next">
                <p>
                  {PROGRAM.links.activityForm && (
                    <>
                      Registre também as atividades no{" "}
                      <a target="_blank" rel="noopener noreferrer" href={PROGRAM.links.activityForm}>
                        formulário do {PROGRAM.acronym}
                      </a>
                      .{" "}
                    </>
                  )}
                  Terminou? Confira a folha antes de imprimir. {PROGRAM.deadline.label}
                </p>
                <button
                  className="primary-button"
                  onClick={async () => {
                    if (await confirmDraft()) {
                      setDraftDirty(false);
                      setActiveTab("official");
                    }
                  }}
                >
                  Conferir folha <ArrowLeft className="rotate-180" size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ABA 2: FOLHA OFICIAL (PRÉVIA CARTA PAISAGEM) */}
          {activeTab === "official" && (
            <div className="space-y-4 animate-fade-in">
              <div className="sheet-toolbar flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl border border-line bg-surface text-xs shadow-[var(--page-shadow)]">
                {/* Seletor entre Minha Folha e Template Vazio */}
                <div className="sheet-mode-tabs" role="group" aria-label="Tipo de folha">
                  <button
                    type="button"
                    onClick={() => setShowBlankTemplate(false)}
                    className="sheet-mode-option"
                    aria-pressed={!showBlankTemplate}
                  >
                    Minha folha
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBlankTemplate(true)}
                    className="sheet-mode-option"
                    aria-pressed={showBlankTemplate}
                  >
                    Modelo em branco
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {showBlankTemplate && (
                    <a
                      href={PROGRAM.sheet.blankTemplateDocx}
                      download
                      className="px-3 py-1.5 rounded-xl border border-line hover:bg-raised text-body cursor-pointer flex items-center gap-1.5 text-xs font-medium transition-all"
                      title="Baixar o modelo em branco (Word)"
                    >
                      <Download className="size-3.5" />
                      <span>Baixar .docx</span>
                    </a>
                  )}
                  {showBlankTemplate && (
                    <a
                      href={PROGRAM.sheet.blankTemplatePdf}
                      download
                      className="px-3 py-1.5 rounded-xl border border-line hover:bg-raised text-body cursor-pointer flex items-center gap-1.5 text-xs font-medium transition-all"
                      title="Baixar o modelo em branco (PDF)"
                    >
                      <Download className="size-3.5" />
                      <span>Baixar PDF</span>
                    </a>
                  )}
                  <button
                    onClick={() => void handlePrint()}
                    disabled={preparingPrint || attachmentsBusy}
                    aria-busy={preparingPrint}
                    className="px-3.5 py-1.5 rounded-xl font-semibold bg-brand text-on-brand hover:bg-brand-strong cursor-pointer flex items-center gap-1.5 transition-all text-xs shadow-[var(--page-shadow)]"
                  >
                    <Printer className="size-3.5" />
                    <span>{preparingPrint ? "Preparando PDF…" : "Imprimir / salvar PDF"}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="px-3 py-1.5 rounded-xl border border-line hover:bg-raised text-body cursor-pointer flex items-center gap-1 text-xs transition-colors"
                  >
                    <ArrowLeft className="size-3.5" />
                    Voltar
                  </button>
                </div>
                <p className="text-sm text-muted w-full">
                  Na janela de impressão, escolha papel <strong>Carta</strong> e
                  orientação <strong>Horizontal</strong>, como no modelo oficial.
                </p>
              </div>

              <div className="sheet-stage overflow-x-auto max-w-full p-2.5 sm:p-8 md:p-10 bg-canvas rounded-2xl border border-line flex justify-start sm:justify-center shadow-inner">
                <div className="shadow-[var(--page-shadow)] rounded-xs ring-1 ring-line overflow-hidden">
                  <OfficialSheet
                    user={activeUser}
                    monthLabel={monthLabel}
                    activities={activities}
                    totalMinutes={totalMinutes}
                    isBlankTemplate={showBlankTemplate}
                  />
                </div>
              </div>
              {!showBlankTemplate && (
                <MonthlyAttachments
                  key={JSON.stringify([activeUser.id, monthKey, formRevision])}
                  profileId={activeUser.id}
                  monthKey={monthKey}
                  busy={attachmentsBusy || preparingPrint}
                  onBusyChange={setAttachmentsBusy}
                  onChange={() => setHasChanges(true)}
                />
              )}
            </div>
          )}

          {/* Modal de Identificação do Participante */}
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            currentUser={activeUser}
            allProfiles={profiles}
            gats={gats}
            roles={roles}
            onSaveProfile={handleSaveProfile}
          />

          {/* Modal Dedicado de Edição de Atividade */}
          <EditActivityModal
            isOpen={Boolean(editingActivity)}
            onClose={() => setEditingActivity(null)}
            activity={editingActivity}
            onSave={handleSaveActivity}
            defaultGatNumber={activeUser.gatNumber}
            defaultGatName={
              activeUser.gatName || gats[activeUser.gatNumber]?.name
            }
            templates={templates}
            monthKey={monthKey}
          />

          {/* Modal de configurações locais */}
          <AdminModal
            isOpen={isAdminModalOpen}
            onClose={() => setIsAdminModalOpen(false)}
            profiles={profiles}
            gats={gats}
            roles={roles}
            templates={templates}
            onProfilesChange={(updated) => {
              setProfiles(updated);
              if (activeUser && !updated.some((p) => p.id === activeUser.id)) {
                if (updated.length > 0) handleSelectProfile(updated[0]);
              }
            }}
            onGatsChange={(updated) => setGats(updated)}
            onRolesChange={(updated) => setRoles(updated)}
            onTemplatesChange={(updated) => setTemplates(updated)}
          />

          {/* Modal de Saída / Backup Obrigatório */}
          <ExitModal
            isOpen={isExitModalOpen}
            onClose={() => setIsExitModalOpen(false)}
            onConfirmExit={() => endSession(exitMode)}
            leaveLabel={
              exitMode === "switch"
                ? "Trocar participante"
                : exitMode === "exit"
                  ? "Sair"
                  : undefined
            }
            onDownloadJson={handleExportBackup}
            onDownloadPdf={printParticipantSheet}
            userName={activeUser.name}
            hasChanges={hasChanges}
          />

          {/* Modal de Feedback & Avaliação */}
          <FeedbackModal
            isOpen={isFeedbackModalOpen}
            onClose={() => setIsFeedbackModalOpen(false)}
          />

          {/* Toast Notificação Minimalista */}
          {toastMessage && (
            <div
              role="status"
              className="fixed bottom-4 right-4 left-4 sm:left-auto px-3.5 py-2 rounded-lg border border-brand-text/25 bg-surface shadow-[var(--page-shadow)] text-sm font-medium text-body z-50 flex items-center gap-2 animate-fade-in"
            >
              <CheckCircle2 className="size-3.5 text-brand-text shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}
        </main>

        <SiteFooter
          onHelp={() => setIsHelpOpen(true)}
          onFeedback={() => setIsFeedbackModalOpen(true)}
        />
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </div>

      {/* ============================================================
           CONTAINER EXCLUSIVO DE IMPRESSÃO (@media print)
           ============================================================ */}
      <div
        ref={printSheetRef}
        className="print-only-wrapper"
        data-profile-id={activeUser.id}
        data-month={monthKey}
        data-blank={showBlankTemplate}
      >
        <OfficialSheet
          user={activeUser}
          monthLabel={monthLabel}
          activities={activities}
          totalMinutes={totalMinutes}
          isBlankTemplate={showBlankTemplate}
        />
      </div>
      <div ref={printAttachmentsRef} className="print-attachments" aria-hidden="true" />
    </>
  );
}
