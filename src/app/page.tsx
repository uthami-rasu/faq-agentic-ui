import { ProductShell } from "@/components/product-shell";
import { loadInitialAppData } from "@/lib/server-api";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

type HomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function Home({ searchParams }: { searchParams: HomeSearchParams }) {
  const params = await searchParams;
  const search = first(params.agent_search).slice(0, 200);
  const requestedPage = Number.parseInt(first(params.agent_page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const initialView = first(params.view) === "agents" ? "agents" : undefined;
  const accessToken = (await cookies()).get("querydesk-access-token")?.value;
  const initialData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
    ? undefined
    : await loadInitialAppData(accessToken ? `Bearer ${accessToken}` : undefined, { search, page, pageSize: 6 });
  return <ProductShell initialData={initialData} initialView={initialView} />;
}
