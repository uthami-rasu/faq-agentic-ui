"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Cpu, Server, Zap } from "lucide-react";
import type { AiModelDto } from "@/lib/api";

type Props = {
  models: AiModelDto[];
  catalogAvailable: boolean;
};

export function AgentAIConfiguration({ models, catalogAvailable }: Props) {
  const defaultId = models.find((model) => model.default_model)?.id ?? models[0]?.id ?? "";
  const [modelId, setModelId] = useState(defaultId);
  const [temperature, setTemperature] = useState(.3);
  const selectedModel = useMemo(() => models.find((model) => model.id === modelId), [modelId, models]);

  useEffect(() => {
    if (!models.some((model) => model.id === modelId)) setModelId(defaultId);
  }, [defaultId, modelId, models]);

  return <div className="config-page-grid">
    <section className="panel config-panel">
      <div className="panel-title"><div><h2>AI configuration</h2><p>Models are discovered server-side from your private AI service.</p></div>{catalogAvailable && <span className="catalog-status"><Server size={13}/> Live catalog</span>}</div>
      <label className="field"><span>Model</span>{catalogAvailable && models.length > 0 ? <select className="model-select" value={modelId} onChange={(event) => setModelId(event.target.value)}>{models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.provider}</option>)}</select> : <div className="model-catalog-empty"><AlertCircle size={18}/><div><b>{catalogAvailable ? "No FAQ models available" : "Model catalog unavailable"}</b><p>{catalogAvailable ? "Add an FAQ-capable model to the AI service." : "The app is still available. Check the private AI service and refresh this page."}</p></div></div>}</label>
      {selectedModel && <div className="model-summary"><span><Cpu size={18}/></span><div><b>{selectedModel.name}</b><p>{selectedModel.description || "Available for FAQ answer generation."}</p><small>{selectedModel.provider}{selectedModel.context_window ? ` · ${selectedModel.context_window.toLocaleString()} token context` : ""}{selectedModel.default_model ? " · Default" : ""}</small></div></div>}
      <div className="range-field"><div><span>Temperature</span><b>{temperature.toFixed(1)}</b></div><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))}/><div className="range-labels"><span>Precise</span><span>Creative</span></div><p>Lower values keep answers consistent and grounded in your knowledge.</p></div>
      <label className="field"><span>Maximum response tokens</span><input type="number" defaultValue="800" min="100" max="4000"/><small>Recommended: 500–1,000 tokens for concise support answers.</small></label>
    </section>
    <aside className="panel recommendations-panel"><Zap size={20}/><h3>Recommended for FAQ agents</h3><p>This setup balances answer quality, speed, and cost for most customer-facing knowledge agents.</p><ul><li><Check size={13}/> Fast response generation</li><li><Check size={13}/> Reliable instruction following</li><li><Check size={13}/> Low answer variance</li></ul></aside>
  </div>;
}
