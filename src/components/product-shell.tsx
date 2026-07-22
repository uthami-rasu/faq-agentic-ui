"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Activity, AlertCircle, ArrowRight, ArrowUpRight, Bell, Bot, Check, CheckCircle2,
  Building2, ChevronDown, ChevronLeft, ChevronRight, CircleDashed, Clipboard, Code2, Copy, Database,
  FileText, FileUp, Files, Globe2, HelpCircle, LayoutDashboard, Menu, MessagesSquare,
  Moon, MoreHorizontal, Network, PanelLeftClose, Pencil, Play, Plus, RotateCcw,
  Save, Search, Send, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Trash2, Upload,
  UserRound, WandSparkles, X, Zap,
} from "lucide-react";
import { setSidebarOpen, setTheme, setView, useAppDispatch, useAppSelector, ViewKey } from "@/store";
import { AgentDto, ApiError, faqApi, InitialAppData, OrganizationDto, PaginatedResult } from "@/lib/api";
import { loadAgentsPageAction } from "@/app/actions";

type Agent = {
  id: string; name: string; description: string; docs: number; updated: string;
  status: "Live" | "Draft"; color: string; initials: string; organizationId: string; version: number;
};

type Organization = {
  id: string; name: string; description: string; category: string; initials: string; color: string; version: number;
};

type DashboardBackendData = {
  processing: { completed: number; processing: number; failed: number };
  orchestratorConfigured: boolean;
  organizationWidgetConfigured: boolean;
  faqAgentWidgets: number;
  activity: { id: number; label: string; context: string; time: string; kind: "document" | "agent" | "widget" }[];
};

const initialOrganizations: Organization[] = [
  { id: "1", name: "Acme Inc.", description: "AI-powered tools for modern support teams.", category: "SaaS Company", initials: "A", color: "sand", version: 0 },
  { id: "2", name: "TechNova Pvt Ltd", description: "Building better digital learning experiences.", category: "Educational Institute", initials: "T", color: "blue", version: 0 },
  { id: "3", name: "Healthcare Plus", description: "Accessible patient information and support.", category: "Healthcare", initials: "H", color: "green", version: 0 },
];

const initialDashboardData: Record<string, DashboardBackendData> = {
  "1": {
    processing: { completed: 80, processing: 3, failed: 1 },
    orchestratorConfigured: true,
    organizationWidgetConfigured: true,
    faqAgentWidgets: 3,
    activity: [
      { id: 1, label: "pricing.pdf uploaded", context: "Customer Support", time: "12 min ago", kind: "document" },
      { id: 2, label: "Customer Support updated", context: "FAQ Agent", time: "2 hours ago", kind: "agent" },
      { id: 3, label: "Developer Docs created", context: "FAQ Agent", time: "Yesterday", kind: "agent" },
      { id: 4, label: "Organization Widget configured", context: "Widget", time: "2 days ago", kind: "widget" },
    ],
  },
};

const initialAgents: Agent[] = [
  { id: "1", name: "Customer Support", description: "Product questions, troubleshooting, and account help.", docs: 22, updated: "12 min ago", status: "Live", color: "violet", initials: "CS", organizationId: "1", version: 0 },
  { id: "2", name: "Employee Handbook", description: "Benefits, workplace policies, and people operations.", docs: 18, updated: "Yesterday", status: "Live", color: "blue", initials: "EH", organizationId: "1", version: 0 },
  { id: "3", name: "Developer Docs", description: "API references, SDK guides, and integrations.", docs: 16, updated: "3 days ago", status: "Draft", color: "orange", initials: "DD", organizationId: "1", version: 0 },
  { id: "4", name: "Billing & Plans", description: "Subscriptions, invoices, pricing, and plan changes.", docs: 15, updated: "4 days ago", status: "Live", color: "emerald", initials: "BP", organizationId: "1", version: 0 },
  { id: "5", name: "Sales FAQ", description: "Product capabilities, plans, and purchasing questions.", docs: 13, updated: "1 week ago", status: "Live", color: "blue", initials: "SF", organizationId: "1", version: 0 },
];

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QD";
}

function mapOrganization(item: OrganizationDto): Organization {
  return { id: item.id, name: item.name, description: item.description, category: item.category, initials: initials(item.name), color: "violet", version: item.version };
}

function mapAgent(item: AgentDto): Agent {
  return { id: item.id, organizationId: item.organization_id, name: item.name, description: item.description, docs: 0, updated: new Date(item.updated_at).toLocaleString(), status: item.status === "ACTIVE" && item.enabled ? "Live" : "Draft", color: "emerald", initials: initials(item.name), version: item.version };
}

function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? `${error.message} (${error.code})` : "The backend request failed.";
}

const documents = [
  { name: "Product_Guide_2026.pdf", agent: "Customer Support", size: "4.8 MB", chunks: 142, date: "Today, 9:42 AM", status: "Ready" },
  { name: "Returns_and_Refunds.md", agent: "Customer Support", size: "68 KB", chunks: 18, date: "Yesterday", status: "Ready" },
  { name: "Employee_Handbook.pdf", agent: "Employee Handbook", size: "2.1 MB", chunks: 86, date: "Jul 18, 2026", status: "Ready" },
  { name: "API_Authentication.md", agent: "Developer Docs", size: "124 KB", chunks: 31, date: "Jul 17, 2026", status: "Processing" },
];

type OrganizationTab = "overview" | "branding" | "members" | "api" | "danger";
type AgentTab = "overview" | "knowledge" | "ai" | "retrieval" | "prompt" | "playground" | "widget";

const titleMap: Record<ViewKey, string> = {
  dashboard: "Dashboard", organization: "Organization Overview", orchestrator: "AI Orchestrator", agents: "FAQ Agents",
  agent: "Agent details", settings: "Settings",
};

const agentSchema = z.object({
  name: z.string().min(2, "Give your agent a name"),
  description: z.string().min(8, "Add a short description"),
});
type AgentForm = z.infer<typeof agentSchema>;

