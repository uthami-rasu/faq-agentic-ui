"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bot, CheckCircle2, LoaderCircle, Network, Route, Save, ShieldCheck, Sparkles } from "lucide-react";
import { configureOrchestratorAction, loadOrchestratorConfigurationAction } from "@/app/actions";
import type { Agent, Notify } from "../types";
import { AgentAvatar, PageHeading } from "../shared";
import { apiErrorMessage } from "../utils";

type Props = {
  organizationId: string;
  organizationName: string;
  agents: Agent[];
  notify: Notify;
  onSaved: () => void;
};

const defaultPrompt = "Route each question to the enabled FAQ agent whose name and purpose best match the user's intent. If no agent is suitable, clearly explain that no matching knowledge area is available.";

export function OrchestratorPage({ organizationId, organizationName, agents, notify, onSaved }: Props) {
  const queryClient = useQueryClient();
  const configurationQuery = useQuery({
    queryKey: ["orchestrator", organizationId],
    queryFn: () => loadOrchestratorConfigurationAction(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
  const [welcome, setWelcome] = useState("Hi! How can I help you today?");
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [saving, setSaving] = useState(false);
  const activeAgents = agents.filter((agent) => agent.status === "Live");
  const configured = configurationQuery.data?.active ?? false;

  useEffect(() => {
    const configuration = configurationQuery.data;
    if (!configuration) return;
    setWelcome(configuration.welcome_message || "Hi! How can I help you today?");
    setPrompt(configuration.system_prompt || defaultPrompt);
  }, [configurationQuery.data]);

  const save = async () => {
    if (!welcome.trim() || !prompt.trim() || saving) return;
    setSaving(true);
    try {
      const saved = await configureOrchestratorAction(organizationId, {
        welcomeMessage: welcome.trim(),
        systemPrompt: prompt.trim(),
      });
      queryClient.setQueryData(["orchestrator", organizationId], saved);
      await queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] });
      onSaved();
      notify("Orchestrator settings saved");
    } catch (error) {
      notify(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return <div className="orchestrator-page orchestrator-clean">
    <PageHeading eyebrow="Organization routing" title="AI Orchestrator" description={`Set the routing instructions used when a question enters ${organizationName}.`}>
      <button className="primary-button" disabled={saving || !welcome.trim() || !prompt.trim()} onClick={save}>{saving ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} {saving ? "Saving…" : "Save settings"}</button>
    </PageHeading>

    {configurationQuery.isError && <div className="orchestrator-load-error"><AlertCircle size={17}/><span>Current settings could not be loaded.</span><button onClick={() => configurationQuery.refetch()}>Try again</button></div>}

    <div className="orchestrator-essential-grid">
      <section className="panel orchestrator-form-card">
        <header><span><Route size={20}/></span><div><h2>Routing essentials</h2><p>Only organization-level routing belongs here. Answer behavior remains inside each FAQ agent.</p></div><em className={configured ? "active" : "inactive"}><i/>{configurationQuery.isLoading ? "Loading" : configured ? "Active" : "Not active"}</em></header>
        <label className="premium-field"><span><b>Welcome message</b><small>Shown before a visitor asks a question</small></span><textarea rows={3} value={welcome} maxLength={1000} onChange={(event) => setWelcome(event.target.value)} /><em>{welcome.length}/1,000</em></label>
        <label className="premium-field"><span><b>Routing instructions</b><small>Explain how to select the most relevant FAQ agent</small></span><textarea rows={9} value={prompt} maxLength={4000} onChange={(event) => setPrompt(event.target.value)} /><em>{prompt.length}/4,000</em></label>
        <div className="orchestrator-boundary"><ShieldCheck size={18}/><div><b>Clear responsibility boundary</b><p>The orchestrator chooses an agent. The selected agent searches only its own linked documents and generates the response.</p></div></div>
      </section>

      <aside className="orchestrator-side-stack">
        <section className="panel routing-explainer">
          <div className="panel-title"><div><h2>Request path</h2><p>The actual routing boundary.</p></div></div>
          <div className="routing-step"><span>1</span><div><b>Receive question</b><small>From the organization entry point</small></div></div>
          <div className="routing-step"><span>2</span><div><b>Select an active agent</b><small>Using its name, purpose, and these instructions</small></div></div>
          <div className="routing-step"><span>3</span><div><b>Use agent knowledge</b><small>Only documents linked to that FAQ agent</small></div></div>
        </section>
        <section className="panel eligible-agents">
          <div className="panel-title"><div><h2>Eligible FAQ agents</h2><p>{activeAgents.length} active agent{activeAgents.length === 1 ? "" : "s"} available for routing.</p></div><Sparkles size={18}/></div>
          <div>{activeAgents.slice(0, 5).map((agent) => <span key={agent.id}><AgentAvatar agent={agent}/><span><b>{agent.name}</b><small>{agent.description || "No purpose provided"}</small></span><CheckCircle2 size={16}/></span>)}{activeAgents.length === 0 && <p className="eligible-empty"><Bot size={18}/>Activate an FAQ agent before enabling organization routing.</p>}</div>
        </section>
      </aside>
    </div>
  </div>;
}
