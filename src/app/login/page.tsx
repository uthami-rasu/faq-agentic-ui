import { Bot, FileCheck2, Network, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return <main className="login-page"><section className="login-story"><div className="login-brand"><span><Sparkles size={22}/></span>Arffy <b>AI</b></div><div className="login-story-copy"><span className="login-kicker"><ShieldCheck size={14}/> Private knowledge workspace</span><h1>Every answer starts with trusted knowledge.</h1><p>Build focused FAQ agents, organize private documents, and route every question through one intelligent assistant.</p><div className="login-capabilities"><span><Bot size={18}/><b>Focused AI agents</b><small>Clear ownership for every topic</small></span><span><FileCheck2 size={18}/><b>Secure documents</b><small>Organization-isolated knowledge</small></span><span><Network size={18}/><b>Smart orchestration</b><small>One entry point for every agent</small></span></div></div><small className="login-security"><ShieldCheck size={13}/> Access is controlled by organization membership and role permissions.</small></section><section className="login-panel"><div className="login-card"><span className="login-card-mark"><Sparkles size={24}/></span><small>ARFFY CONTROL PLANE</small><h2>Welcome back</h2><p>Sign in with the credentials provided by your administrator.</p><LoginForm/><footer><ShieldCheck size={14}/> Protected with a revocable server session</footer></div></section></main>;
}
