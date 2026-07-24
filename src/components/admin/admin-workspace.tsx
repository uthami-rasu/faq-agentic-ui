"use client";

import { Activity, BookOpenCheck, Building2, CheckCircle2, KeyRound, ShieldCheck, UserCheck, Users } from "lucide-react";
import type { AdminAccessDto, AuditEventDto, CurrentUserDto } from "@/lib/api";
import { AccessGovernancePanel, PermissionCatalogPanel } from "./governance-panels";
import { RolesPanel, UsersPanel } from "./management-panels";
import { AdminSettings } from "./admin-settings";
import type { AdminView } from "./types";
import { AuditPanel, ScopeHelpPanel } from "./support-panels";

type WorkspaceProps = {
  view: AdminView;
  data: AdminAccessDto;
  audit: AuditEventDto[];
  currentUser: CurrentUserDto;
  changeView: (view: AdminView) => void;
  refresh: (message: string) => Promise<void>;
};

const headings: Record<AdminView, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Platform governance", title: "Governance overview", description: "A clear view of identities, roles, and access across the platform." },
  users: { eyebrow: "Identity management", title: "Users", description: "Register people, control account status, and maintain secure access." },
  roles: { eyebrow: "Role-based access", title: "Roles", description: "Create reusable access policies from explicit, scoped permissions." },
  governance: { eyebrow: "Access governance", title: "Organization access", description: "Control how users, roles, and organizations are connected." },
  catalog: { eyebrow: "Governance catalog", title: "Permission catalog", description: "Understand every capability available to platform and organization roles." },
  audit: { eyebrow: "Accountability", title: "Audit & activity", description: "A durable timeline of sign-ins and changes, including deleted entities." },
  help: { eyebrow: "Access model", title: "Platform and organization scopes", description: "Examples and guidance for designing understandable role-based access." },
  settings: { eyebrow: "Personal administration", title: "Settings & access", description: "Review your identity, effective access, and console appearance." },
};

export function AdminWorkspace({ view, data, audit, currentUser, changeView, refresh }: WorkspaceProps) {
  const heading = headings[view];
  return <section className="governance-workspace">
    <header className="governance-page-heading"><div><span>{heading.eyebrow}</span><h1>{heading.title}</h1><p>{heading.description}</p></div><span className="governance-role-chip"><ShieldCheck size={16}/>Super Admin</span></header>
    {view === "overview" && <Overview data={data} changeView={changeView}/>} 
    {view === "users" && <UsersPanel data={data} audit={audit} refresh={refresh}/>}
    {view === "roles" && <RolesPanel data={data} refresh={refresh}/>} 
    {view === "governance" && <AccessGovernancePanel data={data} refresh={refresh}/>} 
    {view === "catalog" && <PermissionCatalogPanel data={data}/>} 
    {view === "audit" && <AuditPanel data={data} audit={audit}/>}
    {view === "help" && <ScopeHelpPanel/>}
    {view === "settings" && <AdminSettings user={currentUser}/>} 
  </section>;
}

function Overview({ data, changeView }: { data: AdminAccessDto; changeView: (view: AdminView) => void }) {
  const activeUsers = data.users.filter((user) => user.active).length;
  const privilegedUsers = data.users.filter((user) => user.super_admin).length;
  const mappedUsers = new Set(data.assignments.filter((assignment) => assignment.active).map((assignment) => assignment.user_id)).size;
  const protectedRoles = data.roles.filter((role) => role.system_role).length;
  const coverage = data.users.length ? Math.round((mappedUsers / data.users.length) * 100) : 0;
  return <>
    <div className="governance-summary-grid">
      <Summary icon={<Users/>} value={data.users.length} label="Total users" detail={`${activeUsers} active accounts`}/>
      <Summary icon={<KeyRound/>} value={data.roles.length} label="Defined roles" detail={`${protectedRoles} protected roles`}/>
      <Summary icon={<Building2/>} value={data.organizations.length} label="Organizations" detail={`${data.assignments.length} access mappings`}/>
      <Summary icon={<BookOpenCheck/>} value={data.permissions.length} label="Permissions" detail={`${data.permissions.filter((item) => item.permission_level === 2).length} sensitive capabilities`}/>
    </div>
    <div className="governance-overview-grid">
      <article className="governance-panel governance-posture"><header><span><ShieldCheck size={21}/></span><div><h2>Access posture</h2><p>Current identity and governance coverage.</p></div></header><div className="governance-posture-score"><strong>{coverage}%</strong><span><b>User mapping coverage</b><small>{mappedUsers} of {data.users.length} users have active organization access.</small></span></div><div className="governance-posture-list"><span><CheckCircle2/><b>{activeUsers} active identities</b><small>Accounts able to authenticate</small></span><span><UserCheck/><b>{privilegedUsers} super administrators</b><small>Platform-wide governance access</small></span><span><Activity/><b>{data.assignments.length} governed relationships</b><small>User, role, and organization mappings</small></span></div></article>
      <article className="governance-panel governance-quick-actions"><header><h2>Governance tasks</h2><p>Continue with a focused administration workflow.</p></header><button onClick={() => changeView("users")}><span><Users size={20}/></span><span><b>Manage identities</b><small>Review roles across every organization</small></span></button><button onClick={() => changeView("governance")}><span><ShieldCheck size={20}/></span><span><b>Review access</b><small>Map users to organizations and roles</small></span></button><button onClick={() => changeView("audit")}><span><Activity size={20}/></span><span><b>Review audit history</b><small>Trace sign-ins and resource changes</small></span></button><button onClick={() => changeView("help")}><span><BookOpenCheck size={20}/></span><span><b>Understand scopes</b><small>See platform and organization examples</small></span></button></article>
    </div>
  </>;
}

function Summary({ icon, value, label, detail }: { icon: React.ReactNode; value: number; label: string; detail: string }) {
  return <article className="governance-summary-card"><span>{icon}</span><div><strong>{value}</strong><b>{label}</b><small>{detail}</small></div></article>;
}
