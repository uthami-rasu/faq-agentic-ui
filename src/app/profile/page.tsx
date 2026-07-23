import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loadCurrentUser } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function ProfileRoute() {
  const cookieStore = await cookies();
  const token = cookieStore.get("arffy-ai-access-token")?.value ?? cookieStore.get("querydesk-access-token")?.value;
  if (!token) redirect("/login");
  const user = await loadCurrentUser(`Bearer ${token}`);
  const productAccess = Object.keys(user.organization_permissions).length > 0;
  redirect(user.super_admin && !productAccess ? "/admin?view=settings" : "/workspace?view=settings");
}