export function ProductShell({ initialData, initialView }: { initialData?: InitialAppData; initialView?: ViewKey }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { view: storedView, theme, sidebarOpen } = useAppSelector((state) => state.ui);
  const [applyingInitialView, setApplyingInitialView] = useState(Boolean(initialView));
  const view = applyingInitialView && initialView ? initialView : storedView;
  const serverOrganizations = initialData?.organizations.map(mapOrganization) ?? [];
  const serverAgents = initialData?.agentsPage.items.map(mapAgent) ?? [];
  const [agents, setAgents] = useState<Agent[]>(useMockData ? initialAgents : serverAgents);
  const [search, setSearch] = useState(initialData?.faqQuery.search ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [organizationTab, setOrganizationTab] = useState<OrganizationTab>("overview");
  const [agentTab, setAgentTab] = useState<AgentTab>("overview");
  const [selectedAgentId, setSelectedAgentId] = useState(useMockData ? initialAgents[0].id : serverAgents[0]?.id ?? "");
  const [organizations, setOrganizations] = useState<Organization[]>(useMockData ? initialOrganizations : serverOrganizations);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(useMockData ? initialOrganizations[0].id : serverOrganizations[0]?.id ?? "");
  const [showOrganizationMenu, setShowOrganizationMenu] = useState(false);
  const [showOrganizationWizard, setShowOrganizationWizard] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [dashboardData, setDashboardData] = useState<Record<string, DashboardBackendData>>(useMockData ? initialDashboardData : {});
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ agent: Agent; returnToList: boolean } | null>(null);
  const [deletingAgent, setDeletingAgent] = useState(false);

  useEffect(() => {
    if (!initialView) return;
    dispatch(setView(initialView));
    setApplyingInitialView(false);
  }, [dispatch, initialView]);

  const organizationsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => faqApi.listOrganizations(),
    enabled: !useMockData,
    initialData: initialData?.organizations,
    retry: 1,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const agentsQuery = useQuery({
    queryKey: ["faq-agents", selectedOrganizationId],
    queryFn: () => loadAgentsPageAction({ organizationId: selectedOrganizationId, pageSize: 100 }),
    enabled: !useMockData && Boolean(selectedOrganizationId),
    initialData: selectedOrganizationId === initialData?.organizations[0]?.id ? initialData.agentsPage : undefined,
    retry: 1,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("querydesk-theme") as "light" | "dark" | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    dispatch(setTheme(saved || preferred));
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("querydesk-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!initialData) return;
    setSearch(initialData.faqQuery.search);
  }, [initialData?.faqQuery.search]);

  useEffect(() => {
    if (!organizationsQuery.data) return;
    const loaded = organizationsQuery.data.map(mapOrganization);
    setOrganizations(loaded);
    setSelectedOrganizationId((current) => loaded.some((organization) => organization.id === current) ? current : loaded[0]?.id ?? "");
  }, [organizationsQuery.data]);

  useEffect(() => {
    if (!agentsQuery.data || !selectedOrganizationId) return;
    const loaded = agentsQuery.data.items.map(mapAgent);
    setAgents((current) => [...current.filter((agent) => agent.organizationId !== selectedOrganizationId), ...loaded]);
    setSelectedAgentId((current) => loaded.some((agent) => agent.id === current) ? current : loaded[0]?.id ?? "");
  }, [agentsQuery.data, selectedOrganizationId]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const changeView = (next: ViewKey) => dispatch(setView(next));
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) || organizations[0];
  const organizationAgents = agents.filter((agent) => agent.organizationId === selectedOrganization?.id);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || organizationAgents[0] || agents[0];
  const openAgent = (agent: Agent, tab: AgentTab = "overview") => {
    setAgents((current) => current.some((item) => item.id === agent.id)
      ? current.map((item) => item.id === agent.id ? agent : item)
      : [agent, ...current]);
    setSelectedAgentId(agent.id);
    setAgentTab(tab);
    changeView("agent");
  };

  if (!selectedOrganization) {
    const failed = organizationsQuery.isError;
    return <main className="min-h-screen bg-app-bg text-app-text grid place-items-center p-8"><section className="panel max-w-xl p-8 text-center"><span className="wizard-step-icon mx-auto"><Database size={24}/></span><h1 className="mt-4 font-display text-2xl font-bold">{failed ? "Backend connection failed" : "Loading QueryDesk"}</h1><p className="mt-2 text-sm text-app-muted">{failed ? apiErrorMessage(organizationsQuery.error) : "Loading organizations and FAQ agents from the backend…"}</p>{failed && <button className="primary-button mt-5" onClick={() => organizationsQuery.refetch()}><RotateCcw size={16}/> Retry connection</button>}{!failed && organizationsQuery.isSuccess && <p className="mt-4 text-xs text-app-muted">No organization is available. Restart with <code>./start.sh</code> to create the development seed.</p>}</section></main>;
  }

  const saveOrganization = (updates: Partial<Organization>) => {
    const previous = selectedOrganization;
    setOrganizations((current) => current.map((organization) => organization.id === previous.id ? { ...organization, ...updates } : organization));
    void faqApi.updateOrganization(previous.id, {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      version: previous.version,
    }).then((saved) => {
      setOrganizations((current) => current.map((organization) => organization.id === saved.id ? mapOrganization(saved) : organization));
      notify("Organization profile saved");
    }).catch((error) => {
      setOrganizations((current) => current.map((organization) => organization.id === previous.id ? previous : organization));
      notify(apiErrorMessage(error));
    });
  };

  const saveAgent = (updates: Partial<Agent>) => {
    if (!selectedAgent) return;
    const previous = selectedAgent;
    setAgents((current) => current.map((agent) => agent.id === previous.id ? { ...agent, ...updates, updated: "Saving…" } : agent));
    void faqApi.updateAgent(previous.organizationId, previous.id, {
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.status !== undefined ? { status: updates.status === "Live" ? "ACTIVE" : "DRAFT", enabled: updates.status === "Live" } : {}),
      version: previous.version,
    }).then((saved) => {
      setAgents((current) => current.map((agent) => agent.id === saved.id ? mapAgent(saved) : agent));
      notify(`${saved.name} updated`);
    }).catch((error) => {
      setAgents((current) => current.map((agent) => agent.id === previous.id ? previous : agent));
      notify(apiErrorMessage(error));
    });
  };

  const duplicateAgent = (source: Agent, openCreated = false) => {
    void faqApi.duplicateAgent(source.organizationId, source.id).then((created) => {
      const mapped = mapAgent(created);
      setAgents((current) => [mapped, ...current]);
      if (openCreated) setSelectedAgentId(mapped.id);
      void queryClient.invalidateQueries({ queryKey: ["faq-agents-page", source.organizationId] });
      router.refresh();
      notify(`${mapped.name} created as a draft`);
    }).catch((error) => notify(apiErrorMessage(error)));
  };

  const deleteAgent = (target: Agent, returnToList = false) => {
    setDeleteConfirmation({ agent: target, returnToList });
  };

  const confirmDeleteAgent = () => {
    if (!deleteConfirmation || deletingAgent) return;
    const { agent: target, returnToList } = deleteConfirmation;
    setDeletingAgent(true);
    void faqApi.deleteAgent(target.organizationId, target.id).then(() => {
      setAgents((current) => current.filter((agent) => agent.id !== target.id));
      if (selectedAgentId === target.id) setSelectedAgentId("");
      if (returnToList) changeView("agents");
      void queryClient.invalidateQueries({ queryKey: ["faq-agents-page", target.organizationId] });
      router.refresh();
      setDeleteConfirmation(null);
      notify(`${target.name} deleted`);
    }).catch((error) => notify(apiErrorMessage(error))).finally(() => setDeletingAgent(false));
  };

  const duplicateSelectedAgent = () => { if (selectedAgent) duplicateAgent(selectedAgent, true); };
  const deleteSelectedAgent = () => { if (selectedAgent) deleteAgent(selectedAgent, true); };

  return (
    <div className="app-shell min-h-screen bg-app-bg font-sans text-app-text">
      <AnimatePresence>{sidebarOpen && <motion.button aria-label="Close navigation" onClick={() => dispatch(setSidebarOpen(false))} className="sidebar-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
      <aside className={`sidebar fixed inset-y-0 left-0 z-30 flex w-[244px] flex-col px-3.5 ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row flex h-[70px] items-center justify-between px-2">
          <button className="brand" onClick={() => changeView("dashboard")}>
            <span className="brand-mark"><Sparkles size={19} strokeWidth={2.5} /></span>
            <span>QueryDesk <b>AI</b></span>
          </button>
          <button className="icon-button sidebar-close" onClick={() => dispatch(setSidebarOpen(false))}><X size={18} /></button>
        </div>
        <button className="workspace-switcher" aria-expanded={showOrganizationMenu} onClick={() => setShowOrganizationMenu((open) => !open)}>
          <span className="workspace-avatar">{selectedOrganization.initials}</span>
          <span><small>Organization</small><strong>{selectedOrganization.name}</strong></span>
          <ChevronDown size={15} className={showOrganizationMenu ? "org-chevron-open" : ""}/>
        </button>
        <AnimatePresence>{showOrganizationMenu && <motion.div className="organization-menu" initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .98 }}>
          <div className="organization-menu-title"><span>Select organization</span><button onClick={() => { setShowOrganizationMenu(false); setOrganizationSearch(""); }}><X size={14}/></button></div>
          <label className="organization-search"><Search size={15}/><input autoFocus value={organizationSearch} onChange={(event) => setOrganizationSearch(event.target.value)} placeholder="Search organizations..."/><kbd>{organizations.filter((organization) => `${organization.name} ${organization.category}`.toLowerCase().includes(organizationSearch.toLowerCase())).length}</kbd></label>
          <div className="organization-options" role="listbox" aria-label="Organizations">{organizations.filter((organization) => `${organization.name} ${organization.category}`.toLowerCase().includes(organizationSearch.toLowerCase())).map((organization) => <button role="option" aria-selected={organization.id === selectedOrganization.id} key={organization.id} className={organization.id === selectedOrganization.id ? "selected" : ""} onClick={() => { if (organization.id === selectedOrganization.id) { setOrganizationTab("overview"); changeView("organization"); } else { setSelectedOrganizationId(organization.id); changeView("dashboard"); notify(`Switched to ${organization.name}`); } setShowOrganizationMenu(false); setOrganizationSearch(""); }}><span className={`organization-option-avatar ${organization.color}`}>{organization.initials}</span><span><strong>{organization.name}</strong><small>{organization.category}</small></span>{organization.id === selectedOrganization.id && <Check size={15}/>}</button>)}{organizations.filter((organization) => `${organization.name} ${organization.category}`.toLowerCase().includes(organizationSearch.toLowerCase())).length === 0 && <div className="organization-no-results">No organizations found</div>}</div>
          <div className="organization-menu-actions"><button onClick={() => { setShowOrganizationMenu(false); setOrganizationSearch(""); setOrganizationTab("overview"); changeView("organization"); }}><span><Pencil size={15}/></span>Edit {selectedOrganization.name}</button><button onClick={() => { setShowOrganizationMenu(false); setOrganizationSearch(""); setShowOrganizationWizard(true); }}><span><Plus size={15}/></span>Create organization</button></div>
        </motion.div>}</AnimatePresence>
        <nav className="sidebar-nav flex flex-col gap-[3px]">
          <p className="nav-label">Navigation</p>
          <button className={view === "dashboard" ? "active" : ""} onClick={() => changeView("dashboard")}><LayoutDashboard size={18} /><span>Dashboard</span></button>
          <button className={view === "orchestrator" ? "active" : ""} onClick={() => changeView("orchestrator")}><Network size={18} /><span>AI Orchestrator</span></button>
          <button className={view === "agents" || view === "agent" ? "active" : ""} onClick={() => changeView("agents")}><Bot size={18} /><span>FAQ Agents</span><em>{organizationAgents.length}</em></button>
          {view === "agent" && selectedAgent && <div className="sidebar-agent-context"><AgentAvatar agent={selectedAgent} /><span><small>Editing agent</small><strong>{selectedAgent.name}</strong></span></div>}
          <p className="nav-label nav-label-space">Manage</p>
          <button className={view === "settings" ? "active" : ""} onClick={() => changeView("settings")}><Settings size={18} /><span>Settings</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className="profile-row">
            <span className="profile-avatar">OS</span>
            <span><strong>Olivia Stone</strong><small>olivia@acme.com</small></span>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>

      <main className="main-area min-h-screen">
        <header className="topbar sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-app-border px-[30px] backdrop-blur-xl">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => dispatch(setSidebarOpen(true))}><Menu size={20} /></button>
            <div><span>{selectedOrganization.name}</span><ChevronRight size={13} /><strong>{titleMap[view]}</strong></div>
          </div>
          <div className="topbar-actions flex items-center gap-2">
            <label className="global-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search anything..." /><kbd>⌘ K</kbd></label>
            <button className="icon-button" aria-label="Change theme" onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You're all caught up")}><Bell size={18} /><i /></button>
            <button className="primary-button top-create" onClick={() => setShowCreate(true)}><Plus size={17} /> New agent</button>
          </div>
        </header>

        <div className="content-wrap mx-auto max-w-[1480px] px-[34px] pt-8 pb-12">
          <AnimatePresence mode="wait">
            <motion.div key={`${view}-${view === "organization" ? organizationTab : view === "agent" ? agentTab : ""}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .2 }}>
              {view === "dashboard" && <Dashboard agents={organizationAgents} organization={selectedOrganization} data={dashboardData[selectedOrganization.id] || { processing: { completed: 0, processing: 0, failed: 0 }, orchestratorConfigured: false, organizationWidgetConfigured: false, faqAgentWidgets: 0, activity: [] }} />}
              {view === "organization" && <OrganizationPage tab={organizationTab} setTab={setOrganizationTab} organization={selectedOrganization} agents={organizationAgents} notify={notify} updateOrganization={saveOrganization} />}
              {view === "orchestrator" && <OrchestratorPage agents={organizationAgents} organizationName={selectedOrganization.name} configured={dashboardData[selectedOrganization.id]?.orchestratorConfigured || false} notify={notify} onSave={() => setDashboardData((current) => ({ ...current, [selectedOrganization.id]: { ...(current[selectedOrganization.id] || { processing: { completed: 0, processing: 0, failed: 0 }, organizationWidgetConfigured: false, faqAgentWidgets: 0, activity: [] }), orchestratorConfigured: true } }))}/>} 
              {view === "agents" && <AgentsPage agents={organizationAgents} organizationId={selectedOrganization.id} search={search} setSearch={setSearch} ssrPage={selectedOrganization.id === initialData?.organizations[0]?.id ? initialData.faqAgentsPage : undefined} ssrQuery={selectedOrganization.id === initialData?.organizations[0]?.id ? initialData.faqQuery : undefined} create={() => setShowCreate(true)} openAgent={openAgent} duplicateAgent={(agent) => duplicateAgent(agent)} deleteAgent={(agent) => deleteAgent(agent)} notify={notify} />}
              {view === "agent" && selectedAgent && <AgentDetailsPage agent={selectedAgent} tab={agentTab} setTab={setAgentTab} notify={notify} onBack={() => changeView("agents")} updateAgent={saveAgent} duplicateAgent={duplicateSelectedAgent} deleteAgent={deleteSelectedAgent} />}
              {view === "settings" && <SettingsPage notify={notify} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>{showCreate && <CreateAgentModal close={() => setShowCreate(false)} add={async (values) => {
        try {
          const created = mapAgent(await faqApi.createAgent(selectedOrganization.id, values));
          setAgents((current) => [created, ...current]);
          setDashboardData((current) => ({ ...current, [selectedOrganization.id]: { ...(current[selectedOrganization.id] || { processing: { completed: 0, processing: 0, failed: 0 }, orchestratorConfigured: false, organizationWidgetConfigured: false, faqAgentWidgets: 0, activity: [] }), activity: [{ id: Date.now(), label: `${values.name} created`, context: "FAQ Agent", time: "Just now", kind: "agent" }, ...(current[selectedOrganization.id]?.activity || [])] } }));
          setSelectedAgentId(created.id); setAgentTab("overview"); setShowCreate(false); notify(`${values.name} created as a draft`); changeView("agent");
          router.refresh();
        } catch (error) { notify(apiErrorMessage(error)); }
      }} />}</AnimatePresence>
      <AnimatePresence>{showOrganizationWizard && <CreateOrganizationWizard close={() => setShowOrganizationWizard(false)} complete={async (organization, agentDraft) => {
        try {
          const created = mapOrganization(await faqApi.createOrganization({ name: organization.name, description: organization.description, category: organization.category }));
          setOrganizations((current) => [...current, created]);
          setSelectedOrganizationId(created.id);
          if (agentDraft.name) {
            const createdAgent = mapAgent(await faqApi.createAgent(created.id, { name: agentDraft.name, description: agentDraft.description }));
            setAgents((current) => [createdAgent, ...current]);
            setSelectedAgentId(createdAgent.id);
          }
          setDashboardData((current) => ({ ...current, [created.id]: { processing: { completed: 0, processing: 0, failed: 0 }, orchestratorConfigured: false, organizationWidgetConfigured: false, faqAgentWidgets: 0, activity: [{ id: Date.now(), label: `${agentDraft.name} created`, context: "FAQ Agent", time: "Just now", kind: "agent" }] } }));
          setShowOrganizationWizard(false); changeView("dashboard"); notify(`${created.name} created; unavailable setup steps were skipped`);
        } catch (error) { notify(apiErrorMessage(error)); }
      }}/>}</AnimatePresence>
      <AnimatePresence>{deleteConfirmation && <DeleteAgentConfirmation agent={deleteConfirmation.agent} deleting={deletingAgent} cancel={() => { if (!deletingAgent) setDeleteConfirmation(null); }} confirm={confirmDeleteAgent}/>}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><span><Check size={15} /></span>{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="page-heading mb-6 flex min-h-[67px] items-start justify-between gap-6"><div>{eyebrow && <span className="eyebrow mb-1 block text-[9px] font-bold tracking-[.1em] text-brand uppercase">{eyebrow}</span>}<h1 className="font-display text-[25px] leading-8 font-bold tracking-[-.75px]">{title}</h1><p className="mt-1 text-xs leading-5 text-app-muted">{description}</p></div>{children && <div className="heading-actions flex gap-2 pt-1">{children}</div>}</div>;
}

function Dashboard({ agents, organization, data }: { agents: Agent[]; organization: Organization; data: DashboardBackendData }) {
  const activeAgents = agents.filter((agent) => agent.status === "Live").length;
  const draftAgents = agents.filter((agent) => agent.status === "Draft").length;
  const totalDocuments = data.processing.completed + data.processing.processing + data.processing.failed;
  const activityIcon = (kind: DashboardBackendData["activity"][number]["kind"]) => kind === "document" ? <FileText size={17}/> : kind === "widget" ? <Code2 size={17}/> : <Bot size={17}/>;
  return <>
    <PageHeading eyebrow="Organization" title={organization.name} description="Current configuration and processing status for this organization." />
    <div className="backend-summary-grid">
      <section className="panel backend-summary-card agents-summary"><div className="backend-card-head"><span><Bot size={20}/></span><div><h2>FAQ Agents</h2><p>Agents owned by {organization.name}</p></div></div><strong className="backend-total">{agents.length}</strong><span className="backend-total-label">Total agents</span><div className="backend-inline-stats"><span><i className="active"/><b>{activeAgents}</b> Active</span><span><i className="draft"/><b>{draftAgents}</b> Draft</span></div></section>
      <section className="panel backend-summary-card documents-summary"><div className="backend-card-head"><span><Files size={20}/></span><div><h2>Knowledge Documents</h2><p>Uploaded to FAQ agents</p></div></div><strong className="backend-total">{totalDocuments}</strong><span className="backend-total-label">Total documents</span><div className="backend-card-foot"><CheckCircle2 size={14}/>{data.processing.completed} ready for retrieval</div></section>
      <section className="panel backend-summary-card processing-summary"><div className="backend-card-head"><span><RotateCcw size={20}/></span><div><h2>Document Processing</h2><p>Current pipeline state</p></div></div><div className="processing-counts"><div><span className="processing-dot completed"><Check size={15}/></span><strong>{data.processing.completed}</strong><small>Completed</small></div><div><span className="processing-dot running"><RotateCcw size={15}/></span><strong>{data.processing.processing}</strong><small>Processing</small></div><div><span className="processing-dot failed"><AlertCircle size={15}/></span><strong>{data.processing.failed}</strong><small>Failed</small></div></div><div className="processing-bar">{totalDocuments > 0 && <><i className="completed" style={{width: `${data.processing.completed / totalDocuments * 100}%`}}/><i className="running" style={{width: `${data.processing.processing / totalDocuments * 100}%`}}/><i className="failed" style={{width: `${data.processing.failed / totalDocuments * 100}%`}}/></>}</div></section>
      <section className="panel backend-summary-card orchestrator-summary"><div className="backend-card-head"><span><Network size={20}/></span><div><h2>AI Orchestrator</h2><p>Organization routing configuration</p></div></div><div className="configuration-state"><span className={data.orchestratorConfigured ? "configured" : "unconfigured"}><i/>{data.orchestratorConfigured ? "Active" : "Not configured"}</span></div><div className="backend-detail-row"><span>Registered agents</span><b>{agents.length}</b></div></section>
      <section className="panel backend-summary-card widget-summary"><div className="backend-card-head"><span><MessagesSquare size={20}/></span><div><h2>Widgets</h2><p>Saved widget configurations</p></div></div><div className="widget-config-rows"><div><span><Globe2 size={16}/>Organization Widget</span><b className={data.organizationWidgetConfigured ? "configured" : "unconfigured"}>{data.organizationWidgetConfigured ? "Configured" : "Not configured"}</b></div><div><span><Bot size={16}/>FAQ Agent Widgets</span><b>{data.faqAgentWidgets}</b></div></div></section>
    </div>
    <section className="panel backend-activity-panel"><div className="panel-title"><div><h2>Recent Activity</h2><p>Changes recorded for {organization.name}</p></div><span className="activity-count">{data.activity.length} events</span></div>{data.activity.length ? <div className="backend-activity-list">{data.activity.map((event) => <div key={event.id}><span className={`activity-kind ${event.kind}`}>{activityIcon(event.kind)}</span><div><b>{event.label}</b><small>{event.context}</small></div><time>{event.time}</time></div>)}</div> : <div className="backend-activity-empty"><Activity size={20}/><span>No organization activity yet.</span></div>}</section>
  </>;
}

function AgentsPage({ agents, organizationId, search, setSearch, ssrPage, ssrQuery, create, openAgent, duplicateAgent, deleteAgent, notify }: { agents: Agent[]; organizationId: string; search: string; setSearch: (value: string) => void; ssrPage?: PaginatedResult<AgentDto>; ssrQuery?: InitialAppData["faqQuery"]; create: () => void; openAgent: (agent: Agent, tab?: AgentTab) => void; duplicateAgent: (agent: Agent) => void; deleteAgent: (agent: Agent) => void; notify: (s: string) => void }) {
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

  const mockMatches = useMemo(() => agents.filter((agent) => `${agent.name} ${agent.description}`.toLowerCase().includes(search.trim().toLowerCase())), [agents, search]);
  const useLocalPage = useMockData || !ssrPage;
  const visibleAgents = useLocalPage
    ? mockMatches.slice((page - 1) * pageSize, page * pageSize)
    : ssrPage.items.map(mapAgent);
  const totalItems = useLocalPage ? mockMatches.length : ssrPage.totalItems;
  const totalPages = useLocalPage ? Math.ceil(totalItems / pageSize) : ssrPage.totalPages;
  const firstVisible = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, totalItems);
  const firstPageButton = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));
  const pageButtons = Array.from({ length: Math.min(5, totalPages) }, (_, index) => firstPageButton + index);
  const selectAgent = (agent: Agent) => { openAgent(agent); notify(`${agent.name} opened`); };
  const showAgentShimmer = !useMockData && isPending;
  const goToPage = (nextPage: number) => {
    if (!ssrQuery) {
      setLocalPage(nextPage);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("agent_page", String(nextPage));
    params.set("view", "agents");
    startTransition(() => router.replace(`${window.location.pathname}?${params}`, { scroll: false }));
  };

  return <>
    <PageHeading eyebrow="Knowledge team" title="FAQ Agents" description="Build specialized AI agents grounded in your company knowledge.">
      <button className="secondary-button"><SlidersHorizontal size={16} /> Filters</button><button className="primary-button" onClick={create}><Plus size={17} /> Create agent</button>
    </PageHeading>
    <div className="agent-page-summary"><div><WandSparkles size={20}/><span><strong>Give every question an expert</strong><small>Each agent owns its knowledge, instructions, playground, and widget.</small></span></div>{agents[0] && <button onClick={() => openAgent(agents[0], "playground")}>Try an agent <ArrowRight size={14}/></button>}</div>
    <div className="agents-toolbar"><label><Search size={16}/><input aria-label="Search FAQ agents" placeholder="Search agents" value={search} onChange={(event) => setSearch(event.target.value)}/>{search && <button aria-label="Clear agent search" className="clear-agent-search" onClick={() => setSearch("")}><X size={14}/></button>}</label><span aria-live="polite">{isPending && !useMockData ? "Searching…" : `${totalItems} ${totalItems === 1 ? "agent" : "agents"}`}</span><div className="view-toggle" aria-label="Agent layout"><button aria-label="Grid view" aria-pressed={layout === "grid"} className={layout === "grid" ? "selected" : ""} onClick={() => setLayout("grid")}><LayoutDashboard size={15}/></button><button aria-label="List view" aria-pressed={layout === "list"} className={layout === "list" ? "selected" : ""} onClick={() => setLayout("list")}><Menu size={15}/></button></div></div>
    <div className={`agents-grid ${layout === "list" ? "list-view" : ""}`} aria-busy={isPending && !useMockData}>
      {showAgentShimmer && Array.from({ length: layout === "grid" ? 6 : 4 }, (_, index) => <article className="agent-card agent-card-shimmer" key={index} aria-hidden="true"><div className="agent-card-top"><span className="shimmer-block shimmer-avatar"/><i className="shimmer-block shimmer-status"/><i className="shimmer-block shimmer-menu"/></div><h2 className="shimmer-block"/><p><span className="shimmer-block"/><span className="shimmer-block short"/></p><div className="agent-meta"><span className="shimmer-block"/><span className="shimmer-block"/></div></article>)}
      {!showAgentShimmer && visibleAgents.map((agent) => <article className={`agent-card ${actionAgentId === agent.id ? "actions-open" : ""}`} key={agent.id} role="button" tabIndex={0} aria-label={`Open ${agent.name}`} onClick={() => selectAgent(agent)} onKeyDown={(event) => { if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return; event.preventDefault(); selectAgent(agent); }}>
        <div className="agent-card-top"><AgentAvatar agent={agent} large/><Status status={agent.status}/><button className="icon-button small" aria-label={`Actions for ${agent.name}`} aria-haspopup="menu" aria-expanded={actionAgentId === agent.id} aria-controls={`agent-actions-${agent.id}`} onClick={(event) => { event.stopPropagation(); setActionAgentId((current) => current === agent.id ? null : agent.id); }}><MoreHorizontal size={17}/></button>{actionAgentId === agent.id && <div className="agent-actions-menu" id={`agent-actions-${agent.id}`} role="menu" aria-label={`Actions for ${agent.name}`} onClick={(event) => event.stopPropagation()}><button role="menuitem" autoFocus onClick={() => { setActionAgentId(null); openAgent(agent, "overview"); }}><Pencil size={15}/><span><b>Edit agent</b><small>Update details and settings</small></span></button><button role="menuitem" onClick={() => { setActionAgentId(null); openAgent(agent, "knowledge"); }}><FileText size={15}/><span><b>Knowledge sources</b><small>Manage connected documents</small></span></button><button role="menuitem" onClick={() => { setActionAgentId(null); openAgent(agent, "playground"); }}><Play size={15}/><span><b>Test in playground</b><small>Try a question directly</small></span></button><div className="agent-actions-divider"/><button role="menuitem" onClick={() => { setActionAgentId(null); duplicateAgent(agent); }}><Copy size={15}/><span><b>Duplicate agent</b><small>Create an editable draft copy</small></span></button><button className="danger" role="menuitem" onClick={() => { setActionAgentId(null); deleteAgent(agent); }}><Trash2 size={15}/><span><b>Delete agent</b><small>Permanently remove this agent</small></span></button></div>}</div>
        <h2>{agent.name}</h2><p>{agent.description}</p>
        <div className="agent-meta"><span><FileText size={15}/>{agent.docs} sources</span><span><Pencil size={15}/>Updated {agent.updated}</span></div>
      </article>)}
      {!showAgentShimmer && visibleAgents.length > 0 && page === 1 && !search && <button className="new-agent-card" onClick={create}><span><Plus size={22}/></span><strong>Create a new agent</strong><small>Train an expert on a new topic</small></button>}
    </div>
    {visibleAgents.length === 0 && !isPending && <div className="agents-empty"><Search size={22}/><h2>No agents found</h2><p>{search ? `No FAQ agents match “${search}”.` : "Create your first FAQ agent to get started."}</p>{search ? <button className="secondary-button" onClick={() => setSearch("")}>Clear search</button> : <button className="primary-button" onClick={create}><Plus size={16}/> Create agent</button>}</div>}
    {!showAgentShimmer && totalPages > 1 && <nav className="agents-pagination" aria-label="FAQ agent pages"><span>Showing {firstVisible}–{lastVisible} of {totalItems}</span><div><button aria-label="Previous page" disabled={page === 1} onClick={() => goToPage(Math.max(1, page - 1))}><ChevronLeft size={16}/></button>{pageButtons.map((pageNumber) => <button key={pageNumber} aria-label={`Page ${pageNumber}`} aria-current={pageNumber === page ? "page" : undefined} className={pageNumber === page ? "active" : ""} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)}<button aria-label="Next page" disabled={page === totalPages} onClick={() => goToPage(Math.min(totalPages, page + 1))}><ChevronRight size={16}/></button></div></nav>}
  </>;
}

function OrganizationPage({ tab, setTab, organization, agents, notify, updateOrganization }: { tab: OrganizationTab; setTab: (tab: OrganizationTab) => void; organization: Organization; agents: Agent[]; notify: (s: string) => void; updateOrganization: (updates: Partial<Organization>) => void }) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(organization.name);
  const [draftDescription, setDraftDescription] = useState(organization.description);
  useEffect(() => { setDraftName(organization.name); setDraftDescription(organization.description); setEditing(false); }, [organization.id, organization.name, organization.description]);
  const labels: { key: OrganizationTab; label: string; icon: typeof Bot; future?: boolean }[] = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "branding", label: "Branding", icon: WandSparkles },
    { key: "members", label: "Members", icon: UserRound, future: true },
    { key: "api", label: "API Keys", icon: Code2, future: true },
    { key: "danger", label: "Danger zone", icon: AlertCircle },
  ];
  return <>
    <PageHeading eyebrow="Organization overview" title={organization.name} description="Manage your organization identity, branding, access, and lifecycle."><button className={editing ? "secondary-button" : "primary-button"} onClick={() => setEditing((value) => !value)}>{editing ? <X size={15}/> : <Pencil size={15}/>} {editing ? "Cancel editing" : "Edit organization"}</button></PageHeading>
    <div className="context-tabs organization-tabs flex items-center gap-1 overflow-x-auto border-b border-app-border">{labels.map(({ key, label, icon: Icon, future }) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={15}/>{label}{future && <em>Soon</em>}</button>)}</div>
    {tab === "overview" && <div className="organization-general-grid grid grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)] items-start gap-4 max-[900px]:grid-cols-1"><section className={`panel organization-form border-app-border bg-app-surface p-6 ${editing ? "editing" : ""}`}><div className="panel-title"><div><h2>Organization profile</h2><p>{editing ? "Update the organization information below." : "Core information used throughout QueryDesk."}</p></div>{editing && <button className="primary-button" onClick={() => { updateOrganization({ name: draftName.trim() || organization.name, description: draftDescription }); setEditing(false); }}><Save size={15}/> Save changes</button>}</div><label className="field"><span>Organization name</span><input value={draftName} disabled={!editing} onChange={(event) => setDraftName(event.target.value)}/></label><label className="field"><span>Description</span><textarea rows={4} value={draftDescription} disabled={!editing} onChange={(event) => setDraftDescription(event.target.value)}/></label>{!editing && <div className="edit-hint"><Pencil size={14}/>Click “Edit organization” to change these details.</div>}</section><aside className="panel organization-summary border-app-border bg-app-surface p-5"><div className="panel-title"><div><h2>Organization summary</h2><p>Current organization status.</p></div></div><div className="organization-facts"><span><small>Organization type</small><b>{organization.category}</b></span><span><small>Active agents</small><b>{agents.filter((agent) => agent.status === "Live").length}</b></span><span><small>Documents</small><b>{agents.reduce((total, agent) => total + agent.docs, 0)}</b></span><span><small>Persistence</small><b>Backend managed</b></span></div></aside></div>}
    {tab === "branding" && <section className="panel organization-form"><div className="panel-title"><div><h2>Branding</h2><p>Customize how this organization appears to your team and customers.</p></div><button className="primary-button" onClick={() => notify("Organization branding saved")}><Save size={15}/> Save branding</button></div><div className="logo-editor"><span>{organization.initials}</span><div><b>Organization logo</b><small>PNG, JPG, or SVG. Max 2 MB.</small><button onClick={() => notify("Logo picker opened in demo mode")}>Upload logo</button></div></div><div className="two-fields"><label className="field"><span>Primary brand color</span><input type="color" defaultValue="#6c5ce7"/></label><label className="field"><span>Public display name</span><input defaultValue={organization.name}/></label></div></section>}
    {(tab === "members" || tab === "api") && <section className="panel future-panel"><span>{tab === "members" ? <UserRound size={25}/> : <Code2 size={25}/>}</span><h2>{tab === "members" ? "Members are coming soon" : "API keys are coming soon"}</h2><p>{tab === "members" ? "Invite teammates and control organization access in a future release." : "Create and manage organization API keys in a future release."}</p></section>}
    {tab === "danger" && <section className="panel danger-panel"><div><span><AlertCircle size={19}/></span><div><h2>Delete organization</h2><p>Permanently delete {organization.name}, all FAQ agents, documents, conversations, and widgets. This cannot be undone.</p></div></div><button className="danger-button" onClick={() => notify("Delete organization requires confirmation")}>Delete organization</button></section>}
  </>;
}

