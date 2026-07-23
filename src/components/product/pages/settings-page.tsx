"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot, BrainCircuit, Building2, CheckCircle2, CircleAlert, Database, HardDrive, KeyRound, LockKeyhole, Mail, Moon, RefreshCw, Server, ShieldCheck, Sun, UserRound } from "lucide-react";
import { loadSettingsAction } from "@/app/actions";
import type { CurrentUserDto, ServiceStatusDto } from "@/lib/api";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";
import { PageHeading } from "../shared";

const serviceIcons = { backend: Server, storage: HardDrive, ai: BrainCircuit };

export function SettingsPage({ user }: { user: CurrentUserDto }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const query = useQuery({ queryKey: ["settings-status"], queryFn: loadSettingsAction, refetchInterval: 30_000, staleTime: 10_000 });
  const services = query.data?.services ?? loadingServices;
  const models = query.data?.models ?? [];
  return <><PageHeading eyebrow="System & preferences" title="Settings" description="Monitor your connected services, inspect available AI models, and personalize this workspace."><button className="secondary-button" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? "spin" : ""} size={15}/>{query.isFetching ? "Checking…" : "Refresh status"}</button></PageHeading>
    <AccountAccess user={user}/>
    <section className="settings-status-section"><div className="section-heading"><div><h2>Service health</h2><p>Live connectivity checks refresh automatically every 30 seconds.</p></div>{query.data && <small>Checked {new Date(query.data.checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>}</div><div className="service-status-grid">{services.map((service) => <ServiceCard key={service.id} service={service} loading={query.isLoading}/>)}</div></section>
    <section className="panel settings-model-panel"><div className="panel-title"><div><h2>Available AI models</h2><p>Live model metadata supplied by the AI service through the private backend connection.</p></div><Bot size={19}/></div>{query.isLoading ? <div className="model-loading">Loading model catalog…</div> : models.length ? <div className="settings-model-list">{models.map((model) => <article key={model.id}><span className="model-provider-mark"><BrainCircuit size={18}/></span><div><span><b>{model.name}</b>{model.default_model && <em>Default</em>}</span><p>{model.description || "Available for grounded FAQ responses."}</p><small>{model.provider} · {model.capabilities.join(", ") || "FAQ"}</small></div><strong>{model.context_window ? `${model.context_window.toLocaleString()} tokens` : "Context not reported"}</strong></article>)}</div> : <div className="settings-model-empty"><CircleAlert size={22}/><div><b>Model catalog unavailable</b><p>Start or configure the AI processing service, then refresh this page.</p></div></div>}</section>
    <div className="settings-essential-grid settings-preference-grid"><section className="panel settings-essential-panel"><div className="panel-title"><div><h2>Appearance</h2><p>Choose the theme used on this device. Changes apply immediately.</p></div><Moon size={18}/></div><div className="theme-cards"><button className={theme === "light" ? "selected" : ""} onClick={() => dispatch(setTheme("light"))}><Sun size={20}/><span>Light</span><CheckCircle2 size={16}/></button><button className={theme === "dark" ? "selected" : ""} onClick={() => dispatch(setTheme("dark"))}><Moon size={20}/><span>Dark</span><CheckCircle2 size={16}/></button></div></section>
      <section className="panel settings-essential-panel"><div className="panel-title"><div><h2>Private data path</h2><p>Your infrastructure credentials never leave the backend.</p></div><LockKeyhole size={18}/></div><div className="server-data-flow"><span><Database size={19}/></span><div><b>Authenticated document delivery</b><p>Document previews are streamed through the tenant-scoped backend. MinIO keys and credentials are never exposed to the browser.</p></div></div><small className="settings-note">PDF, Markdown, TXT, and DOCX previews use this protected path.</small></section></div>
  </>;
}

function AccountAccess({ user }: { user: CurrentUserDto }) {
  const organizations = Object.entries(user.organization_permissions);
  return <section className="settings-account-grid"><article className="panel settings-account-card"><header><span className="settings-account-avatar">{initials(user.full_name)}</span><div><h2>{user.full_name}</h2><p>{user.email}</p><em><ShieldCheck size={14}/>{user.super_admin ? "Super administrator" : "Organization user"}</em></div></header><div><span><UserRound size={18}/><small>Account status</small><b>{user.active ? "Active" : "Disabled"}</b></span><span><Mail size={18}/><small>Login identity</small><b>{user.email}</b></span><span><Building2 size={18}/><small>Organizations</small><b>{user.super_admin ? "Platform-wide" : organizations.length}</b></span></div></article><article className="panel settings-access-card"><header><span><KeyRound size={20}/></span><div><h2>Your effective access</h2><p>Permissions granted through your organization and platform roles.</p></div></header>{user.platform_permissions.length > 0 && <AccessGroup title="Platform permissions" permissions={user.platform_permissions}/>}<h3>Organization permissions</h3>{organizations.length ? <div className="settings-access-organizations">{organizations.map(([organizationId, permissions]) => <section key={organizationId}><header><Building2 size={17}/><b>{organizationId}</b><small>{permissions.length} permissions</small></header><div>{permissions.map((permission) => <span key={permission}>{permission}</span>)}</div></section>)}</div> : <div className="settings-access-empty"><ShieldCheck size={19}/><span><b>No organization permissions assigned</b><p>Contact an administrator if you need access to an organization.</p></span></div>}</article></section>;
}

function AccessGroup({ title, permissions }: { title: string; permissions: string[] }) { return <div className="settings-access-group"><h3>{title}</h3><div>{permissions.map((permission) => <span key={permission}>{permission}</span>)}</div></div>; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U"; }

function ServiceCard({ service, loading }: { service: ServiceStatusDto; loading: boolean }) {
  const Icon = serviceIcons[service.id];
  const status = loading ? "UNKNOWN" : service.status;
  return <article className={`panel service-status-card status-${status.toLowerCase()}`}><span><Icon size={21}/></span><div><small>{service.name}</small><b>{status === "UP" ? "Operational" : status === "DOWN" ? "Unavailable" : "Checking"}</b><p>{loading ? "Running connectivity check…" : service.detail}</p></div><em><i/>{status}</em></article>;
}

const loadingServices: ServiceStatusDto[] = [
  { id: "backend", name: "FAQ backend", status: "UNKNOWN", detail: "" },
  { id: "storage", name: "MinIO object storage", status: "UNKNOWN", detail: "" },
  { id: "ai", name: "AI processing service", status: "UNKNOWN", detail: "" },
];
