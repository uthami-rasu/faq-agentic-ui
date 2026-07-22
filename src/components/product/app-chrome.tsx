"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, ChevronDown, ChevronRight, Files, LayoutDashboard, Menu, Moon, MoreHorizontal, Network, Pencil, Plus, Search, Settings, Sparkles, Sun, X } from "lucide-react";
import type { NotificationDto } from "@/lib/api";
import { setSidebarOpen, setTheme, useAppDispatch } from "@/store";
import type { ViewKey } from "@/store";
import type { Agent, Notify, Organization, OrganizationTab } from "./types";
import { titleMap } from "./types";
import { AgentAvatar } from "./shared";
import { NotificationCenter } from "./notification-center";

type SidebarProps = {
  open: boolean;
  view: ViewKey;
  selectedOrganization: Organization;
  organizations: Organization[];
  organizationAgents: Agent[];
  selectedAgent?: Agent;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  organizationSearch: string;
  setOrganizationSearch: (search: string) => void;
  setSelectedOrganizationId: (id: string) => void;
  setOrganizationTab: (tab: OrganizationTab) => void;
  showOrganizationWizard: () => void;
  changeView: (view: ViewKey) => void;
  notify: Notify;
};

export function AppSidebar(props: SidebarProps) {
  const dispatch = useAppDispatch();
  const { open, view, selectedOrganization, organizations, organizationAgents, selectedAgent, menuOpen, setMenuOpen, organizationSearch, setOrganizationSearch, setSelectedOrganizationId, setOrganizationTab, showOrganizationWizard, changeView, notify } = props;
  const matches = organizations.filter((organization) => `${organization.name} ${organization.category}`.toLowerCase().includes(organizationSearch.toLowerCase()));
  const closeMenu = () => { setMenuOpen(false); setOrganizationSearch(""); };

  return <>
    <AnimatePresence>{open && <motion.button aria-label="Close navigation" onClick={() => dispatch(setSidebarOpen(false))} className="sidebar-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/>}</AnimatePresence>
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand-row"><button className="brand" onClick={() => changeView("dashboard")}><span className="brand-mark"><Sparkles size={19} strokeWidth={2.5}/></span><span>Arffy <b>AI</b></span></button><button className="icon-button sidebar-close" onClick={() => dispatch(setSidebarOpen(false))}><X size={18}/></button></div>
      <button className="workspace-switcher" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span className="workspace-avatar">{selectedOrganization.initials}</span><span><small>Organization</small><strong>{selectedOrganization.name}</strong></span><ChevronDown size={15} className={menuOpen ? "org-chevron-open" : ""}/></button>
      <AnimatePresence>{menuOpen && <motion.div className="organization-menu" initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .98 }}>
        <div className="organization-menu-title"><span>Select organization</span><button onClick={closeMenu}><X size={14}/></button></div>
        <label className="organization-search"><Search size={15}/><input autoFocus value={organizationSearch} onChange={(event) => setOrganizationSearch(event.target.value)} placeholder="Search organizations..."/><kbd>{matches.length}</kbd></label>
        <div className="organization-options" role="listbox" aria-label="Organizations">{matches.map((organization) => <button role="option" aria-selected={organization.id === selectedOrganization.id} key={organization.id} className={organization.id === selectedOrganization.id ? "selected" : ""} onClick={() => { if (organization.id === selectedOrganization.id) { setOrganizationTab("overview"); changeView("organization"); } else { setSelectedOrganizationId(organization.id); changeView("dashboard"); notify(`Switched to ${organization.name}`); } closeMenu(); }}><span className={`organization-option-avatar ${organization.color}`}>{organization.initials}</span><span><strong>{organization.name}</strong><small>{organization.category}</small></span>{organization.id === selectedOrganization.id && <Check size={15}/>}</button>)}{matches.length === 0 && <div className="organization-no-results">No organizations found</div>}</div>
        <div className="organization-menu-actions"><button onClick={() => { closeMenu(); setOrganizationTab("overview"); changeView("organization"); }}><span><Pencil size={15}/></span>Edit {selectedOrganization.name}</button><button onClick={() => { closeMenu(); showOrganizationWizard(); }}><span><Plus size={15}/></span>Create organization</button></div>
      </motion.div>}</AnimatePresence>
      <nav className="sidebar-nav"><p className="nav-label">Navigation</p><button className={view === "dashboard" ? "active" : ""} onClick={() => changeView("dashboard")}><LayoutDashboard size={18}/><span>Dashboard</span></button><button className={view === "orchestrator" ? "active" : ""} onClick={() => changeView("orchestrator")}><Network size={18}/><span>AI Orchestrator</span></button><button className={view === "agents" || view === "agent" ? "active" : ""} onClick={() => changeView("agents")}><Bot size={18}/><span>FAQ Agents</span><em>{organizationAgents.length}</em></button>{view === "agent" && selectedAgent && <div className="sidebar-agent-context"><AgentAvatar agent={selectedAgent}/><span><small>Editing agent</small><strong>{selectedAgent.name}</strong></span></div>}<button className={view === "documents" ? "active" : ""} onClick={() => changeView("documents")}><Files size={18}/><span>Documents</span></button><p className="nav-label nav-label-space">Manage</p><button className={view === "settings" ? "active" : ""} onClick={() => changeView("settings")}><Settings size={18}/><span>Settings</span></button></nav>
      <div className="sidebar-bottom"><button className="profile-row"><span className="profile-avatar">OS</span><span><strong>Olivia Stone</strong><small>olivia@acme.com</small></span><MoreHorizontal size={17}/></button></div>
    </aside>
  </>;
}

type TopbarProps = { view: ViewKey; organization: Organization; search: string; setSearch: (search: string) => void; theme: "light" | "dark"; notifications: NotificationDto[]; notify: Notify; createAgent: () => void };

export function AppTopbar({ view, organization, search, setSearch, theme, notifications, notify, createAgent }: TopbarProps) {
  const dispatch = useAppDispatch();
  return <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => dispatch(setSidebarOpen(true))}><Menu size={20}/></button><div><span>{organization.name}</span><ChevronRight size={13}/><strong>{titleMap[view]}</strong></div></div><div className="topbar-actions"><label className="global-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="icon-button" aria-label="Change theme" onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}>{theme === "light" ? <Moon size={18}/> : <Sun size={18}/>}</button><NotificationCenter initialNotifications={notifications} notify={notify}/><button className="primary-button top-create" onClick={createAgent}><Plus size={17}/> New agent</button></div></header>;
}
