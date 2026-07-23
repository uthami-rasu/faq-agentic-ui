"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bot, Braces, CheckCircle2, Code2, LoaderCircle, Play, Route, Save, Settings, ShieldCheck, Sparkles } from "lucide-react";
import { configureOrchestratorAction, loadOrchestratorConfigurationAction } from "@/app/actions";
import type { Agent, Notify } from "../types";
import { AgentAvatar, PageHeading, Status } from "../shared";
import { apiErrorMessage } from "../utils";
import { PlaygroundPage } from "./playground-page";
import { WidgetsPage } from "./widgets-page";

type Props = { organizationId: string; organizationName: string; agents: Agent[]; notify: Notify; onSaved: (active: boolean) => void; canManage: boolean };
type Section = "configuration" | "playground" | "widget";
type FormSnapshot = { assistantName: string; welcome: string; guidance: string; enabled: boolean; agentIds: string[] };

export function OrchestratorPage({ organizationId, organizationName, agents, notify, onSaved, canManage }: Props) {
  const queryClient = useQueryClient();
  const configurationQuery = useQuery({
    queryKey: ["orchestrator", organizationId],
    queryFn: () => loadOrchestratorConfigurationAction(organizationId),
    enabled: Boolean(organizationId), staleTime: 15_000, refetchOnWindowFocus: false,
  });
  const [section, setSection] = useState<Section>("configuration");
  const [assistantName, setAssistantName] = useState(`${organizationName} Assistant`);
  const [welcome, setWelcome] = useState("Hi! How can I help you today?");
  const [guidance, setGuidance] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<FormSnapshot | null>(null);
  const [saving, setSaving] = useState(false);
  const activeAgents = agents.filter((agent) => agent.status === "Live");
  const activeAgentKey = activeAgents.map((agent) => agent.id).sort().join(",");

  useEffect(() => {
    const configuration = configurationQuery.data;
    if (!configuration) return;
    const activeIds = activeAgentKey ? activeAgentKey.split(",") : [];
    const snapshot = {
      assistantName: configuration.assistant_name || `${organizationName} Assistant`,
      welcome: configuration.welcome_message || "Hi! How can I help you today?",
      guidance: configuration.system_prompt || "",
      enabled: configuration.active,
      agentIds: (configuration.id ? configuration.agent_ids.filter((id) => activeIds.includes(id)) : activeIds).sort(),
    };
    setAssistantName(snapshot.assistantName); setWelcome(snapshot.welcome); setGuidance(snapshot.guidance);
    setEnabled(snapshot.enabled); setSelectedIds(snapshot.agentIds); setSavedSnapshot(snapshot);
  }, [configurationQuery.data, activeAgentKey, organizationName]);

  const toggleAgent = (agentId: string) => setSelectedIds((current) => current.includes(agentId)
    ? current.filter((id) => id !== agentId)
    : [...current, agentId]);
  const currentSnapshot: FormSnapshot = { assistantName: assistantName.trim(), welcome: welcome.trim(), guidance: guidance.trim(), enabled, agentIds: [...selectedIds].sort() };
  const dirty = savedSnapshot !== null && JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot);
  const saveDisabled = saving || !dirty || !assistantName.trim() || !welcome.trim() || (enabled && selectedIds.length === 0);
  const save = async () => {
    if (saveDisabled) return;
    setSaving(true);
    try {
      const saved = await configureOrchestratorAction(organizationId, {
        assistantName: assistantName.trim(), welcomeMessage: welcome.trim(), systemPrompt: guidance.trim(), active: enabled, agentIds: selectedIds,
      });
      queryClient.setQueryData(["orchestrator", organizationId], saved);
      setSavedSnapshot({ assistantName: saved.assistant_name, welcome: saved.welcome_message, guidance: saved.system_prompt, enabled: saved.active, agentIds: [...saved.agent_ids].sort() });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] });
      onSaved(saved.active);
      notify(saved.active ? "AI Orchestrator enabled and saved" : "AI Orchestrator disabled");
    } catch (error) { notify(apiErrorMessage(error)); }
    finally { setSaving(false); }
  };

  return <div className="orchestrator-page orchestrator-clean">
    <PageHeading eyebrow="Organization assistant" title="AI Orchestrator" description={`Let visitors ask one assistant and route each question to the right ${organizationName} FAQ agent.`}>
      {section === "configuration" && canManage && <button className="primary-button configuration-save-button" disabled={saveDisabled} onClick={save}>{saving ? <LoaderCircle className="spin" size={16}/> : dirty ? <Save size={16}/> : <CheckCircle2 size={16}/>} {saving ? "Saving…" : configurationQuery.isLoading ? "Loading…" : dirty ? "Save configuration" : "Saved"}</button>}
    </PageHeading>
    <div className="context-tabs orchestrator-workspace-tabs"><button className={section === "configuration" ? "active" : ""} onClick={() => setSection("configuration")}><Settings size={15}/>Configuration</button><button className={section === "playground" ? "active" : ""} onClick={() => setSection("playground")}><Play size={15}/>Playground</button><button className={section === "widget" ? "active" : ""} onClick={() => setSection("widget")}><Code2 size={15}/>Widget</button></div>
    {configurationQuery.isError && <div className="orchestrator-load-error"><AlertCircle size={17}/><span>Current settings could not be loaded.</span><button onClick={() => configurationQuery.refetch()}>Try again</button></div>}
    {section === "configuration" && <fieldset className="permission-fieldset" disabled={!canManage}><Configuration assistantName={assistantName} setAssistantName={setAssistantName} enabled={enabled} setEnabled={setEnabled} welcome={welcome} setWelcome={setWelcome} guidance={guidance} setGuidance={setGuidance} agents={agents} selectedIds={selectedIds} toggleAgent={toggleAgent}/></fieldset>}
    {section === "playground" && <><WorkspaceState enabled={enabled} selected={selectedIds.length}/><PlaygroundPage notify={notify} embedded organizationMode organizationName={organizationName} orchestratorName={assistantName}/></>}
    {section === "widget" && <><WorkspaceState enabled={enabled} selected={selectedIds.length}/><WidgetsPage notify={notify} embedded organizationId={organizationId} organizationName={organizationName} orchestratorName={assistantName} welcomeMessage={welcome}/></>}
  </div>;
}

