const API_BASE_URL = "/api/backend";

type ApiEnvelope<T> = { data: T; pagination?: PaginationDto };
type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    field_errors?: Record<string, string>;
  };
};

export type OrganizationDto = {
  id: string;
  name: string;
  description: string;
  category: string;
  logo_url: string | null;
  public_display_name: string | null;
  primary_color: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type AgentDto = {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  enabled: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

export type PaginationDto = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type InitialAppData = {
  organizations: OrganizationDto[];
  agentsPage: PaginatedResult<AgentDto>;
  faqAgentsPage: PaginatedResult<AgentDto>;
  faqQuery: {
    search: string;
    page: number;
    pageSize: number;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "API_ERROR",
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function requestEnvelope<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as ApiErrorEnvelope;
    throw new ApiError(
      payload.error?.message ?? `API request failed with status ${response.status}.`,
      response.status,
      payload.error?.code,
      payload.error?.field_errors,
    );
  }

  if (response.status === 204) return { data: undefined as T };
  return response.json() as Promise<ApiEnvelope<T>>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await requestEnvelope<T>(path, init)).data;
}

export const faqApi = {
  listOrganizations(search = ""): Promise<OrganizationDto[]> {
    const params = new URLSearchParams({ search, limit: "100" });
    return request(`/organizations?${params}`);
  },

  createOrganization(input: { name: string; description: string; category: string }): Promise<OrganizationDto> {
    return request("/organizations", { method: "POST", body: JSON.stringify(input) });
  },

  updateOrganization(
    organizationId: string,
    input: Partial<Pick<OrganizationDto, "name" | "description" | "category" | "public_display_name" | "primary_color">> & { version: number },
  ): Promise<OrganizationDto> {
    return request(`/organizations/${organizationId}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  createAgent(organizationId: string, input: { name: string; description: string }): Promise<AgentDto> {
    return request(`/organizations/${organizationId}/agents`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateAgent(
    organizationId: string,
    agentId: string,
    input: Partial<Pick<AgentDto, "name" | "description" | "status" | "enabled">> & { version: number },
  ): Promise<AgentDto> {
    return request(`/organizations/${organizationId}/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  duplicateAgent(organizationId: string, agentId: string, name?: string): Promise<AgentDto> {
    return request(`/organizations/${organizationId}/agents/${agentId}/duplicate`, {
      method: "POST",
      body: JSON.stringify(name ? { name } : {}),
    });
  },

  deleteAgent(organizationId: string, agentId: string): Promise<void> {
    return request(`/organizations/${organizationId}/agents/${agentId}`, { method: "DELETE" });
  },
};
