"use client";

import { useState } from "react";
import { ArrowUpRight, BookOpenCheck, ChevronRight, KeyRound, LayoutDashboard, LogOut, Menu, Moon, MoreHorizontal, Settings, ShieldCheck, Sparkles, Sun, Users, X } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";
import type { CurrentUserDto } from "@/lib/api";
import { setTheme, useAppDispatch } from "@/store";
import { adminViewTitles, type AdminView } from "./types";

const primaryNavigation: Array<{ view: AdminView; label: string; icon: typeof Users }> = [
  { view: "overview", label: "Overview", icon: LayoutDashboard },
  { view: "users", label: "Users", icon: Users },
  { view: "roles", label: "Roles", icon: KeyRound },
  { view: "governance", label: "Access governance", icon: ShieldCheck },
  { view: "catalog", label: "Permission catalog", icon: BookOpenCheck },
];

type SidebarProps = { open: boolean; view: AdminView; currentUser: CurrentUserDto; changeView: (view: AdminView) => void; close: () => void };

export function AdminSidebar({ open, view, currentUser, changeView, close }: SidebarProps) {
  return <>
    {open && <button className="governance-scrim" aria-label="Close navigation" onClick={close}/>} 
    <aside className={`governance-sidebar ${open ? "open" : ""}`}>
      <header className="governance-brand"><span><ShieldCheck size={21}/></span><div><b>Arffy</b><small>Governance Console</small></div><button aria-label="Close navigation" onClick={close}><X size={19}/></button></header>
      <div className="governance-scope"><small>Administration scope</small><strong>Identity & access</strong><span><i/>Protected workspace</span></div>
      <nav><p>Governance</p>{primaryNavigation.map(({ view: itemView, label, icon: Icon }) => <button key={itemView} className={view === itemView ? "active" : ""} onClick={() => changeView(itemView)}><Icon size={19}/><span>{label}</span>{view === itemView && <ChevronRight size={16}/>}</button>)}<p className="governance-nav-space">Personal</p><button className={view === "settings" ? "active" : ""} onClick={() => changeView("settings")}><Settings size={19}/><span>Settings & access</span>{view === "settings" && <ChevronRight size={16}/>}</button></nav>
      <footer>{Object.keys(currentUser.organization_permissions).length > 0 && <a className="governance-product-switch" href="/workspace"><Sparkles size={18}/><span><b>Open Product</b><small>{Object.keys(currentUser.organization_permissions).length} organization access</small></span><ArrowUpRight size={16}/></a>}<button className="governance-user" onClick={() => changeView("settings")}><span>{initials(currentUser.full_name)}</span><span><b>{currentUser.full_name}</b><small>Super administrator</small></span><MoreHorizontal size={18}/></button><form action={logoutAction}><button><LogOut size={17}/>Log out</button></form></footer>
    </aside>
  </>;
}

export function AdminTopbar({ view, theme, currentUser, openNavigation }: { view: AdminView; theme: "light" | "dark"; currentUser: CurrentUserDto; openNavigation: () => void }) {
  const dispatch = useAppDispatch();
  const [accountOpen, setAccountOpen] = useState(false);
  return <header className="governance-topbar"><div><button className="governance-mobile-menu" onClick={openNavigation}><Menu size={21}/></button><span>Governance Console</span><ChevronRight size={15}/><strong>{adminViewTitles[view]}</strong></div><div><span className="governance-environment"><i/>Secure administration</span><button className="governance-icon-button" aria-label="Change theme" onClick={() => dispatch(setTheme(theme === "light" ? "dark" : "light"))}>{theme === "light" ? <Moon size={19}/> : <Sun size={19}/>}</button><button className="governance-top-avatar" aria-expanded={accountOpen} onClick={() => setAccountOpen((current) => !current)}>{initials(currentUser.full_name)}</button>{accountOpen && <div className="governance-account-popover"><b>{currentUser.full_name}</b><small>{currentUser.email}</small><span><ShieldCheck size={15}/>Super administrator</span><form action={logoutAction}><button><LogOut size={16}/>Log out</button></form></div>}</div></header>;
}

export function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U"; }
