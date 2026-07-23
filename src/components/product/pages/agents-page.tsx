"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Copy, FileText, LayoutDashboard, Menu, MoreHorizontal, Pencil, Play, Plus, Search, SlidersHorizontal, Trash2, WandSparkles, X } from "lucide-react";
import type { AgentDto, InitialAppData, PaginatedResult } from "@/lib/api";
import { useMockData } from "../data";
import { mapAgent } from "../utils";
import type { Agent, AgentTab, Notify } from "../types";
import { AgentAvatar, PageHeading, Status } from "../shared";

type AgentsPageProps = {
  agents: Agent[];
  organizationId: string;
  search: string;
  setSearch: (value: string) => void;
  ssrPage?: PaginatedResult<AgentDto>;
  ssrQuery?: InitialAppData["faqQuery"];
  create: () => void;
  openAgent: (agent: Agent, tab?: AgentTab) => void;
  duplicateAgent: (agent: Agent) => void;
  deleteAgent: (agent: Agent) => void;
  notify: Notify;
};

export function AgentsPage({ agents, organizationId, search, setSearch, ssrPage, ssrQuery, create, openAgent, duplicateAgent, deleteAgent, notify }: AgentsPageProps) {
  const pageSize = 6;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localPage, setLocalPage] = useState(1);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [actionAgentId, setActionAgentId] = useState<string | null>(null);
  const page = ssrQuery?.page ?? localPage;

  useEffect(() => {
    if (!ssrQuery || search.trim() === ssrQuery.search) return;
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const nextSearch = search.trim();
      if (nextSearch) params.set("agent_search", nextSearch);
      else params.delete("agent_search");
      params.set("agent_page", "1");
      params.set("view", "agents");
      startTransition(() => router.replace(`${window.location.pathname}?${params}`, { scroll: false }));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [router, search, ssrQuery]);
  useEffect(() => { setLocalPage(1); }, [search, organizationId]);
  useEffect(() => {
    if (!actionAgentId) return;
    const closeMenu = () => setActionAgentId(null);
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeMenu(); };
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("click", closeMenu); document.removeEventListener("keydown", closeOnEscape); };
  }, [actionAgentId]);
  useEffect(() => { setActionAgentId(null); }, [page, search, layout, organizationId]);

  const matches = useMemo(() => agents.filter((agent) => `${agent.name} ${agent.description}`.toLowerCase().includes(search.trim().toLowerCase())), [agents, search]);
  const useLocalPage = useMockData || !ssrPage;
  const visibleAgents = useLocalPage ? matches.slice((page - 1) * pageSize, page * pageSize) : ssrPage.items.map(mapAgent);
  const totalItems = useLocalPage ? matches.length : ssrPage.totalItems;
  const totalPages = useLocalPage ? Math.ceil(totalItems / pageSize) : ssrPage.totalPages;
  const firstVisible = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, totalItems);
  const firstPageButton = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));
  const pageButtons = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPageButton + index);
  const showShimmer = !useMockData && isPending;

  const goToPage = (nextPage: number) => {
    if (!ssrQuery) return setLocalPage(nextPage);
    const params = new URLSearchParams(window.location.search);
    params.set("agent_page", String(nextPage));
    params.set("view", "agents");
    startTransition(() => router.replace(`${window.location.pathname}?${params}`, { scroll: false }));
  };

  return <div className="agents-page">
    <PageHeading eyebrow="Knowledge team" title="FAQ Agents" description="Build specialized AI agents grounded in your company knowledge."><button className="secondary-button"><SlidersHorizontal size={16}/> Filters</button><button className="primary-button" onClick={create}><Plus size={17}/> Create agent</button></PageHeading>
    <div className="agent-page-summary"><div><WandSparkles size={20}/><span><strong>Give every question an expert</strong><small>Each agent owns its knowledge, instructions, playground, and widget.</small></span></div>{agents[0] && <button onClick={() => openAgent(agents[0], "playground")}>Try an agent <ArrowRight size={14}/></button>}</div>
    <div className="agents-toolbar"><label><Search size={16}/><input aria-label="Search FAQ agents" placeholder="Search agents" value={search} onChange={(event) => setSearch(event.target.value)}/>{search && <button aria-label="Clear agent search" className="clear-agent-search" onClick={() => setSearch("")}><X size={14}/></button>}</label><span aria-live="polite">{isPending && !useMockData ? "Searching…" : `${totalItems} ${totalItems === 1 ? "agent" : "agents"}`}</span><div className="view-toggle" aria-label="Agent layout"><button aria-label="Grid view" aria-pressed={layout === "grid"} className={layout === "grid" ? "selected" : ""} onClick={() => setLayout("grid")}><LayoutDashboard size={15}/></button><button aria-label="List view" aria-pressed={layout === "list"} className={layout === "list" ? "selected" : ""} onClick={() => setLayout("list")}><Menu size={15}/></button></div></div>
    <div className={`agents-grid ${layout === "list" ? "list-view" : ""}`} aria-busy={isPending && !useMockData}>
      {showShimmer && Array.from({ length: layout === "grid" ? 6 : 4 }, (_, index) => <article className="agent-card agent-card-shimmer" key={index} aria-hidden="true"><div className="agent-card-top"><span className="shimmer-block shimmer-avatar"/><i className="shimmer-block shimmer-status"/><i className="shimmer-block shimmer-menu"/></div><h2 className="shimmer-block"/><p><span className="shimmer-block"/><span className="shimmer-block short"/></p><div className="agent-meta"><span className="shimmer-block"/><span className="shimmer-block"/></div></article>)}
      {!showShimmer && visibleAgents.map((agent) => <article className={`agent-card ${actionAgentId === agent.id ? "actions-open" : ""}`} key={agent.id} role="button" tabIndex={0} aria-label={`Open ${agent.name}`} onClick={() => { openAgent(agent); notify(`${agent.name} opened`); }} onKeyDown={(event) => { if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return; event.preventDefault(); openAgent(agent); }}>
        <div className="agent-card-top"><AgentAvatar agent={agent} large/><Status status={agent.status}/><button className="icon-button small" aria-label={`Actions for ${agent.name}`} aria-haspopup="menu" aria-expanded={actionAgentId === agent.id} onClick={(event) => { event.stopPropagation(); setActionAgentId((current) => current === agent.id ? null : agent.id); }}><MoreHorizontal size={17}/></button>{actionAgentId === agent.id && <div className="agent-actions-menu" role="menu" onClick={(event) => event.stopPropagation()}><button role="menuitem" autoFocus onClick={() => { setActionAgentId(null); openAgent(agent); }}><Pencil size={15}/><span><b>Edit agent</b><small>Update details and settings</small></span></button><button role="menuitem" onClick={() => openAgent(agent, "knowledge")}><FileText size={15}/><span><b>Knowledge sources</b><small>Manage connected documents</small></span></button><button role="menuitem" onClick={() => openAgent(agent, "playground")}><Play size={15}/><span><b>Test in playground</b><small>Try a question directly</small></span></button><div className="agent-actions-divider"/><button role="menuitem" onClick={() => duplicateAgent(agent)}><Copy size={15}/><span><b>Duplicate agent</b><small>Create an editable draft copy</small></span></button><button className="danger" role="menuitem" onClick={() => deleteAgent(agent)}><Trash2 size={15}/><span><b>Delete agent</b><small>Permanently remove this agent</small></span></button></div>}</div>
        <h2>{agent.name}</h2><p>{agent.description}</p><div className="agent-meta"><span><FileText size={15}/>{agent.docs} sources</span><span><Pencil size={15}/>Updated {agent.updated}</span></div>
      </article>)}
      {!showShimmer && visibleAgents.length > 0 && page === 1 && !search && <button className="new-agent-card" onClick={create}><span><Plus size={22}/></span><strong>Create a new agent</strong><small>Train an expert on a new topic</small></button>}
    </div>
    {visibleAgents.length === 0 && !isPending && <div className="agents-empty"><Search size={22}/><h2>No agents found</h2><p>{search ? `No FAQ agents match “${search}”.` : "Create your first FAQ agent to get started."}</p>{search ? <button className="secondary-button" onClick={() => setSearch("")}>Clear search</button> : <button className="primary-button" onClick={create}><Plus size={16}/> Create agent</button>}</div>}
    {!showShimmer && totalPages > 1 && <nav className="agents-pagination" aria-label="FAQ agent pages"><span>Showing {firstVisible}–{lastVisible} of {totalItems}</span><div><button aria-label="Previous page" disabled={page === 1} onClick={() => goToPage(Math.max(1, page - 1))}><ChevronLeft size={16}/></button>{pageButtons.map((number) => <button key={number} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} className={number === page ? "active" : ""} onClick={() => goToPage(number)}>{number}</button>)}<button aria-label="Next page" disabled={page === totalPages} onClick={() => goToPage(Math.min(totalPages, page + 1))}><ChevronRight size={16}/></button></div></nav>}
  </div>;
}
