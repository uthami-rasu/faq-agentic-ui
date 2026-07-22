"use client";

import { CheckCircle2, LockKeyhole, Moon, Server, Sun } from "lucide-react";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";
import { PageHeading } from "../shared";

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  return <><PageHeading title="Settings" description="Essential application preferences and data-access information."/>
    <div className="settings-essential-grid">
      <section className="panel settings-essential-panel"><div className="panel-title"><div><h2>Appearance</h2><p>Choose the theme used on this device. Changes apply immediately.</p></div><Moon size={18}/></div><div className="theme-cards"><button className={theme === "light" ? "selected" : ""} onClick={() => dispatch(setTheme("light"))}><Sun size={20}/><span>Light</span><CheckCircle2 size={16}/></button><button className={theme === "dark" ? "selected" : ""} onClick={() => dispatch(setTheme("dark"))}><Moon size={20}/><span>Dark</span><CheckCircle2 size={16}/></button></div></section>
      <section className="panel settings-essential-panel"><div className="panel-title"><div><h2>Server-side data access</h2><p>How QueryDesk communicates with your application and AI services.</p></div><LockKeyhole size={18}/></div><div className="server-data-flow"><span><Server size={19}/></span><div><b>Private backend connection</b><p>Organizations, agents, and the AI model catalog are requested by the Next.js server. The private AI service URL and backend credentials are never sent to the browser.</p></div></div><small className="settings-note">Theme preference remains on this device because it is a local display choice, not application data.</small></section>
    </div>
  </>;
}
