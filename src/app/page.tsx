import { ProductShell } from "@/components/product-shell";
import { loadInitialAppData } from "@/lib/server-api";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const accessToken = (await cookies()).get("querydesk-access-token")?.value;
  const initialData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
    ? undefined
    : await loadInitialAppData(accessToken ? `Bearer ${accessToken}` : undefined);
  return <ProductShell initialData={initialData} />;
}
