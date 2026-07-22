"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight, Copy, Database, FileText, MoreHorizontal, Pencil, RotateCcw, Save, Sparkles, Trash2, Zap } from "lucide-react";
import type { Agent, AgentTab, Notify } from "../types";
import { AgentAvatar, Status } from "../shared";
import { KnowledgePage } from "./knowledge-page";
import { PlaygroundPage } from "./playground-page";
import { WidgetsPage } from "./widgets-page";

type Props = { agent: Agent; tab: AgentTab; setTab: (tab: AgentTab) => void; notify: Notify; updateAgent: (updates: Partial<Agent>) => void; duplicateAgent: () => void; deleteAgent: () => void; onBack: () => void };

export function AgentDetailsPage({ agent, tab, setTab, notify, updateAgent, duplicateAgent, deleteAgent, onBack }: Props) {
  const tabs: { key: AgentTab; label: string }[] = [
    { key: "overview", label: "Overview" }, { key: "knowledge", label: "Knowledge" }, { key: "ai", label: "AI Configuration" },
    { key: "retrieval", label: "Retrieval" }, { key: "prompt", label: "Prompt" }, { key: "playground", label: "Playground" }, { key: "widget", label: "Widget" },
  ];
  const [prompt, setPrompt] = useState("You are a friendly and accurate customer support specialist for Acme. Answer using only the supplied knowledge. If the answer is unavailable, say so clearly and offer to connect the user with a human.");
  const [draftName, setDraftName] = useState(agent.name);
  const [draftDescription, setDraftDescription] = useState(agent.description);
  useEffect(() => { setDraftName(agent.name); setDraftDescription(agent.description); }, [agent.id, agent.name, agent.description]);
  return <>
    <div className="agent-detail-header"><div className="agent-detail-title"><AgentAvatar agent={agent} large/><div><span><button onClick={onBack}>FAQ Agents</button><ChevronRight size={12}/>{agent.name}</span><h1>{agent.name}</h1><p>{agent.description}</p></div></div><div className="agent-detail-actions"><Status status={agent.status}/><label className="switch labeled-switch"><input type="checkbox" checked={agent.status === "Live"} onChange={(event) => updateAgent({ status: event.target.checked ? "Live" : "Draft" })}/><i/><span>{agent.status === "Live" ? "Enabled" : "Disabled"}</span></label><button className="icon-button"><MoreHorizontal size={18}/></button></div></div>
    <div className="context-tabs agent-tabs">{tabs.map(({ key, label }) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}{key === "knowledge" && <em>{agent.docs}</em>}</button>)}</div>
    {tab === "overview" && <div className="agent-settings-layout"><section className="panel agent-form-panel"><div className="panel-title"><div><h2>Agent overview</h2><p>Give this agent a clear identity and responsibility.</p></div></div><label className="field"><span>Agent name</span><input value={draftName} onChange={(event) => setDraftName(event.target.value)}/></label><label className="field"><span>Description</span><textarea rows={4} value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)}/></label><div className="form-actions"><button className="primary-button" onClick={() => updateAgent({ name: draftName.trim() || agent.name, description: draftDescription })}><Save size={15}/> Save changes</button></div></section><aside className="panel agent-side-panel"><div className="panel-title"><div><h2>Agent summary</h2><p>Backend-owned configuration details.</p></div></div><div className="agent-summary-list"><span><FileText size={16}/><div><small>Knowledge sources</small><b>{agent.docs} documents</b></div></span><span><CheckCircle2 size={16}/><div><small>Status</small><b>{agent.status === "Live" ? "Active" : "Draft"}</b></div></span><span><Pencil size={16}/><div><small>Last updated</small><b>{agent.updated}</b></div></span></div><div className="form-divider"/><button className="secondary-button full-button" onClick={duplicateAgent}><Copy size={15}/> Duplicate agent</button><button className="danger-button" onClick={deleteAgent}><Trash2 size={15}/> Delete agent</button></aside></div>}
    {tab === "knowledge" && <KnowledgePage search="" notify={notify} embedded agentName={agent.name}/>} 
    {tab === "ai" && <AgentAIConfiguration notify={notify}/>} 
    {tab === "retrieval" && <AgentRetrieval notify={notify}/>} 
    {tab === "prompt" && <section className="panel prompt-panel"><div className="panel-title"><div><h2>System prompt</h2><p>Set the role, boundaries, and response style for {agent.name}.</p></div><button className="secondary-button" onClick={() => setPrompt("You are a helpful FAQ agent. Answer only from the provided knowledge.")}><RotateCcw size={14}/> Reset default</button></div><label className="field"><span>Instructions</span><textarea rows={13} value={prompt} onChange={(event) => setPrompt(event.target.value)}/><small>{prompt.length} / 4,000 characters</small></label><div className="prompt-guidance"><Sparkles size={17}/><div><b>Prompt guidance</b><p>Describe the agent&apos;s role, tone, limitations, and what it should do when the knowledge does not contain an answer.</p></div></div><div className="form-actions"><button className="primary-button" onClick={() => notify("System prompt saved")}><Save size={15}/> Save prompt</button></div></section>}
    {tab === "playground" && <PlaygroundPage notify={notify} embedded agentName={agent.name}/>} 
    {tab === "widget" && <WidgetsPage notify={notify} embedded agentMode agentName={agent.name}/>} 
  </>;
}

