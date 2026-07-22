import "server-only";

import type { AgentDto, InitialAppData, OrganizationDto, PaginatedResult, PaginationDto } from "@/lib/api";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");

type ApiEnvelope<T> = { data: T; pagination?: PaginationDto };

function authorizationHeader(userAuthorization?: string): string | undefined {
  if (userAuthorization) return userAuthorization;

  const serviceToken = process.env.BACKEND_SERVICE_TOKEN;
  if (serviceToken) return `Bearer ${serviceToken}`;

  if (process.env.NODE_ENV !== "production") {
    const user = process.env.DEV_AUTH_USER;
    const password = process.env.DEV_AUTH_PASSWORD;
    if (user && password) return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
  }
  return undefined;
}

async function requestBackend<T>(path: string, userAuthorization?: string): Promise<ApiEnvelope<T>> {
  const authorization = authorizationHeader(userAuthorization);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
    const error = new Error(payload.error?.message ?? `Backend request failed with status ${response.status}.`);
    error.name = payload.error?.code ?? "BACKEND_REQUEST_FAILED";
    throw error;
  }

  return response.json() as Promise<ApiEnvelope<T>>;
}

export async function loadInitialAppData(userAuthorization?: string): Promise<InitialAppData> {
  const organizationsPayload = await requestBackend<OrganizationDto[]>("/organizations?search=&limit=100", userAuthorization);
  const organizations = organizationsPayload.data;
  const organizationId = organizations[0]?.id;
  if (!organizationId) {
    return { organizations, agentsPage: { items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } };
  }

  const agentsPayload = await requestBackend<AgentDto[]>(`/organizations/${organizationId}/agents?search=&page=1&page_size=100`, userAuthorization);
  const pagination = agentsPayload.pagination;
  const agentsPage: PaginatedResult<AgentDto> = {
    items: agentsPayload.data,
    page: pagination?.page ?? 1,
    pageSize: pagination?.page_size ?? 100,
    totalItems: pagination?.total_items ?? agentsPayload.data.length,
    totalPages: pagination?.total_pages ?? (agentsPayload.data.length ? 1 : 0),
  };
  return { organizations, agentsPage };
}
