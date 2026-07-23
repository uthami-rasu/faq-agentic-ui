import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/auth-actions";
import type { CurrentUserDto } from "@/lib/api";

export function WorkspaceLanding({ user }: { user: CurrentUserDto }) {
  const productAccess = Object.keys(user.organization_permissions).length > 0;
  return <main className="workspace-landing"><section><header><span><Sparkles size={22}/></span><div><b>Arffy AI</b><small>Choose your workspace</small></div></header><div className="workspace-welcome"><span>Welcome back</span><h1>{user.full_name}</h1><p>Your account has more than one responsibility. Choose where you want to work.</p></div><div className="workspace-choice-grid">{productAccess && <a href="/workspace"><span><Sparkles size={23}/></span><div><small>PRODUCT WORKSPACE</small><h2>Knowledge operations</h2><p>Manage organizations, FAQ agents, documents, and orchestration.</p><strong>Open Product <ArrowRight size={16}/></strong></div></a>}{user.super_admin && <a href="/admin"><span><ShieldCheck size={23}/></span><div><small>GOVERNANCE CONSOLE</small><h2>Identity & access</h2><p>Manage users, roles, permissions, and organization mappings.</p><strong>Open Governance <ArrowRight size={16}/></strong></div></a>}</div>{!productAccess && !user.super_admin && <div className="workspace-no-access"><Building2 size={24}/><div><b>No workspace access assigned</b><p>Ask a governance administrator to add you to an organization.</p></div></div>}<footer><span>Signed in as {user.email}</span><form action={logoutAction}><button>Log out</button></form></footer></section></main>;
}

