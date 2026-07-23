import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProductShell } from "@/components/product-shell";
import { loadInitialAppData } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function ProfileRoute() {
  const token = (await cookies()).get("arffy-ai-access-token")?.value;
  if (!token) redirect("/login");
  return <ProductShell initialData={await loadInitialAppData(`Bearer ${token}`)} initialView="profile"/>;
}
