"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Bot, Building2, Check, CheckCircle2, FileText, HelpCircle, Network, Sparkles, X } from "lucide-react";
import type { Organization } from "../types";
import { Status } from "../shared";
import { FileDropField } from "../documents/file-drop-field";

export type OrganizationSetupDraft = {
  agent: { name: string; description: string } | null;
  files: File[];
  orchestrator: { welcomeMessage: string; systemPrompt: string } | null;
};
type Props = { close: () => void; complete: (organization: Omit<Organization, "id" | "version">, setup: OrganizationSetupDraft) => Promise<void> };
const steps = [{ icon: Building2, label: "Organization" }, { icon: Network, label: "Orchestrator" }, { icon: Bot, label: "First agent" }, { icon: FileText, label: "Knowledge" }, { icon: CheckCircle2, label: "Ready" }];

export function CreateOrganizationWizard({ close, complete }: Props) {
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [welcome, setWelcome] = useState("Hello! How can I help you today?");
  const [systemPrompt, setSystemPrompt] = useState("Route each question to the FAQ agent with the most relevant expertise.");
  const [agentName, setAgentName] = useState("Customer Support");
  const [agentDescription, setAgentDescription] = useState("Handles customer support questions.");
  const [files, setFiles] = useState<File[]>([]);
  const [skipped, setSkipped] = useState({ orchestrator: false, agent: false, knowledge: false });
  const next = () => setStep((current) => Math.min(5, current + 1));
  const skip = () => {
    if (step === 2) setSkipped((value) => ({ ...value, orchestrator: true }));
    if (step === 3) setSkipped((value) => ({ ...value, agent: true }));
    if (step === 4) setSkipped((value) => ({ ...value, knowledge: true }));
    next();
  };
  const continueStep = () => {
    if (step === 2) setSkipped((value) => ({ ...value, orchestrator: false }));
    if (step === 3) setSkipped((value) => ({ ...value, agent: false }));
    if (step === 4) setSkipped((value) => ({ ...value, knowledge: false }));
    next();
  };
  const finish = async () => {
    if (step < 5) return continueStep();
    setSaving(true);
    await complete({ name: name.trim(), description: description.trim() || "An Arffy AI organization.", category: "Organization", initials: name.charAt(0).toUpperCase(), color: "teal" }, {
      agent: skipped.agent ? null : { name: agentName.trim(), description: agentDescription.trim() },
      files: skipped.knowledge ? [] : files,
      orchestrator: skipped.orchestrator ? null : { welcomeMessage: welcome.trim(), systemPrompt: systemPrompt.trim() },
    });
    setSaving(false);
  };

  return <motion.div className="organization-wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <WizardSidebar step={step}/>
    <main className="wizard-main"><header><span>Creating a new organization</span><button className="icon-button" onClick={close}><X size={18}/></button></header><div className="wizard-content"><AnimatePresence mode="wait"><motion.div key={step} className="wizard-step" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
      {step === 1 && <><StepIcon icon={Building2}/><h1>Create organization</h1><p>Start with the basics. You can update these details later.</p><label className="field"><span>Organization name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Acme Inc."/></label><label className="field"><span>Description</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does your organization do?"/></label></>}
      {step === 2 && <><StepIcon icon={Network}/><h1>Set up your AI Orchestrator</h1><p>Configure the entry point that routes questions to the right FAQ agent.</p><label className="field"><span>Welcome message</span><textarea rows={3} value={welcome} onChange={(event) => setWelcome(event.target.value)}/></label><label className="field"><span>System prompt</span><textarea rows={6} value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)}/><small>{systemPrompt.length} / 2,000 characters</small></label></>}
      {step === 3 && <><StepIcon icon={Bot}/><h1>Create your first FAQ agent</h1><p>Create a specialist now, or skip and add one from FAQ Agents later.</p><label className="field"><span>Agent name</span><input value={agentName} onChange={(event) => setAgentName(event.target.value)}/></label><label className="field"><span>Description</span><textarea rows={4} value={agentDescription} onChange={(event) => setAgentDescription(event.target.value)}/></label><div className="agent-template-preview"><span className="agent-avatar teal">{initials(agentName)}</span><div><b>{agentName || "Your first agent"}</b><small>{agentDescription || "Describe this agent's responsibility."}</small></div><Status status="Draft"/></div></>}
      {step === 4 && <><StepIcon icon={FileText}/><h1>Add organization knowledge</h1><p>These documents belong to the organization. They can be selected by this agent and any agent you create later.</p><FileDropField files={files} onChange={setFiles}/></>}
      {step === 5 && <ReadyStep name={name} skipped={skipped} agentName={agentName} fileCount={files.length}/>} 
      <WizardActions step={step} saving={saving} disabled={step === 1 && !name.trim()} back={() => setStep((current) => current - 1)} skip={skip} finish={finish}/>
    </motion.div></AnimatePresence></div></main>
  </motion.div>;
}

function WizardSidebar({ step }: { step: number }) {
  return <aside className="wizard-sidebar"><button className="brand wizard-brand"><span className="brand-mark"><Sparkles size={19}/></span><span>Arffy <b>AI</b></span></button><div className="wizard-progress">{steps.map(({ icon: Icon, label }, index) => { const number = index + 1; return <div key={label} className={`${step === number ? "active" : ""} ${step > number ? "complete" : ""}`}><span>{step > number ? <Check size={16}/> : <Icon size={16}/>}</span><div><small>Step {number}</small><b>{label}</b></div></div>; })}</div><div className="wizard-help"><HelpCircle size={16}/><p>Need help?<br/><button>View setup guide</button></p></div></aside>;
}

function ReadyStep({ name, skipped, agentName, fileCount }: { name: string; skipped: Record<string, boolean>; agentName: string; fileCount: number }) {
  const row = (Icon: typeof Building2, label: string, value: string) => <div><Icon size={18}/><span><small>{label}</small><b>{value}</b></span><CheckCircle2 size={17}/></div>;
  return <div className="wizard-ready"><span><Check size={34}/></span><h1>Ready to create</h1><p>Review what will be created. Skipped steps remain available from the dashboard.</p><div className="ready-summary">{row(Building2, "Organization", name)}{row(Network, "AI Orchestrator", skipped.orchestrator ? "Skipped for now" : "Configured")}{row(Bot, "First FAQ agent", skipped.agent ? "Skipped for now" : agentName)}{row(FileText, "Organization knowledge", skipped.knowledge || !fileCount ? "Skipped for now" : `${fileCount} document${fileCount === 1 ? "" : "s"}`)}</div></div>;
}

function WizardActions({ step, saving, disabled, back, skip, finish }: { step: number; saving: boolean; disabled: boolean; back: () => void; skip: () => void; finish: () => void }) {
  return <div className="wizard-actions">{step > 1 && <button className="secondary-button" disabled={saving} onClick={back}>Back</button>}<span/>{step >= 2 && step <= 4 && <button className="ghost-button" onClick={skip}>Skip for now</button>}<button className="primary-button" disabled={saving || disabled} onClick={finish}>{saving ? "Creating…" : step === 5 ? "Create organization" : "Continue"}<ArrowRight size={16}/></button></div>;
}

function StepIcon({ icon: Icon }: { icon: typeof Building2 }) { return <div className="wizard-step-icon"><Icon size={24}/></div>; }
function initials(value: string) { return value.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "AI"; }
