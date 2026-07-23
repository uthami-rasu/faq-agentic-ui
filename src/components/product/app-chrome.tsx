"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowUpRight, Bot, Check, ChevronDown, ChevronRight, Files, LayoutDashboard, LogOut, Menu, Moon, MoreHorizontal, Network, Pencil, Plus, Search, Settings, ShieldCheck, Sparkles, Sun, X } from "lucide-react";
import type { CurrentUserDto, NotificationDto } from "@/lib/api";
import { logoutAction } from "@/app/auth-actions";
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
  currentUser: CurrentUserDto;
  canCreateOrganization: boolean;
  organizationPermissions: string[];
};

export function AppSidebar(props: SidebarProps) {
  const dispatch = useAppDispatch();
  const { open, view, currentUser, organizationPermissions, canCreateOrganization, selectedOrganization, organizations, organizationAgents, selectedAgent, menuOpen, setMenuOpen, organizationSearch, setOrganizationSearch, setSelectedOrganizationId, setOrganizationTab, showOrganizationWizard, changeView, notify } = props;
  const [profileOpen, setProfileOpen] = useState(false);
  const can = (permission: string) => organizationPermissions.includes(permission);
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
        <div className="organization-menu-actions"><button onClick={() => { closeMenu(); setOrganizationTab("overview"); changeView("organization"); }}><span><Pencil size={15}/></span>View {selectedOrganization.name}</button>{canCreateOrganization && <button onClick={() => { closeMenu(); showOrganizationWizard(); }}><span><Plus size={15}/></span>Create organization</button>}</div>
      </motion.div>}</AnimatePresence>
      <nav className="sidebar-nav"><p className="nav-label">Navigation</p>{can("organization.read") && <button className={view === "dashboard" ? "active" : ""} onClick={() => changeView("dashboard")}><LayoutDashboard size={18}/><span>Dashboard</span></button>}{can("orchestrator.read") && <button className={view === "orchestrator" ? "active" : ""} onClick={() => changeView("orchestrator")}><Network size={18}/><span>AI Orchestrator</span></button>}{can("agent.read") && <button className={view === "agents" || view === "agent" ? "active" : ""} onClick={() => changeView("agents")}><Bot size={18}/><span>FAQ Agents</span><em>{organizationAgents.length}</em></button>}{can("agent.read") && view === "agent" && selectedAgent && <div className="sidebar-agent-context"><AgentAvatar agent={selectedAgent}/><span><small>Editing agent</small><strong>{selectedAgent.name}</strong></span></div>}{can("document.read") && <button className={view === "documents" ? "active" : ""} onClick={() => changeView("documents")}><Files size={18}/><span>Documents</span></button>}<p className="nav-label nav-label-space">Manage</p>{can("settings.read") && <button className={view === "settings" ? "active" : ""} onClick={() => changeView("settings")}><Settings size={18}/><span>Settings</span></button>}</nav>
      <div className="sidebar-bottom">{can("orchestrator.read") && <aside className="sidebar-product-card"><i className="product-orb product-orb-one"/><i className="product-orb product-orb-two"/><span className="sidebar-product-kicker"><Sparkles size={12}/>Arffy intelligence</span><strong>One assistant.<br/>Every FAQ agent.</strong><p>Let the AI Orchestrator route each question to the right knowledge.</p><button onClick={() => changeView("orchestrator")}>Explore Orchestrator <ArrowUpRight size={14}/></button></aside>}<div className="profile-control">{profileOpen && <div className="profile-menu"><header><span className="profile-avatar">{initials(currentUser.full_name)}</span><div><b>{currentUser.full_name}</b><small>{currentUser.email}</small></div></header><em><ShieldCheck size={13}/>{currentUser.super_admin ? "Super administrator" : `${Object.keys(currentUser.organization_permissions).length} organization access`}</em><button onClick={() => { setProfileOpen(false); changeView("settings"); }}><Settings size={16}/><span><b>Settings & access</b><small>Identity, permissions, and appearance</small></span></button>{currentUser.super_admin && <a href="/admin"><ShieldCheck size={16}/><span><b>Open Governance</b><small>Users, roles, and permissions</small></span></a>}<form action={logoutAction}><button><LogOut size={16}/><span><b>Log out</b><small>Revoke this secure session</small></span></button></form></div>}<button className="profile-row" aria-expanded={profileOpen} onClick={() => setProfileOpen((current) => !current)}><span className="profile-avatar">{initials(currentUser.full_name)}</span><span><strong>{currentUser.full_name}</strong><small>{currentUser.email}</small></span><MoreHorizontal size={17}/></button></div></div>
    </aside>
  </>;
}

type TopbarProps = { view: ViewKey; organization: Organization; search: string; setSearch: (search: string) => void; theme: "light" | "dark"; notifications: NotificationDto[]; notify: Notify; canCreateAgent: boolean; createAgent: () => void };

export function AppTopbar({ view, organization, search, setSearch, theme, notifications, notify, canCreateAgent, createAgent }: TopbarProps) {
  const dispatch = useAppDispatch();
  return <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => dispatch(setSidebarOpen(true))}><Menu size={20}/></button><div><span>{organization.name}</span><ChevronRight size={13}/><strong>{titleMap[view]}</strong></div></div><div className="topbar-actions"><label className="global-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search anything..."/><kbd>⌘ K</kbd></label><button className="icon-button" aria-label="Change theme" onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}>{theme === "light" ? <Moon size={18}/> : <Sun size={18}/>}</button><NotificationCenter initialNotifications={notifications} notify={notify}/>{canCreateAgent && <button className="primary-button top-create" onClick={createAgent}><Plus size={17}/> New agent</button>}</div></header>;
}

function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "U"; }
