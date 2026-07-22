"use server";

import { cookies } from "next/headers";
import type { PaginatedResult, AgentDto } from "@/lib/api";
import { loadAgentsPage } from "@/lib/server-api";

export async function loadAgentsPageAction(input: {
  organizationId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AgentDto>> {
  const accessToken = (await cookies()).get("querydesk-access-token")?.value;
  return loadAgentsPage(
    input.organizationId,
    {
      search: input.search?.slice(0, 200),
      page: input.page,
      pageSize: input.pageSize,
    },
    accessToken ? `Bearer ${accessToken}` : undefined,
  );
}
