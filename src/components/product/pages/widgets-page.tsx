"use client";

import { useState, type CSSProperties } from "react";
import { ArrowRight, Bot, CheckCircle2, Clipboard, LockKeyhole, MessagesSquare, Network, Save, Send, Sparkles, X } from "lucide-react";
import type { Notify } from "../types";
import { PageHeading } from "../shared";

type WidgetStyle = "floating" | "side" | "compact";
type Props = { notify: Notify; embedded?: boolean; agentMode?: boolean; agentName?: string; agentId?: string; organizationId?: string; organizationName?: string; orchestratorName?: string; welcomeMessage?: string };

const colors = ["#168c86", "#2563eb", "#0f9f73", "#e45858", "#171923"];
const styles: Array<{ id: WidgetStyle; label: string; description: string; icon: typeof MessagesSquare }> = [
  { id: "floating", label: "Floating chat", description: "Classic corner assistant", icon: MessagesSquare },
  { id: "side", label: "Side panel", description: "Full-height support panel", icon: Network },
  { id: "compact", label: "Compact", description: "Small, focused chat card", icon: Bot },
];

export function WidgetsPage({ notify, embedded = false, agentMode = false, agentName = "Customer Support", agentId = "agent-id", organizationId = "organization-id", organizationName = "Organization", orchestratorName, welcomeMessage = "Hi! How can I help you today?" }: Props) {
  const [open, setOpen] = useState(true);
  const [brandColor, setBrandColor] = useState(colors[0]);
  const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>("floating");
  const [savedAppearance, setSavedAppearance] = useState({ brandColor: colors[0], widgetStyle: "floating" as WidgetStyle });
  const snippet = agentMode ? `<script src="https://cdn.arffy.ai/widget.js" data-agent="${agentId}"></script>` : `<script src="https://cdn.arffy.ai/widget.js" data-organization="${organizationId}"></script>`;
  const assistantName = agentMode ? agentName : orchestratorName || `${organizationName} Assistant`;
  const heading = agentMode ? `${agentName} widget` : `${organizationName} widget`;
  const description = agentMode ? `Deploy a widget that sends questions directly to ${agentName}.` : "Customize the appearance of your organization assistant.";
  const appearanceDirty = brandColor !== savedAppearance.brandColor || widgetStyle !== savedAppearance.widgetStyle;
  const saveAppearance = () => { if (!appearanceDirty) return; setSavedAppearance({ brandColor, widgetStyle }); notify("Widget appearance saved"); };

  return <>
    {!embedded && <PageHeading eyebrow="Publish with confidence" title="Widget appearance" description="Choose how your assistant looks, preview it, then install it on your website."><AppearanceSaveButton dirty={appearanceDirty} save={saveAppearance}/></PageHeading>}
    {embedded && <div className="section-intro"><div><h2>{heading}</h2><p>{description}</p></div><AppearanceSaveButton dirty={appearanceDirty} save={saveAppearance}/></div>}
    <div className="widget-layout widget-appearance-layout">
      <section className="panel widget-config widget-appearance-config">
        <div className="panel-title"><div><h2>Appearance</h2><p>Content is managed by the Orchestrator; this page controls presentation only.</p></div></div>
        <div className="widget-content-source"><LockKeyhole size={17}/><div><b>Content inherited</b><p><strong>{assistantName}</strong><span>{welcomeMessage}</span></p><small>{agentMode ? "Managed by the FAQ agent" : "Managed in Orchestrator → Configuration"}</small></div></div>
        <div className="widget-control-group"><span>Chat layout</span><div className="widget-appearance-options">{styles.map((option) => { const Icon = option.icon; return <button key={option.id} className={widgetStyle === option.id ? "selected" : ""} onClick={() => { setWidgetStyle(option.id); setOpen(true); }}><Icon size={19}/><span><b>{option.label}</b><small>{option.description}</small></span><CheckCircle2 size={16}/></button>; })}</div></div>
        <div className="widget-control-group"><span>Brand color</span><div className="color-options professional-colors">{colors.map((color) => <button key={color} aria-label={`Use ${color} as the widget color`} className={brandColor === color ? "selected" : ""} style={{ background: color }} onClick={() => setBrandColor(color)}/>)}</div><small className="appearance-help">Applied to the header, launcher, buttons, and focus accents.</small></div>
      </section>
      <WidgetPreview organizationName={organizationName} assistantName={assistantName} welcomeMessage={welcomeMessage} open={open} setOpen={setOpen} brandColor={brandColor} widgetStyle={widgetStyle}/>
    </div>
    <section className="panel install-panel"><div className="panel-title"><div><h2>Install on your website</h2><p>Paste this snippet before the closing &lt;/body&gt; tag.</p></div><span className="secure-badge"><CheckCircle2 size={13}/>Ready to install</span></div><div className="code-block"><code>{snippet}</code><button onClick={() => { navigator.clipboard?.writeText(snippet); notify("Embed code copied"); }}><Clipboard size={15}/>Copy code</button></div></section>
  </>;
}

