"use client";

import { useMemo, useState } from "react";
import { Activity, Bot, Building2, FileText, Globe2, KeyRound, Network, Search, ShieldCheck, UserRound } from "lucide-react";
import type { AdminAccessDto, AuditEventDto } from "@/lib/api";

export function ScopeHelpPanel() {
  return <div className="governance-help-stack">
    <section className="governance-panel governance-help-hero"><span><ShieldCheck/></span><div><h2>A simple rule for scopes</h2><p><b>Roles answer “what can this user do?”</b> Scope answers “where can they do it?” Permissions remain inside roles; administrators do not need to assign individual permissions directly to users.</p></div></section>
    <div className="governance-scope-example-grid">
      <ScopeCard icon={<Globe2/>} title="Platform scope" question="Across the whole SaaS" examples={["Create new organizations", "Manage reusable access-control roles", "Review platform-wide audit history"]} note="Use sparingly. Platform roles are not the same as Super Administrator; Super Administrator retains unrestricted Governance authority."/>
      <ScopeCard icon={<Building2/>} title="Organization scope" question="Inside one selected organization" examples={["Create or edit FAQ agents", "Upload and assign documents", "Configure that organization's orchestrator"]} note="The same user can be Administrator in Acme, Editor in Northwind, and Viewer in Contoso."/>
    </div>
    <section className="governance-panel governance-access-recipe"><header><KeyRound/><div><h2>Recommended access recipe</h2><p>Keep the model predictable by following the same four steps.</p></div></header><ol><li><span>1</span><div><b>Choose a scope</b><p>Platform for global actions; Organization for tenant data and features.</p></div></li><li><span>2</span><div><b>Create a role</b><p>Bundle related permissions, such as FAQ Editor or Compliance Viewer.</p></div></li><li><span>3</span><div><b>Assign the role to a user</b><p>For organization roles, select the specific organization as well.</p></div></li><li><span>4</span><div><b>Review effective access</b><p>Open the user entity to see every platform role and organization membership together.</p></div></li></ol></section>
  </div>;
}

function ScopeCard({ icon, title, question, examples, note }: { icon: React.ReactNode; title: string; question: string; examples: string[]; note: string }) {
  return <article className="governance-panel governance-scope-example"><header><span>{icon}</span><div><h2>{title}</h2><p>{question}</p></div></header><ul>{examples.map((example) => <li key={example}><ShieldCheck size={15}/>{example}</li>)}</ul><p>{note}</p></article>;
}

export function AuditPanel({ data, audit }: { data: AdminAccessDto; audit: AuditEventDto[] }) {
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("ALL");
  const entities = ["ALL", "USER", "ORGANIZATION", "AGENT", "DOCUMENT", "ORCHESTRATOR"];
  const filtered = useMemo(() => audit.filter((event) => (entity === "ALL" || event.entity_type === entity) && `${event.label} ${event.context ?? ""} ${event.actor_subject ?? ""} ${event.event_type}`.toLowerCase().includes(search.toLowerCase())), [audit, entity, search]);
  return <section className="governance-panel governance-audit"><header><div><span><Activity/></span><div><h2>Durable activity timeline</h2><p>Deletion events retain the entity ID and name, so history remains available after the source record is gone.</p></div></div><label><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actor or activity"/></label></header><div className="governance-audit-filters">{entities.map((item) => <button key={item} className={entity === item ? "active" : ""} onClick={() => setEntity(item)}>{entityIcon(item)}{item === "ALL" ? "All activity" : titleCase(item)}</button>)}</div><div className="governance-audit-list">{filtered.map((event) => { const organization = data.organizations.find((item) => item.id === event.organization_id); return <article key={event.id}><span>{entityIcon(event.entity_type)}</span><div><b>{event.label}</b><p>{event.context}</p><small>{event.actor_subject ?? "system"} · {organization?.name ?? (event.organization_id ? "Deleted organization" : "Platform")} · {new Date(event.occurred_at).toLocaleString()}</small></div><em>{event.event_type.replaceAll("_", " ")}</em></article>; })}{filtered.length === 0 && <div className="governance-empty-state"><Search/><b>No matching activity</b><p>New sign-ins and resource changes will appear here.</p></div>}</div></section>;
}

function entityIcon(entity: string) {
  if (entity === "USER") return <UserRound size={15}/>;
  if (entity === "ORGANIZATION") return <Building2 size={15}/>;
  if (entity === "AGENT") return <Bot size={15}/>;
  if (entity === "DOCUMENT") return <FileText size={15}/>;
  if (entity === "ORCHESTRATOR") return <Network size={15}/>;
  return <Activity size={15}/>;
}

function titleCase(value: string) { return value.charAt(0) + value.slice(1).toLowerCase(); }
