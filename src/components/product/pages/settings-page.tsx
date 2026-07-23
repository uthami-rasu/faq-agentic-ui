"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot, BrainCircuit, CheckCircle2, CircleAlert, Database, HardDrive, LockKeyhole, Moon, RefreshCw, Server, Sun } from "lucide-react";
import { loadSettingsAction } from "@/app/actions";
import type { ServiceStatusDto } from "@/lib/api";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";
import { PageHeading } from "../shared";

const serviceIcons = { backend: Server, storage: HardDrive, ai: BrainCircuit };

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const query = useQuery({ queryKey: ["settings-status"], queryFn: loadSettingsAction, refetchInterval: 30_000, staleTime: 10_000 });
  const services = query.data?.services ?? loadingServices;
  const models = query.data?.models ?? [];
  return <><PageHeading eyebrow="System & preferences" title="Settings" description="Monitor your connected services, inspect available AI models, and personalize this workspace."><button className="secondary-button" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? "spin" : ""} size={15}/>{query.isFetching ? "Checking…" : "Refresh status"}</button></PageHeading>
    <section className="settings-status-section"><div className="section-heading"><div><h2>Service health</h2><p>Live connectivity checks refresh automatically every 30 seconds.</p></div>{query.data && <small>Checked {new Date(query.data.checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small>}</div><div className="service-status-grid">{services.map((service) => <ServiceCard key={service.id} service={service} loading={query.isLoading}/>)}</div></section>
    <section className="panel settings-model-panel"><div className="panel-title"><div><h2>Available AI models</h2><p>Live model metadata supplied by the AI service through the private backend connection.</p></div><Bot size={19}/></div>{query.isLoading ? <div className="model-loading">Loading model catalog…</div> : models.length ? <div className="settings-model-list">{models.map((model) => <article key={model.id}><span className="model-provider-mark"><BrainCircuit size={18}/></span><div><span><b>{model.name}</b>{model.default_model && <em>Default</em>}</span><p>{model.description || "Available for grounded FAQ responses."}</p><small>{model.provider} · {model.capabilities.join(", ") || "FAQ"}</small></div><strong>{model.context_window ? `${model.context_window.toLocaleString()} tokens` : "Context not reported"}</strong></article>)}</div> : <div className="settings-model-empty"><CircleAlert size={22}/><div><b>Model catalog unavailable</b><p>Start or configure the AI processing service, then refresh this page.</p></div></div>}</section>
    <div className="settings-essential-grid settings-preference-grid"><section className="panel settings-essential-panel"><div className="panel-title"><div><h2>Appearance</h2><p>Choose the theme used on this device. Changes apply immediately.</p></div><Moon size={18}/></div><div className="theme-cards"><button className={theme === "light" ? "selected" : ""} onClick={() => dispatch(setTheme("light"))}><Sun size={20}/><span>Light</span><CheckCircle2 size={16}/></button><button className={theme === "dark" ? "selected" : ""} onClick={() => dispatch(setTheme("dark"))}><Moon size={20}/><span>Dark</span><CheckCircle2 size={16}/></button></div></section>
      <section className="panel settings-essential-panel"><div className="panel-title"><div><h2>Private data path</h2><p>Your infrastructure credentials never leave the backend.</p></div><LockKeyhole size={18}/></div><div className="server-data-flow"><span><Database size={19}/></span><div><b>Authenticated document delivery</b><p>Document previews are streamed through the tenant-scoped backend. MinIO keys and credentials are never exposed to the browser.</p></div></div><small className="settings-note">PDF, Markdown, TXT, and DOCX previews use this protected path.</small></section></div>
  </>;
}

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