function AgentDetailsPage({ agent, tab, setTab, notify, updateAgent, duplicateAgent, deleteAgent, onBack }: { agent: Agent; tab: AgentTab; setTab: (tab: AgentTab) => void; notify: (s: string) => void; updateAgent: (updates: Partial<Agent>) => void; duplicateAgent: () => void; deleteAgent: () => void; onBack: () => void }) {
  const tabs: { key: AgentTab; label: string }[] = [
    { key: "overview", label: "Overview" }, { key: "knowledge", label: "Knowledge" },
    { key: "ai", label: "AI Configuration" }, { key: "retrieval", label: "Retrieval" },
    { key: "prompt", label: "Prompt" }, { key: "playground", label: "Playground" }, { key: "widget", label: "Widget" },
  ];
  const [prompt, setPrompt] = useState("You are a friendly and accurate customer support specialist for Acme. Answer using only the supplied knowledge. If the answer is unavailable, say so clearly and offer to connect the user with a human.");
  const [draftName, setDraftName] = useState(agent.name);
  const [draftDescription, setDraftDescription] = useState(agent.description);
  useEffect(() => { setDraftName(agent.name); setDraftDescription(agent.description); }, [agent.id, agent.name, agent.description]);
  return <>
    <div className="agent-detail-header mb-2.5 flex min-h-[92px] items-center justify-between gap-5 max-[680px]:flex-col max-[680px]:items-start">
      <div className="agent-detail-title"><AgentAvatar agent={agent} large/><div><span><button onClick={onBack}>FAQ Agents</button><ChevronRight size={12}/>{agent.name}</span><h1>{agent.name}</h1><p>{agent.description}</p></div></div>
      <div className="agent-detail-actions"><Status status={agent.status}/><label className="switch labeled-switch"><input type="checkbox" checked={agent.status === "Live"} onChange={(event) => updateAgent({ status: event.target.checked ? "Live" : "Draft" })}/><i/><span>{agent.status === "Live" ? "Enabled" : "Disabled"}</span></label><button className="icon-button"><MoreHorizontal size={18}/></button></div>
    </div>
    <div className="context-tabs agent-tabs flex items-center gap-1 overflow-x-auto border-b border-app-border">{tabs.map(({ key, label }) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}{key === "knowledge" && <em>{agent.docs}</em>}</button>)}</div>
    {tab === "overview" && <div className="agent-settings-layout grid grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)] items-start gap-4 max-[900px]:grid-cols-1"><section className="panel agent-form-panel border-app-border bg-app-surface p-5"><div className="panel-title"><div><h2>Agent overview</h2><p>Give this agent a clear identity and responsibility.</p></div></div><label className="field"><span>Agent name</span><input value={draftName} onChange={(event) => setDraftName(event.target.value)}/></label><label className="field"><span>Description</span><textarea rows={4} value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)}/></label><div className="form-actions mt-5 flex justify-end border-t border-app-border pt-4"><button className="primary-button" onClick={() => updateAgent({ name: draftName.trim() || agent.name, description: draftDescription })}><Save size={15}/> Save changes</button></div></section><aside className="panel agent-side-panel border-app-border bg-app-surface p-5"><div className="panel-title"><div><h2>Agent summary</h2><p>Backend-owned configuration details.</p></div></div><div className="agent-summary-list"><span><FileText size={16}/><div><small>Knowledge sources</small><b>{agent.docs} documents</b></div></span><span><CheckCircle2 size={16}/><div><small>Status</small><b>{agent.status === "Live" ? "Active" : "Draft"}</b></div></span><span><Pencil size={16}/><div><small>Last updated</small><b>{agent.updated}</b></div></span></div><div className="form-divider"/><button className="secondary-button full-button" onClick={duplicateAgent}><Copy size={15}/> Duplicate agent</button><button className="danger-button" onClick={deleteAgent}><Trash2 size={15}/> Delete agent</button></aside></div>}
    {tab === "knowledge" && <KnowledgePage search="" notify={notify} embedded agentName={agent.name}/>} 
    {tab === "ai" && <AgentAIConfiguration notify={notify}/>} 
    {tab === "retrieval" && <AgentRetrieval notify={notify}/>} 
    {tab === "prompt" && <section className="panel prompt-panel"><div className="panel-title"><div><h2>System prompt</h2><p>Set the role, boundaries, and response style for {agent.name}.</p></div><button className="secondary-button" onClick={() => setPrompt("You are a helpful FAQ agent. Answer only from the provided knowledge.")}><RotateCcw size={14}/> Reset default</button></div><label className="field"><span>Instructions</span><textarea rows={13} value={prompt} onChange={(event) => setPrompt(event.target.value)}/><small>{prompt.length} / 4,000 characters</small></label><div className="prompt-guidance"><Sparkles size={17}/><div><b>Prompt guidance</b><p>Describe the agent's role, tone, limitations, and what it should do when the knowledge does not contain an answer.</p></div></div><div className="form-actions"><button className="primary-button" onClick={() => notify("System prompt saved")}><Save size={15}/> Save prompt</button></div></section>}
    {tab === "playground" && <PlaygroundPage notify={notify} embedded agentName={agent.name}/>} 
    {tab === "widget" && <WidgetsPage notify={notify} embedded agentMode agentName={agent.name}/>} 
  </>;
}

