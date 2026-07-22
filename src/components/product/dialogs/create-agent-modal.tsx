"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight, BookOpen, Check, LoaderCircle, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { z } from "zod";

const agentSchema = z.object({
  name: z.string().trim().min(2, "Give your agent a name").max(80, "Keep the name under 80 characters"),
  description: z.string().trim().min(8, "Add a short description").max(240, "Keep the description under 240 characters"),
});
export type AgentForm = z.infer<typeof agentSchema>;

export function CreateAgentModal({ close, add }: { close: () => void; add: (values: AgentForm) => Promise<void> }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<AgentForm>({ resolver: zodResolver(agentSchema), defaultValues: { name: "", description: "" } });
  const name = watch("name");
  const description = watch("description");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !isSubmitting) close(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [close, isSubmitting]);

  return <motion.div className="modal-backdrop premium-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && close()}>
    <motion.form className="modal agent-create-modal" aria-labelledby="create-agent-title" onSubmit={handleSubmit(add)} initial={{ opacity: 0, scale: .975, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98, y: 10 }} transition={{ type: "spring", stiffness: 360, damping: 30 }}>
      <header className="agent-create-head"><div className="agent-create-mark"><Sparkles size={20}/></div><div><span className="agent-create-kicker">New knowledge agent</span><h2 id="create-agent-title">Create your FAQ expert</h2><p>Start with a clear purpose. Knowledge and behavior can be refined next.</p></div><button type="button" className="icon-button" aria-label="Close create agent dialog" disabled={isSubmitting} onClick={close}><X size={18}/></button></header>
      <div className="agent-create-layout">
        <section className="agent-create-form"><label className={`field ${errors.name ? "has-error" : ""}`}><span><b>Agent name</b><small>{name.length}/80</small></span><input autoFocus autoComplete="off" placeholder="e.g. Product support expert" {...register("name")}/>{errors.name && <small>{errors.name.message}</small>}</label><label className={`field ${errors.description ? "has-error" : ""}`}><span><b>Purpose</b><small>{description.length}/240</small></span><textarea rows={4} placeholder="Describe the questions this agent should answer…" {...register("description")}/>{errors.description && <small>{errors.description.message}</small>}</label></section>
        <aside className="agent-create-preview"><span className="preview-label">Agent preview</span><div className="preview-agent-icon"><Sparkles size={23}/></div><h3>{name.trim() || "Your FAQ expert"}</h3><p>{description.trim() || "A focused assistant grounded in your organization’s knowledge."}</p><div className="preview-next"><span><Check size={13}/><BookOpen size={15}/> Add knowledge sources</span><span><Check size={13}/><SlidersHorizontal size={15}/> Tune AI behavior</span></div></aside>
      </div>
      <footer className="agent-create-actions"><p><span><Check size={12}/></span>Created as a private draft</p><div><button type="button" className="secondary-button" disabled={isSubmitting} onClick={close}>Cancel</button><button className="primary-button create-agent-submit" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle className="spin" size={16}/> : <Sparkles size={16}/>} {isSubmitting ? "Creating…" : "Create agent"}<ArrowRight size={15}/></button></div></footer>
    </motion.form>
  </motion.div>;
}
