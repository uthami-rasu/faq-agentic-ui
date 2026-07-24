"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, LoaderCircle, ShieldAlert } from "lucide-react";
import { loadAdminAccessAction, loadAdminAuditAction } from "@/app/actions";
import type { CurrentUserDto } from "@/lib/api";
import { setTheme, useAppDispatch, useAppSelector } from "@/store";
import { AdminSidebar, AdminTopbar } from "./admin-chrome";
import { AdminWorkspace } from "./admin-workspace";
import type { AdminView } from "./types";

export function AdminShell({ currentUser, initialView = "overview" }: { currentUser: CurrentUserDto; initialView?: AdminView }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const theme = useAppSelector((state) => state.ui.theme);
  const [view, setView] = useState<AdminView>(initialView);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin-access"], queryFn: loadAdminAccessAction, staleTime: 10_000 });
  const auditQuery = useQuery({ queryKey: ["admin-audit"], queryFn: loadAdminAuditAction, staleTime: 10_000 });

  useEffect(() => {
    const saved = (localStorage.getItem("arffy-ai-theme") ?? "light") as "light" | "dark";
    dispatch(setTheme(saved));
  }, [dispatch]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("arffy-ai-theme", theme);
  }, [theme]);

  const changeView = (next: AdminView) => {
    setView(next);
    setMobileOpen(false);
    const url = next === "overview" ? "/admin" : `/admin?view=${next}`;
    window.history.replaceState(null, "", url);
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  return <div className="governance-shell">
    <AdminSidebar open={mobileOpen} view={view} currentUser={currentUser} changeView={changeView} close={() => setMobileOpen(false)}/>
    <main className="governance-main">
      <AdminTopbar view={view} theme={theme} currentUser={currentUser} openNavigation={() => setMobileOpen(true)}/>
      <div className="governance-content">
        {query.isLoading && <AdminLoadState icon={<LoaderCircle className="spin"/>} title="Loading governance data" detail="Reading users, roles, permissions, and access mappings…"/>}
        {query.isError && <AdminLoadState icon={<ShieldAlert/>} title="Governance data unavailable" detail="Your session may have expired, or the access service is unavailable." retry={() => query.refetch()}/>} 
        {query.data && <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .18 }}><AdminWorkspace view={view} data={query.data} audit={auditQuery.data ?? []} currentUser={currentUser} changeView={changeView} refresh={async (message) => { await Promise.all([query.refetch(), auditQuery.refetch()]); router.refresh(); notify(message); }}/></motion.div></AnimatePresence>}
      </div>
    </main>
    <AnimatePresence>{toast && <motion.div className="toast governance-toast" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><span><Check size={16}/></span>{toast}</motion.div>}</AnimatePresence>
  </div>;
}

function AdminLoadState({ icon, title, detail, retry }: { icon: React.ReactNode; title: string; detail: string; retry?: () => void }) {
  return <section className="governance-state"><span>{icon}</span><h1>{title}</h1><p>{detail}</p>{retry && <button className="secondary-button" onClick={retry}>Try again</button>}</section>;
}