function AgentAIConfiguration({ notify }: { notify: (s: string) => void }) {
  const [temperature, setTemperature] = useState(.3);
  return <div className="config-page-grid"><section className="panel config-panel"><div className="panel-title"><div><h2>AI configuration</h2><p>Choose how the model generates responses.</p></div></div><label className="field"><span>Model</span><button className="select-field config-select"><span className="mini-agent"><Sparkles size={14}/></span><span><b>GPT-4.1 mini</b><small>Fast, capable, and cost effective</small></span><ChevronDown size={15}/></button></label><div className="range-field"><div><span>Temperature</span><b>{temperature.toFixed(1)}</b></div><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))}/><div className="range-labels"><span>Precise</span><span>Creative</span></div><p>Lower values keep answers consistent and grounded in your knowledge.</p></div><label className="field"><span>Maximum response tokens</span><input type="number" defaultValue="800" min="100" max="4000"/><small>Recommended: 500–1,000 tokens for concise support answers.</small></label><div className="form-actions"><button className="primary-button" onClick={() => notify("AI configuration saved")}><Save size={15}/> Save configuration</button></div></section><aside className="panel recommendations-panel"><Zap size={20}/><h3>Recommended for FAQ agents</h3><p>This setup balances answer quality, speed, and cost for most customer-facing knowledge agents.</p><ul><li><Check size={13}/> Fast response generation</li><li><Check size={13}/> Reliable instruction following</li><li><Check size={13}/> Low answer variance</li></ul></aside></div>;
}

