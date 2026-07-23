"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bot, Building2, Code2, Pencil, Save, UserRound, WandSparkles, X } from "lucide-react";
import type { Agent, Notify, Organization, OrganizationTab } from "../types";
import { PageHeading } from "../shared";

type Props = { tab: OrganizationTab; setTab: (tab: OrganizationTab) => void; organization: Organization; agents: Agent[]; notify: Notify; updateOrganization: (updates: Partial<Organization>) => void; canEdit: boolean; canDelete: boolean };

export function OrganizationPage({ tab, setTab, organization, agents, notify, updateOrganization, canEdit, canDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(organization.name);
  const [draftDescription, setDraftDescription] = useState(organization.description);
  useEffect(() => { setDraftName(organization.name); setDraftDescription(organization.description); setEditing(false); }, [organization.id, organization.name, organization.description]);
  const labels: { key: OrganizationTab; label: string; icon: typeof Bot; future?: boolean }[] = [
    { key: "overview", label: "Overview", icon: Building2 }, { key: "branding", label: "Branding", icon: WandSparkles },
    { key: "members", label: "Members", icon: UserRound, future: true }, { key: "api", label: "API Keys", icon: Code2, future: true },
    { key: "danger", label: "Danger zone", icon: AlertCircle },
  ];
  return <>
    <PageHeading eyebrow="Organization overview" title={organization.name} description="Manage your organization identity, branding, access, and lifecycle.">{canEdit && <button className={editing ? "secondary-button" : "primary-button"} onClick={() => setEditing((value) => !value)}>{editing ? <X size={15}/> : <Pencil size={15}/>} {editing ? "Cancel editing" : "Edit organization"}</button>}</PageHeading>
    <div className="context-tabs organization-tabs">{labels.map(({ key, label, icon: Icon, future }) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={15}/>{label}{future && <em>Soon</em>}</button>)}</div>
    {tab === "overview" && <div className="organization-general-grid grid grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)] items-start gap-4 max-[900px]:grid-cols-1"><section className={`panel organization-form p-6 ${editing ? "editing" : ""}`}><div className="panel-title"><div><h2>Organization profile</h2><p>{editing ? "Update the organization information below." : "Core information used throughout Arffy AI."}</p></div>{editing && <button className="primary-button" onClick={() => { updateOrganization({ name: draftName.trim() || organization.name, description: draftDescription }); setEditing(false); }}><Save size={15}/> Save changes</button>}</div><label className="field"><span>Organization name</span><input value={draftName} disabled={!editing} onChange={(event) => setDraftName(event.target.value)}/></label><label className="field"><span>Description</span><textarea rows={4} value={draftDescription} disabled={!editing} onChange={(event) => setDraftDescription(event.target.value)}/></label>{!editing && <div className="edit-hint"><Pencil size={14}/>Click “Edit organization” to change these details.</div>}</section><aside className="panel organization-summary p-5"><div className="panel-title"><div><h2>Organization summary</h2><p>Current organization status.</p></div></div><div className="organization-facts"><span><small>Organization type</small><b>{organization.category}</b></span><span><small>Active agents</small><b>{agents.filter((agent) => agent.status === "Live").length}</b></span><span><small>Documents</small><b>{agents.reduce((total, agent) => total + agent.docs, 0)}</b></span><span><small>Persistence</small><b>Backend managed</b></span></div></aside></div>}
    {tab === "branding" && <section className="panel organization-form"><div className="panel-title"><div><h2>Branding</h2><p>Customize how this organization appears to your team and customers.</p></div><button className="primary-button" onClick={() => notify("Organization branding saved")}><Save size={15}/> Save branding</button></div><div className="logo-editor"><span>{organization.initials}</span><div><b>Organization logo</b><small>PNG, JPG, or SVG. Max 2 MB.</small><button onClick={() => notify("Logo picker opened in demo mode")}>Upload logo</button></div></div><div className="two-fields"><label className="field"><span>Primary brand color</span><input type="color" defaultValue="#168c86"/></label><label className="field"><span>Public display name</span><input defaultValue={organization.name}/></label></div></section>}
    {(tab === "members" || tab === "api") && <section className="panel future-panel"><span>{tab === "members" ? <UserRound size={25}/> : <Code2 size={25}/>}</span><h2>{tab === "members" ? "Members are coming soon" : "API keys are coming soon"}</h2><p>{tab === "members" ? "Invite teammates and control organization access in a future release." : "Create and manage organization API keys in a future release."}</p></section>}
    {tab === "danger" && <section className="panel danger-panel"><div><span><AlertCircle size={19}/></span><div><h2>Delete organization</h2><p>Permanently delete {organization.name}, all FAQ agents, documents, conversations, and widgets. This cannot be undone.</p></div></div>{canDelete && <button className="danger-button" onClick={() => notify("Delete organization requires confirmation")}>Delete organization</button>}</section>}
  </>;
}
