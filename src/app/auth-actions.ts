"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "@/lib/server-api";

export async function logoutAction() {
  const store = await cookies();
  const token = store.get("arffy-ai-access-token")?.value;
  try { if (token) await logout(`Bearer ${token}`); } finally { store.delete("arffy-ai-access-token"); }
  redirect("/login");
}