function AgentRetrieval({ notify }: { notify: (s: string) => void }) {
  return <section className="panel retrieval-panel"><div className="panel-title"><div><h2>Retrieval configuration</h2><p>Control how knowledge is split, selected, and supplied to the model.</p></div><button className="secondary-button" onClick={() => notify("Recommended retrieval defaults restored")}><RotateCcw size={14}/> Use recommended</button></div><div className="retrieval-grid"><ConfigNumber label="Chunk size" value="800" suffix="tokens" description="Maximum size of each indexed knowledge segment."/><ConfigNumber label="Chunk overlap" value="120" suffix="tokens" description="Context repeated between adjacent chunks."/><ConfigNumber label="Similarity threshold" value="0.72" suffix="score" description="Minimum relevance required to use a chunk."/><ConfigNumber label="Top K" value="5" suffix="chunks" description="Maximum matching chunks sent to the model."/></div><div className="retrieval-preview"><div><span><Database size={17}/></span><div><b>How retrieval works</b><p>A question is compared with this agent's indexed documents. Only the most relevant chunks above your threshold are included in the answer context.</p></div></div><div className="retrieval-flow"><span>Question</span><ArrowRight size={14}/><span>Search {`{${5}}`} chunks</span><ArrowRight size={14}/><span>Generate answer</span></div></div><div className="form-actions"><button className="primary-button" onClick={() => notify("Retrieval configuration saved")}><Save size={15}/> Save configuration</button></div></section>;
}

function ConfigNumber({ label, value, suffix, description }: { label: string; value: string; suffix: string; description: string }) {
  return <label className="config-number"><span>{label}</span><div><input type="number" defaultValue={value}/><em>{suffix}</em></div><small>{description}</small></label>;
}