function AgentAIConfiguration({ notify }: { notify: Notify }) {
  const [temperature, setTemperature] = useState(.3);
  return <div className="config-page-grid"><section className="panel config-panel"><div className="panel-title"><div><h2>AI configuration</h2><p>Choose how the model generates responses.</p></div></div><label className="field"><span>Model</span><button className="select-field config-select"><span className="mini-agent"><Sparkles size={14}/></span><span><b>GPT-4.1 mini</b><small>Fast, capable, and cost effective</small></span><ChevronDown size={15}/></button></label><div className="range-field"><div><span>Temperature</span><b>{temperature.toFixed(1)}</b></div><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))}/><div className="range-labels"><span>Precise</span><span>Creative</span></div><p>Lower values keep answers consistent and grounded in your knowledge.</p></div><label className="field"><span>Maximum response tokens</span><input type="number" defaultValue="800" min="100" max="4000"/><small>Recommended: 500–1,000 tokens for concise support answers.</small></label><div className="form-actions"><button className="primary-button" onClick={() => notify("AI configuration saved")}><Save size={15}/> Save configuration</button></div></section><aside className="panel recommendations-panel"><Zap size={20}/><h3>Recommended for FAQ agents</h3><p>This setup balances answer quality, speed, and cost for most customer-facing knowledge agents.</p><ul><li><Check size={13}/> Fast response generation</li><li><Check size={13}/> Reliable instruction following</li><li><Check size={13}/> Low answer variance</li></ul></aside></div>;
}

function AgentRetrieval({ notify }: { notify: Notify }) {
  return <section className="panel retrieval-panel"><div className="panel-title"><div><h2>Retrieval configuration</h2><p>Control how knowledge is split, selected, and supplied to the model.</p></div><button className="secondary-button" onClick={() => notify("Recommended retrieval defaults restored")}><RotateCcw size={14}/> Use recommended</button></div><div className="retrieval-grid"><ConfigNumber label="Chunk size" value="800" suffix="tokens" description="Maximum size of each indexed knowledge segment."/><ConfigNumber label="Chunk overlap" value="120" suffix="tokens" description="Context repeated between adjacent chunks."/><ConfigNumber label="Similarity threshold" value="0.72" suffix="score" description="Minimum relevance required to use a chunk."/><ConfigNumber label="Top K" value="5" suffix="chunks" description="Maximum matching chunks sent to the model."/></div><div className="retrieval-preview"><div><span><Database size={17}/></span><div><b>How retrieval works</b><p>A question is compared with this agent&apos;s indexed documents. Only the most relevant chunks above your threshold are included in the answer context.</p></div></div><div className="retrieval-flow"><span>Question</span><ArrowRight size={14}/><span>Search {`{${5}}`} chunks</span><ArrowRight size={14}/><span>Generate answer</span></div></div><div className="form-actions"><button className="primary-button" onClick={() => notify("Retrieval configuration saved")}><Save size={15}/> Save configuration</button></div></section>;
}

function ConfigNumber({ label, value, suffix, description }: { label: string; value: string; suffix: string; description: string }) {
  return <label className="config-number"><span>{label}</span><div><input type="number" defaultValue={value}/><em>{suffix}</em></div><small>{description}</small></label>;
}
