"use client";

import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Sparkles, X, Zap } from "lucide-react";
import { z } from "zod";

const agentSchema = z.object({
  name: z.string().min(2, "Give your agent a name"),
  description: z.string().min(8, "Add a short description"),
});
export type AgentForm = z.infer<typeof agentSchema>;

export function CreateAgentModal({ close, add }: { close: () => void; add: (values: AgentForm) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AgentForm>({ resolver: zodResolver(agentSchema), defaultValues: { name: "", description: "" } });
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && close()}><motion.form className="modal" onSubmit={handleSubmit(add)} initial={{ opacity: 0, scale: .96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 10 }}>
    <div className="modal-head"><span><Sparkles size={20}/></span><div><h2>Create an FAQ agent</h2><p>Give your new expert a clear purpose.</p></div><button type="button" className="icon-button" onClick={close}><X size={18}/></button></div>
    <div className="modal-body"><label className={`field ${errors.name ? "has-error" : ""}`}><span>Agent name</span><input autoFocus placeholder="e.g. Product specialist" {...register("name")}/>{errors.name && <small>{errors.name.message}</small>}</label><label className={`field ${errors.description ? "has-error" : ""}`}><span>Description</span><textarea rows={4} placeholder="What questions should this agent answer?" {...register("description")}/>{errors.description && <small>{errors.description.message}</small>}</label><div className="modal-tip"><Zap size={16}/><p><b>You can configure everything later.</b><br/>After creation, add knowledge sources and tune the agent’s behavior.</p></div></div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={isSubmitting}><Sparkles size={16}/> Create agent</button></div>
  </motion.form></motion.div>;
}
