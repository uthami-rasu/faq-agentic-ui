"use client";

import { ArrowUpRight, CheckCircle2, HelpCircle, LayoutDashboard, Moon, Save, Settings, Sun } from "lucide-react";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";
import type { Notify } from "../types";
import { PageHeading } from "../shared";

export function SettingsPage({ notify }: { notify: Notify }) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  return <>
    <PageHeading title="Settings" description="Personalize how QueryDesk looks and behaves for you."><button className="primary-button" onClick={() => notify("Application settings saved")}><Save size={16}/> Save preferences</button></PageHeading>
    <div className="settings-page-layout"><aside className="settings-nav panel"><button className="active"><Settings size={16}/> Overview</button><button><LayoutDashboard size={16}/> Appearance</button><button><HelpCircle size={16}/> About</button></aside><section className="panel organization-form"><div className="panel-title"><div><h2>Preference overview</h2><p>These settings apply only to your account.</p></div></div><div className="settings-group"><div className="settings-group-title"><Moon size={17}/><div><b>Theme</b><small>Choose how QueryDesk appears on this device.</small></div></div><div className="theme-cards"><button className={theme === "light" ? "selected" : ""} onClick={() => dispatch(setTheme("light"))}><Sun size={19}/><span>Light</span><CheckCircle2 size={15}/></button><button className={theme === "dark" ? "selected" : ""} onClick={() => dispatch(setTheme("dark"))}><Moon size={19}/><span>Dark</span><CheckCircle2 size={15}/></button><button onClick={() => notify("System theme will be available in the next settings update")}><Settings size={19}/><span>System</span><CheckCircle2 size={15}/></button></div></div><div className="form-divider"/><label className="preference-row"><span><b>Compact sidebar</b><small>Use a narrower navigation when working on large screens.</small></span><span className="switch"><input type="checkbox"/><i/></span></label><label className="preference-row"><span><b>Comfortable density</b><small>Use more spacing in lists, tables, and forms.</small></span><span className="switch"><input type="checkbox" defaultChecked/><i/></span></label><div className="form-divider"/><div className="about-row"><span><b>QueryDesk AI</b><small>Version 1.0.0 · July 2026</small></span><button className="secondary-button" onClick={() => notify("Documentation is coming soon")}>Documentation <ArrowUpRight size={14}/></button></div></section></div>
  </>;
}
