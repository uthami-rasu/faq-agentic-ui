"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Building2, Check, CheckCircle2, FileText, FileUp, HelpCircle, Network, Sparkles, Upload, X } from "lucide-react";
import type { Organization } from "../types";
import { Status } from "../shared";

type AgentDraft = { name: string; description: string; documentAdded: boolean };
type Props = { close: () => void; complete: (organization: Omit<Organization, "id" | "version">, agent: AgentDraft) => Promise<void> };

export function CreateOrganizationWizard({ close, complete }: Props) {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [welcome, setWelcome] = useState("Hello! How can I help you today?");
  const [systemPrompt, setSystemPrompt] = useState("Route each question to the FAQ agent with the most relevant expertise. Be friendly, concise, and transparent when no agent can answer.");
  const [agentName, setAgentName] = useState("Customer Support");
  const [agentDescription, setAgentDescription] = useState("Handles customer support questions.");
  const [logoAdded, setLogoAdded] = useState(false);
  const [documentAdded, setDocumentAdded] = useState(false);
  const steps = [{ icon: Building2, label: "Organization" }, { icon: Network, label: "Orchestrator" }, { icon: Bot, label: "First agent" }, { icon: FileText, label: "Knowledge" }, { icon: CheckCircle2, label: "Ready" }];
  const next = () => setStep((current) => Math.min(5, current + 1));
  const finish = async () => {
    if (step < 5) return next();
    setSaving(true);
    await complete({ name: name || "New organization", description: description || "A new Arffy AI organization.", category: "Organization", initials: (name || "N").charAt(0).toUpperCase(), color: "violet" }, { name: agentName, description: agentDescription, documentAdded });
    setSaving(false);
  };
  return <motion.div className="organization-wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <aside className="wizard-sidebar"><button className="brand wizard-brand"><span className="brand-mark"><Sparkles size={19}/></span><span>Arffy <b>AI</b></span></button><div className="wizard-progress">{steps.map(({ icon: Icon, label }, index) => { const number = index + 1; return <div key={label} className={`${step === number ? "active" : ""} ${step > number ? "complete" : ""}`}><span>{step > number ? <Check size={16}/> : <Icon size={16}/>}</span><div><small>Step {number}</small><b>{label}</b></div></div>; })}</div><div className="wizard-help"><HelpCircle size={16}/><p>Need help?<br/><button>View setup guide</button></p></div></aside>
    <main className="wizard-main"><header><span>Creating a new organization</span><button className="icon-button" onClick={close}><X size={18}/></button></header><div className="wizard-content"><AnimatePresence mode="wait"><motion.div key={step} className="wizard-step" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
      {step === 1 && <><div className="wizard-step-icon"><Building2 size={24}/></div><h1>Create organization</h1><p>Start with the basics. You can update these details later.</p><label className="field"><span>Organization name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Acme Inc."/></label><label className="field"><span>Description</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does your organization do?"/></label><div className="field"><span>Logo</span><button className="logo-upload" onClick={() => setLogoAdded(true)}><Upload size={17}/>{logoAdded ? "Logo selected" : "Upload logo"}<small>PNG, JPG, or SVG · 2 MB max</small></button></div></>}
      {step === 2 && <><div className="wizard-step-icon"><Network size={24}/></div><h1>Set up your AI Orchestrator</h1><p>This is the front door that routes questions to the right FAQ agent.</p><label className="field"><span>Welcome message</span><textarea rows={3} value={welcome} onChange={(event) => setWelcome(event.target.value)}/></label><label className="field"><span>System prompt</span><textarea rows={6} value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)}/><small>{systemPrompt.length} / 2,000 characters</small></label><div className="ownership-note"><Network size={16}/><p>The orchestrator routes questions. Knowledge and retrieval stay with individual FAQ agents.</p></div></>}
      {step === 3 && <><div className="wizard-step-icon"><Bot size={24}/></div><h1>Create your first FAQ agent</h1><p>Give your organization its first specialist. Add more agents anytime.</p><label className="field"><span>Agent name</span><input value={agentName} onChange={(event) => setAgentName(event.target.value)}/></label><label className="field"><span>Description</span><textarea rows={4} value={agentDescription} onChange={(event) => setAgentDescription(event.target.value)}/></label><div className="agent-template-preview"><span className="agent-avatar violet">{agentName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "AI"}</span><div><b>{agentName || "Your first agent"}</b><small>{agentDescription || "Describe this agent's responsibility."}</small></div><Status status="Draft"/></div></>}
      {step === 4 && <><div className="wizard-step-icon"><FileUp size={24}/></div><h1>Upload knowledge</h1><p>Add the first document this agent will use to answer questions.</p><button className={`wizard-drop-zone ${documentAdded ? "uploaded" : ""}`} onClick={() => setDocumentAdded(true)}><span>{documentAdded ? <CheckCircle2 size={25}/> : <FileUp size={25}/>}</span><b>{documentAdded ? "Product_guide.pdf is ready" : "Drag a PDF here"}</b><small>{documentAdded ? "2.4 MB · Ready to process" : "or click to browse files"}</small>{!documentAdded && <em>Browse files</em>}</button><div className="supported-files"><span>Supported formats</span><div><b>PDF</b><b>TXT</b><b>Markdown</b></div></div></>}
      {step === 5 && <div className="wizard-ready"><span><Check size={34}/></span><h1>Your organization is ready 🎉</h1><p>Everything is configured. You can start testing and adding more knowledge.</p><div className="ready-summary"><div><Building2 size={18}/><span><small>Organization</small><b>{name || "New organization"}</b></span><CheckCircle2 size={17}/></div><div><Network size={18}/><span><small>AI Orchestrator</small><b>Configured</b></span><CheckCircle2 size={17}/></div><div><Bot size={18}/><span><small>First FAQ agent</small><b>{agentName}</b></span><CheckCircle2 size={17}/></div><div><FileText size={18}/><span><small>Knowledge</small><b>{documentAdded ? "1 document added" : "Ready to upload later"}</b></span><CheckCircle2 size={17}/></div></div></div>}
      <div className="wizard-actions">{step > 1 && step < 5 && <button className="secondary-button" onClick={() => setStep((current) => current - 1)}>Back</button>}<span/><button className="primary-button" disabled={saving || (step === 1 && !name.trim())} onClick={finish}>{saving ? "Creating…" : step === 5 ? "Go to dashboard" : step === 3 ? "Create agent" : "Continue"}<ArrowRight size={16}/></button></div>
    </motion.div></AnimatePresence></div></main>
  </motion.div>;
}
