import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/product-shell";
import { loadInitialAppData } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const token = (await cookies()).get("arffy-ai-access-token")?.value;
  if (!token) redirect("/login");
  const data = await loadInitialAppData(`Bearer ${token}`);
  if (!data.currentUser.super_admin) redirect("/");
  return <ProductShell initialData={data} initialView="admin"/>;
}
