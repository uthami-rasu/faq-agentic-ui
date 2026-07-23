"use client";

import { Building2, CheckCircle2, KeyRound, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import type { CurrentUserDto } from "@/lib/api";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";
import { initials } from "./admin-chrome";

export function AdminSettings({ user }: { user: CurrentUserDto }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const organizationEntries = Object.entries(user.organization_permissions);
  return <div className="governance-settings-grid">
    <section className="governance-panel governance-identity"><div className="governance-identity-hero"><span>{initials(user.full_name)}</span><div><h2>{user.full_name}</h2><p>{user.email}</p><em><ShieldCheck size={15}/>Super administrator</em></div></div><div className="governance-detail-list"><span><UserRound/><span><small>Account status</small><b>{user.active ? "Active" : "Disabled"}</b></span><CheckCircle2/></span><span><Mail/><span><small>Login identity</small><b>{user.email}</b></span></span><span><KeyRound/><span><small>Administration scope</small><b>Platform-wide governance</b></span></span></div></section>
    <div className="governance-settings-stack"><section className="governance-panel governance-effective-access"><header><span><ShieldCheck size={21}/></span><div><h2>Your effective access</h2><p>The capabilities and organization mappings attached to your identity.</p></div></header><div className="governance-admin-access-note"><ShieldCheck size={20}/><span><b>Unrestricted governance access</b><p>As a Super Admin, you can manage users, roles, permissions, and organization mappings across the platform.</p></span></div>{user.platform_permissions.length > 0 && <AccessGroup title="Platform permissions" values={user.platform_permissions}/>}<h3>Organization access</h3>{organizationEntries.length ? <div className="governance-organization-access">{organizationEntries.map(([organizationId, permissions]) => <article key={organizationId}><Building2 size={19}/><div><b>{organizationId}</b><small>{permissions.length} effective permissions</small></div></article>)}</div> : <p className="governance-access-explanation">Super Admin governance access is platform-wide and does not require an organization membership.</p>}</section>
    <section className="governance-panel governance-appearance"><header><span><Moon size={21}/></span><div><h2>Appearance</h2><p>Choose how this governance console looks on this device.</p></div></header><div><button className={theme === "light" ? "selected" : ""} onClick={() => dispatch(setTheme("light"))}><Sun/><span><b>Light</b><small>Bright violet governance workspace</small></span>{theme === "light" && <CheckCircle2/>}</button><button className={theme === "dark" ? "selected" : ""} onClick={() => dispatch(setTheme("dark"))}><Moon/><span><b>Dark</b><small>Midnight slate with blue accents</small></span>{theme === "dark" && <CheckCircle2/>}</button></div></section></div>
  </div>;
}

function AccessGroup({ title, values }: { title: string; values: string[] }) { return <div className="governance-access-group"><h3>{title}</h3><div>{values.map((value) => <span key={value}>{value}</span>)}</div></div>; }
