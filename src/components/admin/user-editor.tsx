"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Activity, Building2, Check, KeyRound, LoaderCircle, ShieldCheck, UserRound, X } from "lucide-react";
import { assignAdminRolesAction, updateAdminUserAction } from "@/app/actions";
import type { AdminAccessDto, AdminRoleDto, AdminUserDto, AuditEventDto } from "@/lib/api";
import { initials } from "./admin-chrome";

type UserEditorProps = {
  user: AdminUserDto;
  data: AdminAccessDto;
  audit: AuditEventDto[];
  close: () => void;
  refresh: (message: string) => Promise<void>;
};

export function UserEditor({ user, data, audit, close, refresh }: UserEditorProps) {
  const [tab, setTab] = useState<"profile" | "access" | "activity">("access");
  const [fullName, setFullName] = useState(user.full_name);
  const [password, setPassword] = useState("");
  const [active, setActive] = useState(user.active);
  const [superAdmin, setSuperAdmin] = useState(user.super_admin);
  const [organizationId, setOrganizationId] = useState(data.organizations[0]?.id ?? "");
  const [platformRoleIds, setPlatformRoleIds] = useState<string[]>([]);
  const [organizationRoleIds, setOrganizationRoleIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<"profile" | "platform" | "organization" | null>(null);
  const [error, setError] = useState("");

  const platformRoles = useMemo(() => data.roles.filter((role) => role.scope === "PLATFORM" && role.active), [data.roles]);
  const organizationRoles = useMemo(() => data.roles.filter((role) => role.scope === "ORGANIZATION" && role.active), [data.roles]);
  const userActivity = useMemo(() => audit.filter((event) => event.actor_subject === user.subject || (event.entity_type === "USER" && event.entity_id === user.id)), [audit, user.id, user.subject]);

  useEffect(() => {
    setPlatformRoleIds(data.platform_assignments?.find((item) => item.user_id === user.id)?.role_ids ?? []);
  }, [data.platform_assignments, user.id]);

  useEffect(() => {
    const assignment = data.assignments.find((item) => item.user_id === user.id && item.organization_id === organizationId);
    setOrganizationRoleIds(assignment?.active ? assignment.role_ids : []);
  }, [data.assignments, organizationId, user.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const run = async (kind: NonNullable<typeof busy>, work: () => Promise<void>, message: string) => {
    setBusy(kind);
    setError("");
    try {
      await work();
      await refresh(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved.");
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    void run("profile", async () => {
      await updateAdminUserAction(user.id, {
        fullName: fullName.trim(),
        password: password || undefined,
        active,
        superAdmin,
      });
      setPassword("");
    }, "User profile updated");
  };

  return <div className="governance-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="governance-user-editor" role="dialog" aria-modal="true" aria-labelledby="user-editor-title">
      <header>
        <span className="governance-editor-avatar">{initials(user.full_name)}</span>
        <div><small>User entity</small><h2 id="user-editor-title">{user.full_name}</h2><p>{user.email}</p></div>
        <button type="button" aria-label="Close user editor" onClick={close}><X size={19}/></button>
      </header>

      {error && <div className="governance-form-error" role="alert">{error}</div>}

      <nav className="governance-editor-tabs" aria-label="User details">
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><UserRound size={16}/>Identity & login</button>
        <button className={tab === "access" ? "active" : ""} onClick={() => setTab("access")}><ShieldCheck size={16}/>Roles & organizations</button>
        <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}><Activity size={16}/>Activity</button>
      </nav>

      <div className="governance-editor-scroll">
        {tab === "profile" && <form className="governance-editor-section" onSubmit={saveProfile}>
          <SectionTitle icon={<UserRound/>} title="Identity and login" detail="Update the user's display name, login password, and account state."/>
          <div className="governance-editor-fields">
            <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={160}/></label>
            <label>Email address<input value={user.email} disabled/><small>Email is the permanent login identifier.</small></label>
            <label>New password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={10} placeholder="Leave blank to keep current password"/></label>
          </div>
          <div className="governance-editor-toggles">
            <label><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)}/><span><b>Active account</b><small>Disabled users cannot sign in.</small></span></label>
            <label><input type="checkbox" checked={superAdmin} onChange={(event) => setSuperAdmin(event.target.checked)}/><span><b>Super Administrator</b><small>Full Governance Console authority. Product access is still assigned separately.</small></span></label>
          </div>
          <SaveButton busy={busy === "profile"} label="Save identity"/>
        </form>}

        {tab === "access" && <div><section className="governance-editor-section">
          <SectionTitle icon={<ShieldCheck/>} title="Platform-scoped roles" detail="Capabilities that apply across the SaaS platform, not inside one organization."/>
          <ScopeNote scope="Platform" detail="Use platform roles for global operations such as creating organizations, managing access-control roles, or reading platform audit history. Super Administrator is a separate all-powerful governance flag."/>
          <RolePicker roles={platformRoles} selected={platformRoleIds} setSelected={setPlatformRoleIds}/>
          <SaveButton busy={busy === "platform"} label="Save platform roles" onClick={() => void run("platform", () => assignAdminRolesAction({ userId: user.id, roleIds: platformRoleIds }), "Platform roles updated")}/>
        </section>

        <section className="governance-editor-section">
          <SectionTitle icon={<Building2/>} title="Organization memberships" detail="This user can belong to multiple organizations with different roles in each."/>
          <ScopeNote scope="Organization" detail="Organization roles are tenant-specific. The same user can be an Editor in one organization, a Viewer in another, and have no access elsewhere."/>
          {data.organizations.length ? <>
            <div className="governance-membership-grid">{data.organizations.map((organization) => {
              const assignment = data.assignments.find((item) => item.user_id === user.id && item.organization_id === organization.id);
              const assignedRoles = assignment?.active ? assignment.role_ids.map((id) => data.roles.find((role) => role.id === id)?.name).filter(Boolean) : [];
              return <button type="button" className={organizationId === organization.id ? "selected" : ""} key={organization.id} onClick={() => setOrganizationId(organization.id)}><span><Building2 size={16}/></span><div><b>{organization.name}</b><small>{assignedRoles.length ? assignedRoles.join(" · ") : "No access"}</small></div>{organizationId === organization.id && <Check size={16}/>}</button>;
            })}</div>
            <div className="governance-membership-editor"><b>Edit roles for {data.organizations.find((organization) => organization.id === organizationId)?.name}</b><p>Select one or more reusable organization roles.</p></div>
            <RolePicker roles={organizationRoles} selected={organizationRoleIds} setSelected={setOrganizationRoleIds}/>
            <p className="governance-revoke-hint">Save with no roles selected to revoke access to this organization.</p>
            <SaveButton busy={busy === "organization"} label="Save organization access" onClick={() => void run("organization", () => assignAdminRolesAction({ userId: user.id, organizationId, roleIds: organizationRoleIds }), organizationRoleIds.length ? "Organization access updated" : "Organization access revoked")}/>
          </> : <p className="governance-empty-inline">Create an organization before assigning organization access.</p>}
        </section></div>}

        {tab === "activity" && <section className="governance-editor-section">
          <SectionTitle icon={<Activity/>} title="User activity" detail="Successful sign-ins and changes performed by this identity."/>
          <div className="governance-user-activity">{userActivity.map((event) => <article key={event.id}><span><Activity size={15}/></span><div><b>{event.label}</b><p>{event.context}</p><small>{new Date(event.occurred_at).toLocaleString()} · {event.event_type.replaceAll("_", " ")}</small></div></article>)}{userActivity.length === 0 && <p className="governance-empty-inline">No recorded activity for this user yet.</p>}</div>
        </section>}
      </div>
    </section>
  </div>;
}

function SectionTitle({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <header className="governance-editor-section-title"><span>{icon}</span><div><h3>{title}</h3><p>{detail}</p></div></header>;
}

function ScopeNote({ scope, detail }: { scope: string; detail: string }) {
  return <div className="governance-scope-note"><b>{scope} scope</b><p>{detail}</p></div>;
}

function RolePicker({ roles, selected, setSelected }: { roles: AdminRoleDto[]; selected: string[]; setSelected: (ids: string[]) => void }) {
  if (!roles.length) return <p className="governance-empty-inline">No active roles exist for this scope.</p>;
  return <div className="governance-editor-role-grid">{roles.map((role) => {
    const checked = selected.includes(role.id);
    return <label key={role.id} className={checked ? "selected" : ""}>
      <input type="checkbox" checked={checked} onChange={() => setSelected(checked ? selected.filter((id) => id !== role.id) : [...selected, role.id])}/>
      <span><b>{role.name}</b><small>{role.description || `${role.permissions.length} permissions`}</small></span>
      {checked && <Check size={16}/>} 
    </label>;
  })}</div>;
}

function SaveButton({ busy, label, onClick }: { busy: boolean; label: string; onClick?: () => void }) {
  return <button className="governance-primary governance-editor-save" type={onClick ? "button" : "submit"} onClick={onClick} disabled={busy}>{busy ? <LoaderCircle className="spin"/> : <KeyRound/>}{busy ? "Saving…" : label}</button>;
}
