"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bell, Check, CheckCheck, FileCheck2 } from "lucide-react";
import { loadNotificationsAction, markNotificationReadAction } from "@/app/actions";
import type { NotificationDto } from "@/lib/api";
import type { Notify } from "./types";

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationCenter({ initialNotifications, notify }: { initialNotifications: NotificationDto[]; notify: Notify }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const rootRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set(initialNotifications.map((item) => item.id)));
  const unread = notifications.filter((item) => !item.read_at);

  useEffect(() => { setNotifications(initialNotifications); }, [initialNotifications]);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await loadNotificationsAction();
        const fresh = next.find((item) => !knownIds.current.has(item.id));
        next.forEach((item) => knownIds.current.add(item.id));
        setNotifications(next);
        if (fresh) notify(fresh.message);
      } catch { /* Keep the last durable inbox snapshot while temporarily offline. */ }
    };
    const timer = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(timer);
  }, [notify]);

  const markRead = async (item: NotificationDto) => {
    if (item.read_at) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, read_at: readAt } : entry));
    try { await markNotificationReadAction(item.id); } catch { setNotifications((current) => current.map((entry) => entry.id === item.id ? item : entry)); }
  };
  const markAllRead = async () => {
    const unreadItems = notifications.filter((item) => !item.read_at);
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })));
    await Promise.allSettled(unreadItems.map((item) => markNotificationReadAction(item.id)));
  };

  return <div className="notification-center" ref={rootRef}>
    <button className="icon-button notification-button" aria-label={`${unread.length} unread notifications`} aria-expanded={open} onClick={() => setOpen((current) => !current)}><Bell size={18}/>{unread.length > 0 && <i/>}</button>
    {open && <section className="notification-popover" aria-label="Notifications"><header><div><h2>Notifications</h2><p>{unread.length ? `${unread.length} unread update${unread.length === 1 ? "" : "s"}` : "You’re all caught up"}</p></div>{unread.length > 0 && <button onClick={markAllRead}><CheckCheck size={14}/> Mark all read</button>}</header><div className="notification-list">{notifications.map((item) => <button className={item.read_at ? "" : "unread"} key={item.id} onClick={() => markRead(item)}><span className={item.type === "DOCUMENT_READY" ? "success" : "failure"}>{item.type === "DOCUMENT_READY" ? <FileCheck2 size={17}/> : <AlertCircle size={17}/>}</span><span><b>{item.title}</b><small>{item.message}</small><time>{relativeTime(item.created_at)}</time></span>{!item.read_at && <i/>}</button>)}{notifications.length === 0 && <div className="notification-empty"><span><Check size={20}/></span><b>No new notifications</b><p>Document processing updates will appear here.</p></div>}</div></section>}
  </div>;
}
