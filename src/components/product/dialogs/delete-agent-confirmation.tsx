"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { Agent } from "../types";
import { AgentAvatar, Status } from "../shared";

export function DeleteAgentConfirmation({ agent, deleting, cancel, confirm }: { agent: Agent; deleting: boolean; cancel: () => void; confirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !deleting) cancel(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [cancel, deleting]);
  return <motion.div className="confirmation-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) cancel(); }}>
    <motion.section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-agent-title" aria-describedby="delete-agent-description" initial={{ opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95, y: 10 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
      <div className="confirmation-grabber" aria-hidden="true"/><span className="confirmation-icon"><Trash2 size={25}/></span><h2 id="delete-agent-title">Delete this agent?</h2><p id="delete-agent-description">This will permanently remove the agent and its saved configuration from your organization.</p>
      <div className="confirmation-agent"><AgentAvatar agent={agent}/><span><small>FAQ Agent</small><b>{agent.name}</b></span><Status status={agent.status}/></div>
      <div className="confirmation-actions"><button className="confirmation-cancel" autoFocus disabled={deleting} onClick={cancel}>Cancel</button><button className="confirmation-delete" disabled={deleting} onClick={confirm}>{deleting ? <><i className="confirmation-spinner"/>Deleting…</> : <><Trash2 size={15}/>Delete agent</>}</button></div><small className="confirmation-warning">This action can’t be undone.</small>
    </motion.section>
  </motion.div>;
}