function Configuration({ assistantName, setAssistantName, enabled, setEnabled, welcome, setWelcome, guidance, setGuidance, agents, selectedIds, toggleAgent }: {
  assistantName: string; setAssistantName: (value: string) => void;
  enabled: boolean; setEnabled: (value: boolean) => void; welcome: string; setWelcome: (value: string) => void;
  guidance: string; setGuidance: (value: string) => void; agents: Agent[]; selectedIds: string[]; toggleAgent: (id: string) => void;
}) {
  const activeCount = agents.filter((agent) => agent.status === "Live").length;
  return <>
    <section className={`panel orchestrator-master-switch ${enabled ? "enabled" : ""}`}><span><Sparkles size={21}/></span><div><b>Enable AI Orchestrator</b><p>Expose one organization assistant that can route across the FAQ agents selected below.</p></div><label className="switch orchestration-switch"><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)}/><i/><em>{enabled ? "Enabled" : "Disabled"}</em></label></section>
    <div className="orchestrator-config-workspace">
      <section className="panel orchestrator-form-card"><header><span><Route size={20}/></span><div><h2>Visitor experience</h2><p>Configure the assistant identity, greeting, and optional organization-specific routing hint.</p></div></header><label className="premium-field"><span><b>Assistant name</b><small>The public name shown in the Playground and Widget</small></span><input value={assistantName} maxLength={120} placeholder="e.g. Support Assistant" onChange={(event) => setAssistantName(event.target.value)}/><em>{assistantName.length}/120</em></label><label className="premium-field"><span><b>Welcome message</b><small>Shown before a visitor asks the first question</small></span><textarea rows={3} value={welcome} maxLength={1000} onChange={(event) => setWelcome(event.target.value)}/><em>{welcome.length}/1,000</em></label><label className="premium-field"><span><b>Optional routing guidance</b><small>Keep this short. Agent names, descriptions, status, and IDs are supplied automatically.</small></span><textarea rows={5} value={guidance} maxLength={4000} placeholder="Example: Prefer Billing for invoice questions and Product Support for troubleshooting." onChange={(event) => setGuidance(event.target.value)}/><em>{guidance.length}/4,000</em></label><div className="managed-policy"><ShieldCheck size={18}/><div><b>Platform routing policy · read only</b><p>The AI service receives a strict system instruction to classify intent, choose only an eligible agent ID, and never answer from the Orchestrator itself.</p></div><Braces size={17}/></div></section>
      <section className="panel orchestrator-agent-control"><div className="panel-title"><div><h2>Agents available to routing</h2><p>{selectedIds.length} selected · {activeCount} active</p></div><Bot size={19}/></div><div className="agent-routing-list">{agents.map((agent) => { const available = agent.status === "Live"; return <div className={!available ? "unavailable" : ""} key={agent.id}><AgentAvatar agent={agent}/><span><b>{agent.name}</b><small>{agent.description || "Add a short agent purpose to improve routing."}</small></span><Status status={agent.status}/><label className="switch" title={available ? `Include ${agent.name}` : "Activate this FAQ agent first"}><input type="checkbox" checked={available && selectedIds.includes(agent.id)} disabled={!available} onChange={() => toggleAgent(agent.id)}/><i/></label></div>; })}{agents.length === 0 && <p className="eligible-empty"><Bot size={18}/>Create an FAQ agent to make routing available.</p>}</div><div className="agent-metadata-note"><CheckCircle2 size={16}/><p><b>No prompt wiring required.</b> Each selected agent&apos;s name and short description are sent dynamically to the intent-routing service.</p></div></section>
    </div>
  </>;
}

function WorkspaceState({ enabled, selected }: { enabled: boolean; selected: number }) {
  return <div className={`orchestrator-workspace-state ${enabled && selected ? "ready" : "warning"}`}><span>{enabled && selected ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}</span><p>{enabled && selected ? `Orchestrator is enabled with ${selected} routing agent${selected === 1 ? "" : "s"}.` : "Enable the Orchestrator and select at least one active FAQ agent before publishing."}</p></div>;
}
