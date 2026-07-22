import type { ReactNode } from "react";
import type { Agent } from "./types";

export function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading mb-6 flex min-h-[67px] items-start justify-between gap-6"><div>{eyebrow && <span className="eyebrow mb-1 block text-[9px] font-bold tracking-[.1em] text-brand uppercase">{eyebrow}</span>}<h1 className="font-display text-[25px] leading-8 font-bold tracking-[-.75px]">{title}</h1><p className="mt-1 text-xs leading-5 text-app-muted">{description}</p></div>{children && <div className="heading-actions flex gap-2 pt-1">{children}</div>}</div>;
}

export function AgentAvatar({ agent, large = false }: { agent: Agent; large?: boolean }) {
  return <span className={`agent-avatar ${agent.color} ${large ? "large" : ""}`}>{agent.initials}</span>;
}

export function Status({ status }: { status: Agent["status"] }) {
  return <span className={`status ${status.toLowerCase()}`}><i/>{status}</span>;
}
