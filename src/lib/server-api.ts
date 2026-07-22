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

function paginatedAgents(payload: ApiEnvelope<AgentDto[]>, page: number, pageSize: number): PaginatedResult<AgentDto> {
  return {
    items: payload.data,
    page: payload.pagination?.page ?? page,
    pageSize: payload.pagination?.page_size ?? pageSize,
    totalItems: payload.pagination?.total_items ?? payload.data.length,
    totalPages: payload.pagination?.total_pages ?? (payload.data.length ? 1 : 0),
  };
}

export async function loadAgentsPage(
  organizationId: string,
  options: { search?: string; page?: number; pageSize?: number } = {},
  userAuthorization?: string,
): Promise<PaginatedResult<AgentDto>> {
  const search = options.search?.trim() ?? "";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const params = new URLSearchParams({ search, page: String(page), page_size: String(pageSize) });
  const payload = await requestBackend<AgentDto[]>(`/organizations/${encodeURIComponent(organizationId)}/agents?${params}`, userAuthorization);
  return paginatedAgents(payload, page, pageSize);
}

export async function loadInitialAppData(
  userAuthorization?: string,
  faqQuery: { search?: string; page?: number; pageSize?: number } = {},
): Promise<InitialAppData> {
  const organizationsPayload = await requestBackend<OrganizationDto[]>("/organizations?search=&limit=100", userAuthorization);
  const organizations = organizationsPayload.data;
  const organizationId = organizations[0]?.id;
  const search = faqQuery.search?.trim() ?? "";
  const page = Math.max(1, faqQuery.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, faqQuery.pageSize ?? 6));
  if (!organizationId) {
    const emptyPage = { items: [], page: 1, pageSize, totalItems: 0, totalPages: 0 };
    return {
      organizations,
      agentsPage: { ...emptyPage, pageSize: 100 },
      faqAgentsPage: emptyPage,
      faqQuery: { search, page, pageSize },
    };
  }

  const [agentsPage, faqAgentsPage] = await Promise.all([
    loadAgentsPage(organizationId, { page: 1, pageSize: 100 }, userAuthorization),
    loadAgentsPage(organizationId, { search, page, pageSize }, userAuthorization),
  ]);
  return { organizations, agentsPage, faqAgentsPage, faqQuery: { search, page, pageSize } };
}
