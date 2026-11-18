"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Clock,
  Download,
  FileJson,
  FileText,
  Lock,
  Moon,
  Pencil,
  Plus,
  Settings2,
  Sun,
  Trash2,
} from "lucide-react";
import { UserProfile, UserRole, GATInfo, sortedGats } from "@/types";
import { useTheme } from "@/lib/theme";
import { PROGRAM } from "@/config/program";
import { Brand, BrandMark } from "./Brand";
import { FAQ, HelpModal } from "./Help";
import { ReleaseNotes } from "./ReleaseNotes";
import { SiteFooter } from "./SiteFooter";
import { Frame, FrameHeader, FramePanel, SegmentedControl, SegmentedControlItem } from "./ui/access-controls";
import { FullSelect } from "@/components/ui/full-select";
import { RoleChoice } from "./RoleChoice";
import type { ProfileActivitySummary } from "@/lib/storage";

/** Iniciais do cartão: primeira letra do primeiro e do último nome. */
export function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}

export function monthsWithActivities(months: number): string {
  if (!months) return "Nenhum mês com atividades";
  return `${months} ${months === 1 ? "mês" : "meses"} com atividades`;
}

// Exemplo fictício do cartão da entrada, em ordem cronológica. O dia da
// semana sai da data (fuso UTC fixo: servidor e navegador dão o mesmo texto).
const PREVIEW_ROWS = [
  { date: "2026-10-06", title: "Organização do repositório", detail: "16:30 às 18:00 · Assíncrona", ch: "1h30" },
  { date: "2026-10-07", title: "Grupo de estudos", detail: "18:00 às 20:00 · Laboratório", ch: "2h" },
];
const weekdayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
export function weekdayShort(isoDate: string) {
  return weekdayFormat.format(new Date(`${isoDate}T12:00:00Z`)).replace(".", "");
}

interface LandingPageProps {
  onLoginWithJson: (file: File) => void;
  onCreateProfile: (name: string, gatNumber: string, role: UserRole) => void;
  profiles?: UserProfile[];
  onSelectProfile?: (profile: UserProfile) => void;
  gats: Record<string, GATInfo>;
  roles: string[];
  onOpenAdmin: () => void;
  onOpenFeedback: () => void;
  /** Aba inicial; "Trocar participante" abre em "Continuar". */
  initialTab?: "local" | "create" | "upload";
  /** Leva o foco ao cartão de acesso (depois de "Trocar participante"). */
  focusAccess?: boolean;
  /** Meses e atividades de cada perfil, por id. */
  profileSummaries?: Record<string, ProfileActivitySummary>;
  onEditProfile?: (profile: UserProfile) => void;
  onDeleteProfile?: (profile: UserProfile) => void;
}