function KnowledgePage({ search, notify, embedded = false, agentName }: { search: string; notify: (s: string) => void; embedded?: boolean; agentName?: string }) {
  const [dragging, setDragging] = useState(false);
  const filtered = documents.filter((d) => (!agentName || d.agent === agentName) && `${d.name} ${d.agent}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    {!embedded && <PageHeading title="Knowledge sources" description="Manage the content your agents use to answer questions.">
      <button className="secondary-button"><Globe2 size={16}/> Connect website</button><button className="primary-button" onClick={() => notify("File browser opened in demo mode")}><Upload size={16}/> Upload files</button>
    </PageHeading>}
    {embedded && <div className="section-intro"><div><h2>Knowledge</h2><p>Upload and manage the documents owned by {agentName}.</p></div><button className="primary-button" onClick={() => notify("File browser opened in demo mode")}><Upload size={16}/> Upload files</button></div>}
    <button className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); notify("Document uploaded and processing started"); }} onClick={() => notify("File browser opened in demo mode")}>
      <span className="upload-orbit"><FileUp size={24}/></span><div><strong>Drop files here or click to upload</strong><small>PDF, TXT, or Markdown · up to 25 MB each</small></div><span className="browse-button">Browse files</span>
    </button>
    <section className="panel table-panel">
      <div className="table-toolbar"><div><h2>{embedded ? `${agentName} documents` : "All sources"}</h2><span>{filtered.length} of {embedded ? filtered.length : 44}</span></div><label><Search size={16}/><input placeholder="Search sources..." defaultValue={search}/></label>{!embedded && <button className="select-button">All agents <ChevronDown size={14}/></button>}</div>
      <div className="data-table">
        <div className="table-head"><span>Name</span><span>{embedded ? "File type" : "Agent"}</span><span>Chunks</span><span>Uploaded</span><span>Status</span><span/></div>
        {filtered.map((doc) => <div className="table-row" key={doc.name}>
          <span className="file-name"><i><FileText size={17}/></i><b>{doc.name}<small>{doc.size}</small></b></span><span>{embedded ? doc.name.split(".").pop()?.toUpperCase() : doc.agent}</span><span>{doc.chunks}</span><span>{doc.date}</span>
          <span>{doc.status === "Ready" ? <em className="ready"><Check size={11}/> Ready</em> : <em className="processing"><RotateCcw size={11}/> Processing</em>}</span><button className="icon-button small"><MoreHorizontal size={16}/></button>
        </div>)}
      </div>
    </section>
  </>;
}

function OrchestratorPage({ agents, organizationName, configured, notify, onSave }: { agents: Agent[]; organizationName: string; configured: boolean; notify: (s: string) => void; onSave: () => void }) {
  const [section, setSection] = useState<"overview" | "configuration" | "test">("overview");
  const [welcome, setWelcome] = useState("Hi! How can I help you today?");
  const [prompt, setPrompt] = useState("Route each question to the enabled FAQ agent whose name and description best match the user's intent. If no agent is suitable, explain that the organization does not have an agent for that topic.");
  const [registeredIds, setRegisteredIds] = useState<string[]>(agents.filter((agent) => agent.status === "Live").map((agent) => agent.id));
  const registeredAgents = agents.filter((agent) => registeredIds.includes(agent.id) && agent.status === "Live");
  const toggleAgent = (id: string) => setRegisteredIds((current) => current.includes(id) ? current.filter((agentId) => agentId !== id) : [...current, id]);
  return <div className="orchestrator-page">
    <PageHeading eyebrow="Organization routing" title="AI Orchestrator" description="Configure one entry point that routes requests to the appropriate FAQ agent.">
      {section === "configuration" && <button className="primary-button" onClick={() => { onSave(); notify("Orchestrator configuration saved"); }}><Save size={16}/> Save changes</button>}
      {section !== "test" && <button className="secondary-button" onClick={() => setSection("test")}><Play size={16}/> Test routing</button>}
    </PageHeading>
    <div className="context-tabs orchestrator-tabs"><button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard size={15}/>Overview</button><button className={section === "configuration" ? "active" : ""} onClick={() => setSection("configuration")}><Settings size={15}/>Configuration</button><button className={section === "test" ? "active" : ""} onClick={() => setSection("test")}><Play size={15}/>Test routing</button></div>
    {section === "overview" && <>
      <div className="ownership-note"><Network size={16}/><p><b>The orchestrator only routes requests.</b> It owns no documents, embeddings, or retrieval index. The selected FAQ agent searches its own knowledge and creates the response.</p></div>
      <div className="orchestrator-overview-grid"><section className="panel orchestrator-flow-panel"><div className="panel-title"><div><h2>Request flow</h2><p>How an organization-level question is handled.</p></div><span className="configuration-state"><span className={configured ? "configured" : "unconfigured"}><i/>{configured ? "Active" : "Not configured"}</span></span></div><div className="orchestrator-flow"><div><span className="flow-icon user"><UserRound size={19}/></span><b>{organizationName} request</b><small>Question enters from the organization widget or playground</small></div><ArrowRight size={18}/><div><span className="flow-icon router"><Network size={19}/></span><b>AI Orchestrator</b><small>Compares intent with the enabled agent registry</small></div><ArrowRight size={18}/><div><span className="flow-icon agent"><Bot size={19}/></span><b>Selected FAQ Agent</b><small>Searches its own documents and returns a response</small></div></div></section>
      <aside className="panel orchestrator-status-panel"><div className="panel-title"><div><h2>Current configuration</h2><p>Backend-owned orchestrator state.</p></div></div><div className="orchestrator-status-list"><span><small>Status</small><b className={configured ? "active-value" : ""}>{configured && <i/>}{configured ? "Active" : "Not configured"}</b></span><span><small>Registered agents</small><b>{registeredAgents.length}</b></span><span><small>Available FAQ agents</small><b>{agents.filter((agent) => agent.status === "Live").length}</b></span><span><small>Welcome message</small><b>{welcome ? "Configured" : "Missing"}</b></span><span><small>System prompt</small><b>{prompt ? "Configured" : "Missing"}</b></span></div><button className="secondary-button full-button" onClick={() => setSection("configuration")}><Pencil size={15}/> {configured ? "Edit configuration" : "Configure orchestrator"}</button></aside></div>
      <section className="panel registered-overview"><div className="panel-title"><div><h2>Registered FAQ Agents</h2><p>Only enabled and registered agents can receive routed requests.</p></div><button className="text-button" onClick={() => setSection("configuration")}>Manage registry <ArrowRight size={14}/></button></div><div className="registered-agent-grid">{registeredAgents.map((agent) => <div key={agent.id}><AgentAvatar agent={agent}/><span><b>{agent.name}</b><small>{agent.description}</small></span><CheckCircle2 size={16}/></div>)}{registeredAgents.length === 0 && <div className="registry-empty"><AlertCircle size={17}/>No agents are currently registered for routing.</div>}</div></section>
    </>}
    {section === "configuration" && <div className="orchestrator-config-grid"><section className="panel form-panel"><div className="panel-title"><div><h2>Messages and instructions</h2><p>Configure the organization-level welcome and routing rules.</p></div></div><label className="field"><span>Welcome message</span><textarea value={welcome} onChange={(event) => setWelcome(event.target.value)} rows={3}/><small>Displayed before the visitor sends their first question.</small></label><label className="field"><span>System prompt</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={8}/><small>{prompt.length} / 2,000 characters</small></label><div className="prompt-guardrail"><ShieldCheck size={17}/><p>Use this prompt only for routing behavior. Answer instructions and knowledge boundaries belong in each FAQ agent's prompt.</p></div></section><section className="panel registry-panel"><div className="panel-title"><div><h2>Agent registry</h2><p>{registeredAgents.length} of {agents.length} agents registered</p></div></div><div className="registry-explainer"><Database size={15}/><span>Register agents by responsibility. The orchestrator uses each agent's name and description when choosing a route.</span></div>{agents.map((agent) => <div className="registry-row" key={agent.id}><AgentAvatar agent={agent}/><span><strong>{agent.name}</strong><small>{agent.description}</small></span><Status status={agent.status}/><label className="switch"><input type="checkbox" checked={registeredIds.includes(agent.id)} disabled={agent.status !== "Live"} onChange={() => toggleAgent(agent.id)}/><i/></label></div>)}</section></div>}
    {section === "test" && <OrchestratorTestFlow agents={registeredAgents} welcome={welcome} notify={notify} />}
  </div>;
}

function OrchestratorTestFlow({ agents, welcome, notify }: { agents: Agent[]; welcome: string; notify: (message: string) => void }) {
  type TestTurn = { id: number; question: string; agent?: Agent; answer: string; routeReason: string };
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<TestTurn[]>([]);
  const [routing, setRouting] = useState(false);
  const routeQuestion = (question: string) => {
    const lower = question.toLowerCase();
    const preferences = lower.match(/invoice|billing|price|pricing|plan|subscription/) ? ["billing", "sales"] : lower.match(/employee|benefit|leave|policy|handbook/) ? ["employee"] : lower.match(/api|developer|sdk|key|integration/) ? ["developer"] : lower.match(/buy|purchase|sales|capabilit/) ? ["sales"] : ["customer", "support"];
    return agents.find((agent) => preferences.some((term) => `${agent.name} ${agent.description}`.toLowerCase().includes(term)));
  };
  const submit = () => { const question = input.trim(); if (!question || routing) return; setRouting(true); setInput(""); window.setTimeout(() => { const agent = routeQuestion(question); setTurns((current) => [...current, { id: Date.now(), question, agent, answer: agent ? `${agent.name} received this test request. In production, it would search its ${agent.docs} connected knowledge documents and generate the answer.` : "No enabled FAQ agent is registered for this topic.", routeReason: agent ? `The question matched the configured purpose of ${agent.name}.` : "The registry has no enabled agent available for routing." }]); setRouting(false); }, 550); };
  const latest = turns[turns.length - 1];
  return <div className="orchestrator-test-layout"><section className="panel routing-chat"><div className="routing-chat-head"><span><Network size={18}/></span><div><b>Organization routing test</b><small>Tests are not saved as production conversations.</small></div><button className="secondary-button" onClick={() => setTurns([])}><RotateCcw size={14}/>New test</button></div><div className="routing-chat-body">{turns.length === 0 && <div className="routing-welcome"><span><Sparkles size={22}/></span><h2>{welcome || "How can I help?"}</h2><p>Ask a question to see which registered FAQ agent receives it.</p><div><button onClick={() => setInput("Where can I find my invoices?")}>Where can I find my invoices?</button><button onClick={() => setInput("How do I reset my API key?")}>How do I reset my API key?</button><button onClick={() => setInput("What is the leave policy?")}>What is the leave policy?</button></div></div>}{turns.map((turn) => <div className="routing-turn" key={turn.id}><div className="route-question"><p>{turn.question}</p><span className="tiny-avatar">OS</span></div><div className="route-answer"><span className="bot-avatar"><Bot size={15}/></span><div><div className="routed-by"><Network size={13}/>Routed to <b>{turn.agent?.name || "No agent"}</b></div><p>{turn.answer}</p></div></div></div>)}{routing && <div className="routing-indicator"><span/><span/><span/>Orchestrator is selecting an agent</div>}</div><div className="routing-composer"><textarea rows={2} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }} placeholder="Ask an organization-level question..."/><button onClick={submit} disabled={!input.trim() || routing}><Send size={17}/></button></div></section><aside className="panel route-inspector"><div className="panel-title"><div><h2>Routing trace</h2><p>Visible only while testing.</p></div></div>{latest ? <><div className="trace-agent"><AgentAvatar agent={latest.agent || { id: "none", name: "No agent", description: "", docs: 0, updated: "", status: "Draft", color: "orange", initials: "—", organizationId: "none", version: 0 }}/><div><small>Selected FAQ Agent</small><b>{latest.agent?.name || "No route available"}</b></div></div><div className="trace-steps"><div className="complete"><span><Check size={13}/></span><p><b>Request received</b><small>Organization playground</small></p></div><div className="complete"><span><Check size={13}/></span><p><b>Registry evaluated</b><small>{agents.length} enabled agents considered</small></p></div><div className={latest.agent ? "complete" : "failed"}><span>{latest.agent ? <Check size={13}/> : <X size={13}/>}</span><p><b>{latest.agent ? "Agent selected" : "No route found"}</b><small>{latest.routeReason}</small></p></div><div className={latest.agent ? "complete" : "pending"}><span>{latest.agent ? <Check size={13}/> : "4"}</span><p><b>Agent invoked</b><small>{latest.agent ? "Direct agent mode" : "Not invoked"}</small></p></div></div><button className="secondary-button full-button" onClick={() => { navigator.clipboard?.writeText(latest.routeReason); notify("Routing reason copied"); }}><Copy size={14}/>Copy routing reason</button></> : <div className="trace-empty"><Network size={24}/><p>Send a test question to inspect the routing path.</p></div>}</aside></div>;
}

function PlaygroundPage({ notify, embedded = false, organizationMode = false, agentName = "Customer Support" }: { notify: (s: string) => void; embedded?: boolean; organizationMode?: boolean; agentName?: string }) {
  const [mode, setMode] = useState<"Organization" | "FAQ Agent">(organizationMode ? "Organization" : "FAQ Agent");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ role: "user", text: "What is your refund policy for annual plans?" }, { role: "assistant", text: "Annual plans are eligible for a full refund within 30 days of purchase. After that window, your plan remains active until the end of the billing period, but we can’t issue a prorated refund." }]);
  const send = () => { if (!message.trim()) return; setMessages((m) => [...m, { role: "user", text: message }, { role: "assistant", text: "Thanks for your question. Based on the connected knowledge, I’ve found the relevant information and can help you with that." }]); setMessage(""); };
  return <>
    {!embedded && <PageHeading eyebrow="Safe testing space" title="AI Playground" description="Try questions, inspect routing, and refine answers before you publish.">
      <button className="secondary-button" onClick={() => { setMessages([]); notify("New conversation started"); }}><RotateCcw size={15}/> New chat</button>
    </PageHeading>}
    {embedded && <div className="section-intro"><div><h2>{organizationMode ? "Orchestrator playground" : `${agentName} playground`}</h2><p>{organizationMode ? "Test organization-wide routing and inspect the selected agent." : "Test this agent directly against its own knowledge."}</p></div><button className="secondary-button" onClick={() => { setMessages([]); notify("New conversation started"); }}><RotateCcw size={15}/> New chat</button></div>}
    <div className="playground-layout">
      <aside className="playground-settings panel">
        <div className="panel-title"><div><h2>Test settings</h2><p>Choose how to route this chat.</p></div></div>
        {!embedded && <><label className="field"><span>Playground mode</span></label><div className="segmented"><button onClick={() => setMode("Organization")} className={mode === "Organization" ? "selected" : ""}><Network size={15}/> Organization</button><button onClick={() => setMode("FAQ Agent")} className={mode === "FAQ Agent" ? "selected" : ""}><Bot size={15}/> Direct agent</button></div></>}
        <label className="field"><span>{mode === "Organization" ? "Orchestrator" : "Current agent"}</span><button className="select-field"><span className="mini-agent"><Sparkles size={14}/></span>{mode === "Organization" ? "Acme Orchestrator" : agentName}{!embedded && <ChevronDown size={15}/>}</button></label>
        <div className="info-card"><Zap size={16}/><div><b>Test details</b><p>The selected agent and retrieved sources are visible after each test response.</p></div></div>
        <div className="settings-footer"><span><i/> Knowledge ready</span><small>Available for testing</small></div>
      </aside>
      <section className="chat-panel panel">
        <div className="chat-header"><div className="chat-agent"><span><Sparkles size={18}/></span><div><b>{mode === "Organization" ? "Acme Assistant" : agentName}</b><small><i/> Online · {mode === "Organization" ? "Orchestrator" : "Direct agent"} mode</small></div></div><button className="icon-button small"><MoreHorizontal size={17}/></button></div>
        <div className="messages">
          <div className="chat-date"><span>Today</span></div>
          {messages.length === 0 && <div className="empty-chat"><span><MessagesSquare size={26}/></span><h3>Start a new conversation</h3><p>Ask a question your customers might ask.</p></div>}
          {messages.map((item, index) => item.role === "user" ? <div className="message user-message" key={index}><div>{item.text}</div><span className="tiny-avatar">OS</span></div> : <div className="message assistant-message" key={index}><span className="bot-avatar"><Sparkles size={15}/></span><div className="answer-wrap"><div className="answer-bubble"><p>{item.text}</p><p>Would you like me to explain how to request one?</p></div><div className="answer-meta"><span><Bot size={12}/> Answered by <b>Customer Support</b></span><button onClick={() => notify("Response copied")}><Copy size={12}/></button><button><RotateCcw size={12}/></button></div><button className="routing-details"><ChevronRight size={13}/> View routing & sources</button></div></div>)}
        </div>
        <div className="composer"><div className="suggestions"><button onClick={() => setMessage("How do I upgrade my plan?")}>How do I upgrade my plan?</button><button onClick={() => setMessage("Where can I find my invoices?")}>Where are my invoices?</button></div><div className="composer-box"><textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask your agent a question..." rows={2}/><div><button className="attach-button"><Plus size={17}/></button><span>Enter to send</span><button className="send-button" onClick={send}><Send size={17}/></button></div></div><small>AI can make mistakes. Verify important information.</small></div>
      </section>
    </div>
  </>;
}

function WidgetsPage({ notify, embedded = false, agentMode = false, agentName = "Customer Support" }: { notify: (s: string) => void; embedded?: boolean; agentMode?: boolean; agentName?: string }) {
  const [widgetType, setWidgetType] = useState<"Organization" | "Agent">(agentMode ? "Agent" : "Organization");
  const [open, setOpen] = useState(true);
  const snippet = agentMode ? '<script src="https://cdn.querydesk.ai/widget.js" data-agent="agent_cs_8f21"></script>' : '<script src="https://cdn.querydesk.ai/widget.js" data-organization="acme_92a7"></script>';
  return <>
    {!embedded && <PageHeading eyebrow="Publish with confidence" title="Widget deployment" description="Customize your assistant, preview it live, then add it to any website.">
      <button className="primary-button" onClick={() => notify("Widget configuration published")}><Globe2 size={16}/> Publish changes</button>
    </PageHeading>}
    {embedded && <div className="section-intro"><div><h2>{agentMode ? `${agentName} widget` : "Organization widget"}</h2><p>{agentMode ? `Deploy a widget that sends every question directly to ${agentName}.` : "Deploy your public assistant and route questions through the AI Orchestrator."}</p></div><button className="primary-button" onClick={() => notify("Widget configuration published")}><Globe2 size={16}/> Publish changes</button></div>}
    <div className="widget-layout">
      <section className="panel widget-config"><div className="panel-title"><div><h2>Configure widget</h2><p>Changes appear in the preview instantly.</p></div></div>{!embedded && <><label className="field"><span>Widget type</span></label><div className="widget-type-grid"><button className={widgetType === "Organization" ? "selected" : ""} onClick={() => setWidgetType("Organization")}><Network size={20}/><b>Organization</b><small>Route to the best agent</small><CheckCircle2 size={17}/></button><button className={widgetType === "Agent" ? "selected" : ""} onClick={() => setWidgetType("Agent")}><Bot size={20}/><b>Direct agent</b><small>Use one specific agent</small><CheckCircle2 size={17}/></button></div><div className="form-divider"/></>}
        <label className="field"><span>Assistant name</span><input defaultValue={agentMode ? agentName : "Acme Assistant"}/></label><label className="field"><span>Welcome message</span><textarea rows={3} defaultValue="Hi there! 👋 How can we help today?"/></label><div className="field"><span>Brand color</span><div className="color-options"><button className="selected" style={{background:"#6d5dfc"}}/><button style={{background:"#2563eb"}}/><button style={{background:"#0f9f73"}}/><button style={{background:"#e45858"}}/><button style={{background:"#171923"}}/></div></div>
      </section>
      <section className="panel preview-panel"><div className="preview-toolbar"><div><h2>Live preview</h2><span>Desktop</span></div><div><button>Desktop</button><button>Mobile</button></div></div><div className="browser-frame"><div className="browser-bar"><i/><i/><i/><span>yourwebsite.com</span></div><div className="fake-site"><header><b>ACME</b><span>Product&nbsp;&nbsp;&nbsp; Solutions&nbsp;&nbsp;&nbsp; Pricing</span><button>Get started</button></header><main><span>AI-POWERED SUPPORT</span><h3>Support that never<br/>keeps you waiting.</h3><p>Give your customers instant, accurate answers—day or night.</p><button>Start free trial</button></main>{open ? <div className="widget-chat"><div className="widget-chat-head"><span><Sparkles size={16}/></span><div><b>{agentMode ? agentName : "Acme Assistant"}</b><small><i/> Online</small></div><button onClick={() => setOpen(false)}><X size={15}/></button></div><div className="widget-chat-body"><div className="widget-bubble">Hi there! 👋 How can we help today?</div><div className="widget-time">Just now</div><div className="widget-suggestions"><button>Track my order</button><button>View pricing</button></div></div><div className="widget-input"><span>Type a message...</span><Send size={15}/></div></div> : <button className="widget-launcher" onClick={() => setOpen(true)}><MessagesSquare size={22}/><i/></button>}</div></div></section>
    </div>
    <section className="panel install-panel"><div className="panel-title"><div><h2>Install on your website</h2><p>Paste this snippet before the closing &lt;/body&gt; tag.</p></div><span className="secure-badge"><CheckCircle2 size={13}/> Ready to install</span></div><div className="code-block"><code>{snippet}</code><button onClick={() => { navigator.clipboard?.writeText(snippet); notify("Embed code copied"); }}><Clipboard size={15}/> Copy code</button></div></section>
  </>;
}

function SettingsPage({ notify }: { notify: (s: string) => void }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  return <>
    <PageHeading title="Settings" description="Personalize how QueryDesk looks and behaves for you."><button className="primary-button" onClick={() => notify("Application settings saved")}><Save size={16}/> Save preferences</button></PageHeading>
    <div className="settings-page-layout"><aside className="settings-nav panel"><button className="active"><Settings size={16}/> Overview</button><button><LayoutDashboard size={16}/> Appearance</button><button><HelpCircle size={16}/> About</button></aside><section className="panel organization-form"><div className="panel-title"><div><h2>Preference overview</h2><p>These settings apply only to your account.</p></div></div><div className="settings-group"><div className="settings-group-title"><Moon size={17}/><div><b>Theme</b><small>Choose how QueryDesk appears on this device.</small></div></div><div className="theme-cards"><button className={theme === "light" ? "selected" : ""} onClick={() => dispatch(setTheme("light"))}><Sun size={19}/><span>Light</span><CheckCircle2 size={15}/></button><button className={theme === "dark" ? "selected" : ""} onClick={() => dispatch(setTheme("dark"))}><Moon size={19}/><span>Dark</span><CheckCircle2 size={15}/></button><button onClick={() => notify("System theme will be available in the next settings update")}><Settings size={19}/><span>System</span><CheckCircle2 size={15}/></button></div></div><div className="form-divider"/><label className="preference-row"><span><b>Compact sidebar</b><small>Use a narrower navigation when working on large screens.</small></span><span className="switch"><input type="checkbox"/><i/></span></label><label className="preference-row"><span><b>Comfortable density</b><small>Use more spacing in lists, tables, and forms.</small></span><span className="switch"><input type="checkbox" defaultChecked/><i/></span></label><div className="form-divider"/><div className="about-row"><span><b>QueryDesk AI</b><small>Version 1.0.0 · July 2026</small></span><button className="secondary-button" onClick={() => notify("Documentation is coming soon")}>Documentation <ArrowUpRight size={14}/></button></div></section></div>
  </>;
}

function CreateOrganizationWizard({ close, complete }: { close: () => void; complete: (organization: Omit<Organization, "id" | "version">, agent: { name: string; description: string; documentAdded: boolean }) => Promise<void> }) {
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
  return <motion.div className="organization-wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <aside className="wizard-sidebar"><button className="brand wizard-brand"><span className="brand-mark"><Sparkles size={19}/></span><span>QueryDesk <b>AI</b></span></button><div className="wizard-progress">{steps.map(({ icon: Icon, label }, index) => { const number = index + 1; return <div key={label} className={`${step === number ? "active" : ""} ${step > number ? "complete" : ""}`}><span>{step > number ? <Check size={16}/> : <Icon size={16}/>}</span><div><small>Step {number}</small><b>{label}</b></div></div>; })}</div><div className="wizard-help"><HelpCircle size={16}/><p>Need help?<br/><button>View setup guide</button></p></div></aside>
    <main className="wizard-main"><header><span>Creating a new organization</span><button className="icon-button" onClick={close}><X size={18}/></button></header><div className="wizard-content"><AnimatePresence mode="wait"><motion.div key={step} className="wizard-step" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .18 }}>
      {step === 1 && <><div className="wizard-step-icon"><Building2 size={24}/></div><h1>Create organization</h1><p>Start with the basics. You can update these details later.</p><label className="field"><span>Organization name</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Acme Inc."/></label><label className="field"><span>Description</span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does your organization do?"/></label><div className="field"><span>Logo</span><button className="logo-upload" onClick={() => setLogoAdded(true)}><Upload size={17}/>{logoAdded ? "Logo selected" : "Upload logo"}<small>PNG, JPG, or SVG · 2 MB max</small></button></div></>}
      {step === 2 && <><div className="wizard-step-icon"><Network size={24}/></div><h1>Set up your AI Orchestrator</h1><p>This is the front door that routes questions to the right FAQ agent.</p><label className="field"><span>Welcome message</span><textarea rows={3} value={welcome} onChange={(event) => setWelcome(event.target.value)}/></label><label className="field"><span>System prompt</span><textarea rows={6} value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)}/><small>{systemPrompt.length} / 2,000 characters</small></label><div className="ownership-note"><Network size={16}/><p>The orchestrator routes questions. Knowledge and retrieval stay with individual FAQ agents.</p></div></>}
      {step === 3 && <><div className="wizard-step-icon"><Bot size={24}/></div><h1>Create your first FAQ agent</h1><p>Give your organization its first specialist. Add more agents anytime.</p><label className="field"><span>Agent name</span><input value={agentName} onChange={(event) => setAgentName(event.target.value)} placeholder="Customer Support"/></label><label className="field"><span>Description</span><textarea rows={4} value={agentDescription} onChange={(event) => setAgentDescription(event.target.value)} placeholder="Handles customer support questions."/></label><div className="agent-template-preview"><span className="agent-avatar violet">{agentName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "AI"}</span><div><b>{agentName || "Your first agent"}</b><small>{agentDescription || "Describe this agent's responsibility."}</small></div><Status status="Draft"/></div></>}
      {step === 4 && <><div className="wizard-step-icon"><FileUp size={24}/></div><h1>Upload knowledge</h1><p>Add the first document this agent will use to answer questions.</p><button className={`wizard-drop-zone ${documentAdded ? "uploaded" : ""}`} onClick={() => setDocumentAdded(true)}><span>{documentAdded ? <CheckCircle2 size={25}/> : <FileUp size={25}/>}</span><b>{documentAdded ? "Product_guide.pdf is ready" : "Drag a PDF here"}</b><small>{documentAdded ? "2.4 MB · Ready to process" : "or click to browse files"}</small>{!documentAdded && <em>Browse files</em>}</button><div className="supported-files"><span>Supported formats</span><div><b>PDF</b><b>TXT</b><b>Markdown</b></div></div></>}
      {step === 5 && <div className="wizard-ready"><span><Check size={34}/></span><h1>Your organization is ready 🎉</h1><p>Everything is configured. You can start testing and adding more knowledge.</p><div className="ready-summary"><div><Building2 size={18}/><span><small>Organization</small><b>{name || "New organization"}</b></span><CheckCircle2 size={17}/></div><div><Network size={18}/><span><small>AI Orchestrator</small><b>Configured</b></span><CheckCircle2 size={17}/></div><div><Bot size={18}/><span><small>First FAQ agent</small><b>{agentName}</b></span><CheckCircle2 size={17}/></div><div><FileText size={18}/><span><small>Knowledge</small><b>{documentAdded ? "1 document added" : "Ready to upload later"}</b></span><CheckCircle2 size={17}/></div></div></div>}
      <div className="wizard-actions">{step > 1 && step < 5 && <button className="secondary-button" onClick={() => setStep((current) => current - 1)}>Back</button>}<span/><button className="primary-button" disabled={saving || (step === 1 && !name.trim())} onClick={async () => { if (step < 5) { next(); return; } setSaving(true); await complete({ name: name || "New organization", description: description || "A new QueryDesk organization.", category: "Organization", initials: (name || "N").charAt(0).toUpperCase(), color: "violet" }, { name: agentName, description: agentDescription, documentAdded }); setSaving(false); }}>{saving ? "Creating…" : step === 5 ? "Go to dashboard" : step === 4 ? "Continue" : step === 3 ? "Create agent" : "Continue"}<ArrowRight size={16}/></button></div>
    </motion.div></AnimatePresence></div></main>
  </motion.div>;
}

function CreateAgentModal({ close, add }: { close: () => void; add: (values: AgentForm) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AgentForm>({ resolver: zodResolver(agentSchema), defaultValues: { name: "", description: "" } });
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && close()}><motion.form className="modal" onSubmit={handleSubmit(add)} initial={{ opacity: 0, scale: .96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .97, y: 10 }}>
    <div className="modal-head"><span><Sparkles size={20}/></span><div><h2>Create an FAQ agent</h2><p>Give your new expert a clear purpose.</p></div><button type="button" className="icon-button" onClick={close}><X size={18}/></button></div>
    <div className="modal-body"><label className={`field ${errors.name ? "has-error" : ""}`}><span>Agent name</span><input autoFocus placeholder="e.g. Product specialist" {...register("name")}/>{errors.name && <small>{errors.name.message}</small>}</label><label className={`field ${errors.description ? "has-error" : ""}`}><span>Description</span><textarea rows={4} placeholder="What questions should this agent answer?" {...register("description")}/>{errors.description && <small>{errors.description.message}</small>}</label><div className="modal-tip"><Zap size={16}/><p><b>You can configure everything later.</b><br/>After creation, add knowledge sources and tune the agent’s behavior.</p></div></div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button className="primary-button" disabled={isSubmitting}><Sparkles size={16}/> Create agent</button></div>
  </motion.form></motion.div>;
}

function DeleteAgentConfirmation({ agent, deleting, cancel, confirm }: { agent: Agent; deleting: boolean; cancel: () => void; confirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && !deleting) cancel(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [cancel, deleting]);

  return <motion.div className="confirmation-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) cancel(); }}>
    <motion.section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-agent-title" aria-describedby="delete-agent-description" initial={{ opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95, y: 10 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
      <div className="confirmation-grabber" aria-hidden="true"/>
      <span className="confirmation-icon"><Trash2 size={25}/></span>
      <h2 id="delete-agent-title">Delete this agent?</h2>
      <p id="delete-agent-description">This will permanently remove the agent and its saved configuration from your organization.</p>
      <div className="confirmation-agent"><AgentAvatar agent={agent}/><span><small>FAQ Agent</small><b>{agent.name}</b></span><Status status={agent.status}/></div>
      <div className="confirmation-actions"><button className="confirmation-cancel" autoFocus disabled={deleting} onClick={cancel}>Cancel</button><button className="confirmation-delete" disabled={deleting} onClick={confirm}>{deleting ? <><i className="confirmation-spinner"/>Deleting…</> : <><Trash2 size={15}/>Delete agent</>}</button></div>
      <small className="confirmation-warning">This action can’t be undone.</small>
    </motion.section>
  </motion.div>;
}

function AgentAvatar({ agent, large = false }: { agent: Agent; large?: boolean }) { return <span className={`agent-avatar ${agent.color} ${large ? "large" : ""}`}>{agent.initials}</span>; }
function Status({ status }: { status: Agent["status"] }) { return <span className={`status ${status.toLowerCase()}`}><i/>{status}</span>; }
