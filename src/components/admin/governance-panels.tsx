"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpenCheck, Building2, Check, Info, KeyRound, Search, ShieldCheck, Users } from "lucide-react";
import { assignAdminRolesAction } from "@/app/actions";
import type { AdminAccessDto, AdminPermissionDto } from "@/lib/api";

export function AccessGovernancePanel({ data, refresh }: { data: AdminAccessDto; refresh: (message: string) => Promise<void> }) {
  const [userId, setUserId] = useState(data.users[0]?.id ?? "");
  const [organizationId, setOrganizationId] = useState(data.organizations[0]?.id ?? "");
  const [scope, setScope] = useState<"ORGANIZATION" | "PLATFORM">("ORGANIZATION");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const roles = useMemo(() => data.roles.filter((role) => role.scope === scope), [data.roles, scope]);
  useEffect(() => {
    if (scope === "PLATFORM") {
      setRoleIds(data.platform_assignments?.find((item) => item.user_id === userId)?.role_ids ?? []);
      return;
    }
    const assignment = data.assignments.find((item) => item.user_id === userId && item.organization_id === organizationId);
    setRoleIds(assignment?.active ? assignment.role_ids : []);
  }, [data.assignments, data.platform_assignments, organizationId, scope, userId]);
  const submit = async (event: FormEvent) => { event.preventDefault(); await assignAdminRolesAction({ userId, organizationId: scope === "ORGANIZATION" ? organizationId : undefined, roleIds }); await refresh(scope === "ORGANIZATION" ? "Organization access updated" : "Platform roles updated"); };
  return <div className="governance-access-layout"><form className="governance-panel governance-assignment" onSubmit={submit}><header><span><ShieldCheck size={22}/></span><div><h2>Assign governed access</h2><p>Connect one user to the correct scope and role.</p></div></header><div className="governance-scope-guide"><div><b>Platform scope</b><p>Global SaaS capabilities, such as creating organizations, managing access-control roles, and reading audits.</p></div><div><b>Organization scope</b><p>Capabilities limited to one organization. A user may have different roles in every organization.</p></div></div><div className="governance-assignment-fields"><label>User<select value={userId} onChange={(event) => setUserId(event.target.value)}>{data.users.map((user) => <option key={user.id} value={user.id}>{user.full_name} · {user.email}</option>)}</select></label><label>Access scope<select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="ORGANIZATION">Organization</option><option value="PLATFORM">Platform</option></select></label>{scope === "ORGANIZATION" && <label>Organization<select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>{data.organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label>}</div><fieldset><legend>Available {scope.toLowerCase()} roles</legend>{roles.map((role) => <label key={role.id} className={roleIds.includes(role.id) ? "selected" : ""}><input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => setRoleIds((current) => current.includes(role.id) ? current.filter((id) => id !== role.id) : [...current, role.id])}/><span><b>{role.name}</b><small>{role.permissions.length} permissions</small></span>{roleIds.includes(role.id) && <Check size={17}/>}</label>)}{roles.length === 0 && <p>No roles exist for this scope.</p>}</fieldset><p className="governance-revoke-hint">Existing assignments are loaded automatically. Save with no roles selected to remove this access.</p><button className="governance-primary" disabled={!userId || (scope === "ORGANIZATION" && !organizationId)}><Check/>Save access assignment</button></form>
    <section className="governance-panel governance-mapping-list"><header><div><h2>Active organization mappings</h2><p>Current governed relationships across the platform.</p></div><span>{data.assignments.filter((item) => item.active).length} active</span></header>{data.assignments.length ? <div>{data.assignments.map((assignment) => { const user = data.users.find((item) => item.id === assignment.user_id); const organization = data.organizations.find((item) => item.id === assignment.organization_id); const assignedRoles = assignment.role_ids.map((id) => data.roles.find((role) => role.id === id)?.name).filter(Boolean); return <article key={assignment.membership_id}><span><Users size={18}/></span><div><b>{user?.full_name ?? "Unknown user"}</b><small>{user?.email}</small></div><span><Building2 size={15}/>{organization?.name ?? "Unknown organization"}</span><div>{assignedRoles.length ? assignedRoles.map((role) => <em key={role}>{role}</em>) : <small>No roles assigned</small>}</div><i className={assignment.active ? "active" : "inactive"}>{assignment.active ? "Active" : "Inactive"}</i></article>; })}</div> : <div className="governance-empty-state"><Building2 size={25}/><b>No access mappings yet</b><p>Assign an organization role to begin governing tenant access.</p></div>}</section></div>;
}

export function PermissionCatalogPanel({ data }: { data: AdminAccessDto }) {
  const [scope, setScope] = useState<"ALL" | AdminPermissionDto["scope"]>("ALL");
  const [search, setSearch] = useState("");
  const permissions = data.permissions.filter((permission) => (scope === "ALL" || permission.scope === scope) && `${permission.code} ${permission.description} ${permission.resource}`.toLowerCase().includes(search.toLowerCase()));
  const groups = Array.from(new Set(permissions.map((permission) => permission.resource))).sort();
  return <section className="governance-panel governance-catalog">
    <header><div><span><BookOpenCheck size={22}/></span><div><h2>Permissions by entity</h2><p>Open an entity to understand its capabilities and the roles that contain each permission.</p></div></div><div><label><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search permissions"/></label><select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="ALL">All scopes</option><option value="PLATFORM">Platform</option><option value="ORGANIZATION">Organization</option></select></div></header>
    <div className="governance-scope-guide catalog"><div><b>Platform</b><p>Global capabilities across the SaaS.</p></div><div><b>Organization</b><p>Capabilities inside one assigned organization.</p></div></div>
    <div className="governance-catalog-legend"><span><i className="level-0"/>Level 0 · Standard</span><span><i className="level-1"/>Level 1 · Management</span><span><i className="level-2"/>Level 2 · Sensitive</span></div>
    <div className="governance-entity-groups">{groups.map((resource) => <section key={resource}><header><div><ShieldCheck size={18}/><span><h3>{resource}</h3><p>{permissions.filter((permission) => permission.resource === resource).length} available capabilities</p></span></div></header><div className="governance-catalog-grid">{permissions.filter((permission) => permission.resource === resource).map((permission) => <PermissionCard key={permission.code} permission={permission} data={data}/>)}</div></section>)}</div>
    {permissions.length === 0 && <div className="governance-empty-state"><Search size={24}/><b>No permissions found</b><p>Try a different search term or scope.</p></div>}
  </section>;
}

function PermissionCard({ permission, data }: { permission: AdminPermissionDto; data: AdminAccessDto }) {
  const usedBy = data.roles.filter((role) => role.permissions.includes(permission.code));
  return <article><header><span className={`governance-level level-${permission.permission_level}`}>L{permission.permission_level}</span><span className="governance-permission-scope"><em>{permission.scope}</em><button type="button" aria-label={`About ${permission.code}`}><Info size={15}/><span role="tooltip"><b>{permission.description}</b><small>{permission.scope === "PLATFORM" ? "Available across the SaaS when included in a platform role." : "Effective only in the organization where its role is assigned."}</small><code>{permission.code}</code></span></button></span></header><h3>{permission.description}</h3><code>{permission.code}</code><div className="governance-attached-roles"><small>Included in roles</small>{usedBy.length ? <div>{usedBy.map((role) => <span key={role.id} title={role.description || role.name}><KeyRound size={12}/>{role.name}</span>)}</div> : <p>Not included in any role</p>}</div></article>;
}