export function LandingPage({
  onLoginWithJson,
  onCreateProfile,
  profiles = [],
  onSelectProfile,
  gats,
  roles,
  onOpenAdmin,
  onOpenFeedback,
  initialTab,
  focusAccess = false,
  profileSummaries = {},
  onEditProfile,
  onDeleteProfile,
}: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<"local" | "create" | "upload">(
    initialTab ?? (profiles.length ? "local" : "create"),
  );
  useEffect(() => {
    if (!focusAccess) return;
    const heading = document.getElementById("access-title");
    heading?.scrollIntoView({ block: "start" });
    heading?.focus({ preventScroll: true });
  }, [focusAccess]);
  const [name, setName] = useState("");
  const gatList = sortedGats(gats);
  const [gat, setGat] = useState(
    gats[PROGRAM.defaultGat] ? PROGRAM.defaultGat : gatList[0]?.number || "",
  );
  const [role, setRole] = useState(
    roles.includes(PROGRAM.defaultRole) ? PROGRAM.defaultRole : roles[0] || "",
  );
  const [helpOpen, setHelpOpen] = useState(false);
  // Sem perfis (ex.: o último foi excluído), "Continuar" vira "Primeiro acesso".
  const currentTab = tab === "local" && !profiles.length ? "create" : tab;
  const fileRef = useRef<HTMLInputElement>(null);

  function createProfile(event: FormEvent) {
    event.preventDefault();
    if (name.trim() && gat && role) onCreateProfile(name.trim(), gat, role);
  }

  return (
    <div className="entry-page screen-only">
      <a href="#acesso" className="skip-link">
        Pular para o acesso
      </a>
      <header className="entry-header">
        <div className="entry-header-inner">
          <Brand />
          <nav className="entry-anchors" aria-label="Seções da página">
            <a href="#como-funciona">Como funciona</a>
            <a href="#o-que-guardar">O que guardar</a>
            <a href="#perguntas">Dúvidas</a>
          </nav>
          <nav className="entry-tools" aria-label="Preferências">
            {profiles.length > 0 && (
              <a
                className="secondary-button entry-continue"
                href="#acesso"
                onClick={() => setTab("local")}
              >
                Continuar minha folha
              </a>
            )}
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
          </nav>
        </div>
      </header>
      <main className="start-main">
        <section className="entry-hero" aria-labelledby="entry-title">
          <div className="entry-hero-text">
            <BrandMark className="start-brand" />
            <p className="section-kicker">
              {PROGRAM.name} · {PROGRAM.campus}
            </p>
            <h1 id="entry-title">Sua folha do mês, pronta para assinar.</h1>
            <p className="entry-lead">
              Registre cada atividade quando ela acontece. O app soma a CH
              exata e monta a folha oficial do {PROGRAM.acronym} em PDF.
            </p>
            <div className="entry-actions">
              <a
                className="secondary-button"
                href="#acesso"
                onClick={() => setTab(profiles.length ? "local" : "create")}
              >
                {profiles.length ? "Continuar minha folha" : "Começar agora"}
                <ArrowDown size={18} aria-hidden="true" />
              </a>
            </div>
            <p className="entry-privacy">
              <Lock size={16} aria-hidden="true" />
              Sem cadastro e sem senha. Os registros ficam neste aparelho.
            </p>
          </div>
          <figure className="entry-preview" aria-labelledby="entry-preview-caption">
            <figcaption id="entry-preview-caption" className="sr-only">
              Exemplo fictício do resumo do mês: 19 h de {PROGRAM.monthlyTargetHours} h
              e duas atividades.
            </figcaption>
            <div className="preview-card" aria-hidden="true">
              <div className="preview-head">
                <span>Outubro de 2026</span>
                <span className="preview-chip">GAT 01</span>
              </div>
              <p className="preview-total">
                <strong>19</strong> de {PROGRAM.monthlyTargetHours} horas no mês
              </p>
              <span className="preview-bar">
                <span style={{ width: `${(19 / PROGRAM.monthlyTargetHours) * 100}%` }} />
              </span>
              <ul>
                {PREVIEW_ROWS.map((row) => (
                  <li key={row.date}>
                    <span>
                      {weekdayShort(row.date)}
                      <br />
                      {row.date.slice(8)}
                    </span>
                    <span>
                      <strong>{row.title}</strong>
                      <small>{row.detail}</small>
                    </span>
                    <strong>{row.ch}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="preview-rule" aria-hidden="true">
              <Clock size={18} />
              <span>
                <strong>16:30 às 18:00 = 1h30</strong>
                <small>a CH conta o tempo exato</small>
              </span>
            </div>
          </figure>
        </section>
        <div className="start-layout">
          <section id="acesso" aria-labelledby="access-title">
            <Frame>
              <FrameHeader><h2 id="access-title" tabIndex={-1}>Vamos começar</h2></FrameHeader>
              <FramePanel>
                <SegmentedControl aria-label="Como deseja começar">
                  {profiles.length > 0 && (
                    <SegmentedControlItem selected={currentTab === "local"} onClick={() => setTab("local")}>Continuar</SegmentedControlItem>
                  )}
                  <SegmentedControlItem selected={currentTab === "create"} onClick={() => setTab("create")}>Primeiro acesso</SegmentedControlItem>
                  <SegmentedControlItem selected={currentTab === "upload"} onClick={() => setTab("upload")}>Restaurar cópia</SegmentedControlItem>
                </SegmentedControl>
                {currentTab === "local" ? (
                  <div className="start-form">
                    <p className="access-hint">Abra seu perfil e escolha o mês. Você pode começar um novo mês sem o arquivo anterior.</p>
                    <ul className="profile-cards" aria-label="Perfis neste navegador">
                      {profiles.map((profile) => {
                        const detailId = `profile-card-${profile.id}`;
                        const summary = profileSummaries[profile.id];
                        return (
                          <li key={profile.id} className="profile-card">
                            <button
                              type="button"
                              className="profile-card-open"
                              aria-label={`Abrir folha de ${profile.name}`}
                              aria-describedby={detailId}
                              onClick={() => onSelectProfile?.(profile)}
                            >
                              <span className="profile-card-initials" aria-hidden="true">
                                {profileInitials(profile.name)}
                              </span>
                              <span className="profile-card-text">
                                <strong>{profile.name}</strong>
                                <small id={detailId}>
                                  {profile.role} · GAT {profile.gatNumber}
                                  <span className="profile-card-sep" aria-hidden="true"> · </span>
                                  <span className="profile-card-months">
                                    {monthsWithActivities(summary?.months ?? 0)}
                                  </span>
                                </small>
                              </span>
                              <span className="profile-card-cta" aria-hidden="true">
                                Abrir <ArrowRight size={18} />
                              </span>
                            </button>
                            <span className="profile-card-actions">
                              {onEditProfile && (
                                <button
                                  type="button"
                                  className="icon-button"
                                  aria-label={`Editar perfil de ${profile.name}`}
                                  title="Editar identificação"
                                  onClick={() => onEditProfile(profile)}
                                >
                                  <Pencil size={18} />
                                </button>
                              )}
                              {onDeleteProfile && (
                                <button
                                  type="button"
                                  className="icon-button profile-card-delete"
                                  aria-label={`Excluir perfil de ${profile.name}`}
                                  title="Excluir perfil"
                                  onClick={() => onDeleteProfile(profile)}
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : currentTab === "create" ? (
                  <form onSubmit={createProfile} className="start-form">
                    <p className="access-hint">
                      Informe sua identificação uma vez. Nos próximos meses,
                      continue com o mesmo perfil.
                    </p>
                    <div className="field">
                      <label htmlFor="entry-name">Nome completo</label>
                      <input
                        id="entry-name"
                        name="name"
                        autoComplete="name"
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                        maxLength={150}
                      />
                    </div>
                    <RoleChoice
                      id="entry-role"
                      roles={roles}
                      value={role}
                      onChange={setRole}
                    />
                    <div className="field">
                      <label htmlFor="entry-gat">GAT</label>
                      <FullSelect
                        id="entry-gat"
                        value={gat}
                        onChange={(event) => setGat(event.target.value)}
                        required
                      >
                        {gatList.map((item) => (
                          <option key={item.number} value={item.number}>
                            GAT {item.number} · {item.name}
                          </option>
                        ))}
                      </FullSelect>
                    </div>
                    <button
                      className="primary-button w-full"
                      disabled={!gat || !role}
                      type="submit"
                    >
                      Abrir minha folha <ArrowRight size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="restore-entry">
                    <Download size={28} aria-hidden="true" />
                    <h3>Continue em outro aparelho</h3>
                    <p>
                      Abra a cópia de segurança (.json) salva anteriormente. O PDF é
                      a folha para assinatura e não restaura os registros.
                    </p>
                    <button
                      className="primary-button w-full"
                      type="button"
                      onClick={() => fileRef.current?.click()}
                    >
                      Selecionar cópia <ArrowRight size={18} />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      aria-label="Cópia de segurança da folha"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onLoginWithJson(file);
                        event.target.value = "";
                      }}
                    />
                    <p className="access-hint">
                      Sem o arquivo? Se usou este navegador, procure em “Continuar”.
                      Em outro aparelho, você pode criar a folha do novo mês; os
                      registros antigos dependem da cópia ou do navegador original.
                    </p>
                  </div>
                )}
                <p className="local-note">
                  Os registros ficam neste navegador. Quem usa este navegador pode abrir os perfis salvos. Não há sincronização entre aparelhos.
                </p>
              </FramePanel>
            </Frame>
          </section>
        </div>
        <section className="entry-steps" id="como-funciona" aria-labelledby="steps-title">
          <p className="section-kicker">Como funciona</p>
          <h2 id="steps-title">Três passos por mês.</h2>
          <ol>
            <li>
              <span className="step-icon" aria-hidden="true"><Plus size={18} /></span>
              <h3>1. Registre as atividades</h3>
              <p>Data, início, fim, local e o que foi feito. A CH aparece antes de você salvar.</p>
            </li>
            <li>
              <span className="step-icon" aria-hidden="true"><BarChart3 size={18} /></span>
              <h3>2. Acompanhe a CH do mês</h3>
              <p>Veja quanto falta para o mínimo de {PROGRAM.monthlyTargetHours} h. O excedente não passa para o mês seguinte.</p>
            </li>
            <li>
              <span className="step-icon" aria-hidden="true"><FileText size={18} /></span>
              <h3>3. Gere a folha e assine</h3>
              <p>O PDF sai no modelo oficial do {PROGRAM.acronym}, em Carta paisagem. Assine pelo Gov.br. {PROGRAM.deadline.label}</p>
            </li>
          </ol>
        </section>
        <section className="file-guide" id="o-que-guardar" aria-labelledby="files-title">
          <div className="file-guide-intro">
            <p className="section-kicker">O que guardar</p>
            <h2 id="files-title">Dois arquivos, cada um com sua função.</h2>
            <p className="file-guide-tip">Ao terminar o mês, guarde os dois: o PDF para assinatura e o JSON para manter uma cópia editável. Não há sincronização entre aparelhos.</p>
          </div>
          <div className="file-guide-item">
            <FileText size={24} aria-hidden="true" />
            <div>
              <h3><span className="file-extension">.pdf</span> Folha para assinar</h3>
              <p>Em <strong>Folha oficial</strong>, use <strong>Imprimir / salvar PDF</strong> para gerar o documento de assinatura. O PDF não permite restaurar as atividades no sistema.</p>
            </div>
          </div>
          <div className="file-guide-item">
            <FileJson size={24} aria-hidden="true" />
            <div>
              <h3><span className="file-extension">.json</span> Cópia para continuar</h3>
              <p>O JSON é um arquivo que guarda sua identificação, as atividades e os comprovantes da folha. Ele permite continuar editando ou levar os registros para outro aparelho.</p>
              <p>Na sua folha, use <strong>Salvar cópia</strong>. Para abrir o arquivo aqui, escolha <strong>Restaurar cópia</strong>.</p>
            </div>
          </div>
        </section>
        <ReleaseNotes />
        <section
          className="faq-section"
          id="perguntas"
          aria-labelledby="faq-title"
        >
          <h2 id="faq-title">Dúvidas frequentes</h2>
          <FAQ />
        </section>
      </main>
      <SiteFooter
        onHelp={() => setHelpOpen(true)}
        onFeedback={onOpenFeedback}
      />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
