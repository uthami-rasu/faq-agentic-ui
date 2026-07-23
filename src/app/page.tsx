import { WorkspaceLanding } from "@/components/workspace-landing";
import { loadCurrentUser } from "@/lib/server-api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("arffy-ai-access-token")?.value
    ?? cookieStore.get("querydesk-access-token")?.value;
  if (!accessToken && process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "true") redirect("/login");
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") redirect("/workspace");
  try {
    const user = await loadCurrentUser(`Bearer ${accessToken}`);
    const productAccess = Object.keys(user.organization_permissions).length > 0;
    if (user.super_admin && productAccess) return <WorkspaceLanding user={user}/>;
    if (user.super_admin) redirect("/admin");
    if (productAccess) redirect("/workspace");
    return <WorkspaceLanding user={user}/>;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?session=expired");
    throw error;
  }
}