function AppearanceSaveButton({ dirty, save }: { dirty: boolean; save: () => void }) {
  return <button className="primary-button appearance-save-button" disabled={!dirty} onClick={save}>{dirty ? <Save size={16}/> : <CheckCircle2 size={16}/>} {dirty ? "Save appearance" : "Saved"}</button>;
}

function WidgetPreview({ organizationName, assistantName, welcomeMessage, open, setOpen, brandColor, widgetStyle }: { organizationName: string; assistantName: string; welcomeMessage: string; open: boolean; setOpen: (open: boolean) => void; brandColor: string; widgetStyle: WidgetStyle }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const previewStyle = { "--widget-brand": brandColor } as CSSProperties;
  return <section className="panel preview-panel widget-live-preview" style={previewStyle}><div className="preview-toolbar"><div><h2>Live preview</h2><span>{styles.find((item) => item.id === widgetStyle)?.label}</span></div><div><button className={device === "desktop" ? "selected" : ""} aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Desktop</button><button className={device === "mobile" ? "selected" : ""} aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}>Mobile</button></div></div><div className={`browser-frame preview-${device}`}><div className="browser-bar"><i/><i/><i/><span>yourwebsite.com</span></div><div className="fake-site"><header><b>{organizationName.toUpperCase()}</b><span>Product&nbsp;&nbsp;&nbsp; Solutions&nbsp;&nbsp;&nbsp; Pricing</span><button>Get started</button></header><main><span>AI-POWERED SUPPORT</span><h3>Support that never<br/>keeps you waiting.</h3><p>Give your customers instant, accurate answers—day or night.</p><button>Start free trial</button></main>{open ? <div className={`widget-chat style-${widgetStyle}`}><div className="widget-chat-head"><i className="widget-head-glow"/><span><Sparkles size={17}/></span><div><b>{assistantName}</b><small><i/>Online · typically replies instantly</small></div><button aria-label="Close chat" onClick={() => setOpen(false)}><X size={15}/></button></div><div className="widget-chat-body"><div className="widget-greeting"><span><Sparkles size={13}/></span><small>AI ASSISTANT</small></div><div className="widget-bubble">{welcomeMessage}</div><div className="widget-time">Just now</div><div className="widget-suggestions"><button>Track my order <ArrowRight size={9}/></button><button>Explore pricing <ArrowRight size={9}/></button></div><div className="widget-powered"><Sparkles size={9}/>Powered by Arffy AI</div></div><div className="widget-input"><span>Ask us anything...</span><button aria-label="Send message"><Send size={13}/></button></div></div> : <button className="widget-launcher" aria-label="Open chat" onClick={() => setOpen(true)}><MessagesSquare size={22}/><i/></button>}</div></div></section>;
}
