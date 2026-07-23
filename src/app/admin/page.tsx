import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { isAdminView } from "@/components/admin/types";
import { loadCurrentUser } from "@/lib/server-api";

export const dynamic = "force-dynamic";

type AdminSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminRoute({ searchParams }: { searchParams: AdminSearchParams }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("arffy-ai-access-token")?.value ?? cookieStore.get("querydesk-access-token")?.value;
  if (!token) redirect("/login");
  const currentUser = await loadCurrentUser(`Bearer ${token}`);
  if (!currentUser.super_admin) redirect("/workspace");
  const requested = (await searchParams).view;
  const view = Array.isArray(requested) ? requested[0] : requested;
  return <AdminShell currentUser={currentUser} initialView={isAdminView(view) ? view : "overview"}/>;
}
