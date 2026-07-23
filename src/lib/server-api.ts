import "server-only";

import type { AgentDto, AiModelDto, DashboardDto, DocumentDto, InitialAppData, NotificationDto, OrchestratorConfigurationDto, OrganizationDto, PaginatedResult, PaginationDto, ServiceStatusDto, SettingsDataDto } from "@/lib/api";

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

async function requestBackend<T>(path: string, userAuthorization?: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const authorization = authorizationHeader(userAuthorization);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (authorization) headers.set("Authorization", authorization);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (cause) {
    const error = new Error("Arffy AI couldn't reach the backend service. Check that it is running, then retry.", { cause });
    error.name = "BACKEND_UNAVAILABLE";
    throw error;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string; code?: string } };
    const error = new Error(payload.error?.message ?? `Backend request failed with status ${response.status}.`);
    error.name = payload.error?.code ?? "BACKEND_REQUEST_FAILED";
    throw error;
  }

  if (response.status === 204) return { data: undefined as T };
  return response.json() as Promise<ApiEnvelope<T>>;
}

export async function loadOrganizations(userAuthorization?: string): Promise<OrganizationDto[]> {
  return (await requestBackend<OrganizationDto[]>("/organizations?search=&limit=100", userAuthorization)).data;
}

export async function loadAiModels(userAuthorization?: string): Promise<AiModelDto[]> {
  return (await requestBackend<AiModelDto[]>("/ai-models?capability=faq", userAuthorization)).data;
}

export async function loadSettingsData(userAuthorization?: string): Promise<SettingsDataDto> {
  const [systemResult, modelsResult] = await Promise.allSettled([
    requestBackend<{ services: ServiceStatusDto[]; checked_at: string }>("/system/status", userAuthorization),
    loadAiModels(userAuthorization),
  ]);
  const services: ServiceStatusDto[] = systemResult.status === "fulfilled"
    ? systemResult.value.data.services
    : [
      { id: "backend", name: "FAQ backend", status: "DOWN", detail: "The frontend could not reach the backend API." },
      { id: "storage", name: "MinIO object storage", status: "UNKNOWN", detail: "Storage cannot be checked while the backend is unavailable." },
    ];
  services.push(modelsResult.status === "fulfilled"
    ? { id: "ai", name: "AI processing service", status: "UP", detail: `${modelsResult.value.length} model${modelsResult.value.length === 1 ? " is" : "s are"} available through the backend.` }
    : { id: "ai", name: "AI processing service", status: "DOWN", detail: "The backend could not reach the AI model catalog." });
  return {
    services,
    models: modelsResult.status === "fulfilled" ? modelsResult.value : [],
    checked_at: systemResult.status === "fulfilled" ? systemResult.value.data.checked_at : new Date().toISOString(),
  };
}

export async function fetchDocumentContent(
  organizationId: string,
  documentId: string,
  textPreview: boolean,
  userAuthorization?: string,
): Promise<Response> {
  const authorization = authorizationHeader(userAuthorization);
  const headers = new Headers({ Accept: textPreview ? "text/plain" : "*/*" });
  if (authorization) headers.set("Authorization", authorization);
  return fetch(`${API_BASE_URL}/organizations/${encodeURIComponent(organizationId)}/documents/${encodeURIComponent(documentId)}/${textPreview ? "text-preview" : "content"}`, {
    headers,
    cache: "no-store",
  });
}

export async function loadNotifications(userAuthorization?: string): Promise<NotificationDto[]> {
  return (await requestBackend<NotificationDto[]>("/notifications?limit=20", userAuthorization)).data;
}

export async function loadDashboard(organizationId: string, userAuthorization?: string): Promise<DashboardDto> {
  return (await requestBackend<DashboardDto>(
    `/organizations/${encodeURIComponent(organizationId)}/dashboard`, userAuthorization,
  )).data;
}

export async function loadOrchestratorConfiguration(
  organizationId: string,
  userAuthorization?: string,
): Promise<OrchestratorConfigurationDto> {
  return (await requestBackend<OrchestratorConfigurationDto>(
    `/organizations/${encodeURIComponent(organizationId)}/orchestrator`, userAuthorization,
  )).data;
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

export async function loadDocumentsPage(
  organizationId: string,
  options: { search?: string; agentId?: string; page?: number; pageSize?: number } = {},
  userAuthorization?: string,
): Promise<PaginatedResult<DocumentDto>> {
  const search = options.search?.trim() ?? "";
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
  const params = new URLSearchParams({ search, page: String(page), page_size: String(pageSize) });
  if (options.agentId) params.set("agent_id", options.agentId);
  const payload = await requestBackend<DocumentDto[]>(`/organizations/${encodeURIComponent(organizationId)}/documents?${params}`, userAuthorization);
  return {
    items: payload.data,
    page: payload.pagination?.page ?? page,
    pageSize: payload.pagination?.page_size ?? pageSize,
    totalItems: payload.pagination?.total_items ?? payload.data.length,
    totalPages: payload.pagination?.total_pages ?? (payload.data.length ? 1 : 0),
  };
}

export async function uploadDocuments(
  organizationId: string,
  formData: FormData,
  userAuthorization?: string,
): Promise<DocumentDto[]> {
  return (await requestBackend<DocumentDto[]>(
    `/organizations/${encodeURIComponent(organizationId)}/documents`,
    userAuthorization,
    { method: "POST", body: formData },
  )).data;
}

export async function loadInitialAppData(
  userAuthorization?: string,
  faqQuery: { search?: string; page?: number; pageSize?: number } = {},
  documentQuery: { search?: string; agentId?: string; page?: number; pageSize?: number } = {},
): Promise<InitialAppData> {
  const modelsPromise = loadAiModels(userAuthorization)
    .then((models) => ({ models, available: true }))
    .catch(() => ({ models: [] as AiModelDto[], available: false }));
  const notificationsPromise = loadNotifications(userAuthorization).catch(() => [] as NotificationDto[]);
  const organizations = await loadOrganizations(userAuthorization);
  const organizationId = organizations[0]?.id;
  const search = faqQuery.search?.trim() ?? "";
  const page = Math.max(1, faqQuery.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, faqQuery.pageSize ?? 6));
  const documentSearch = documentQuery.search?.trim() ?? "";
  const documentAgentId = documentQuery.agentId ?? "";
  const documentPage = Math.max(1, documentQuery.page ?? 1);
  const documentPageSize = Math.min(100, Math.max(1, documentQuery.pageSize ?? 12));
  if (!organizationId) {
    const emptyPage = { items: [], page: 1, pageSize, totalItems: 0, totalPages: 0 };
    const [modelCatalog, notifications] = await Promise.all([modelsPromise, notificationsPromise]);
    return {
      organizations,
      agentsPage: { ...emptyPage, pageSize: 100 },
      faqAgentsPage: emptyPage,
      documentsPage: { ...emptyPage, pageSize: documentPageSize },
      notifications,
      aiModels: modelCatalog.models,
      aiModelsAvailable: modelCatalog.available,
      dashboard: {
        agents: { total: 0, active: 0, draft: 0, archived: 0 },
        documents: { total: 0, ready: 0, processing: 0, failed: 0, chunks: 0 },
        orchestrator: { active: false },
      },
      faqQuery: { search, page, pageSize },
      documentQuery: { search: documentSearch, agentId: documentAgentId, page: documentPage, pageSize: documentPageSize },
    };
  }

  const [agentsPage, faqAgentsPage, documentsPage, dashboard, modelCatalog, notifications] = await Promise.all([
    loadAgentsPage(organizationId, { page: 1, pageSize: 100 }, userAuthorization),
    loadAgentsPage(organizationId, { search, page, pageSize }, userAuthorization),
    loadDocumentsPage(organizationId, { search: documentSearch, agentId: documentAgentId, page: documentPage, pageSize: documentPageSize }, userAuthorization),
    loadDashboard(organizationId, userAuthorization),
    modelsPromise,
    notificationsPromise,
  ]);
  return {
    organizations,
    agentsPage,
    faqAgentsPage,
    documentsPage,
    notifications,
    aiModels: modelCatalog.models,
    aiModelsAvailable: modelCatalog.available,
    dashboard,
    faqQuery: { search, page, pageSize },
    documentQuery: { search: documentSearch, agentId: documentAgentId, page: documentPage, pageSize: documentPageSize },
  };
}

export async function createOrganization(
  input: { name: string; description: string; category: string },
  userAuthorization?: string,
): Promise<OrganizationDto> {
  return (await requestBackend<OrganizationDto>("/organizations", userAuthorization, { method: "POST", body: JSON.stringify(input) })).data;
}

export async function configureOrchestrator(
  organizationId: string,
  input: { assistant_name?: string; welcome_message: string; system_prompt: string; active?: boolean; agent_ids?: string[] },
  userAuthorization?: string,
): Promise<OrchestratorConfigurationDto> {
  return (await requestBackend<OrchestratorConfigurationDto>(`/organizations/${encodeURIComponent(organizationId)}/orchestrator`,
    userAuthorization, { method: "PUT", body: JSON.stringify(input) })).data;
}

export async function updateOrganization(
  organizationId: string,
  input: Partial<Pick<OrganizationDto, "name" | "description" | "category" | "public_display_name" | "primary_color">> & { version: number },
  userAuthorization?: string,
): Promise<OrganizationDto> {
  return (await requestBackend<OrganizationDto>(`/organizations/${encodeURIComponent(organizationId)}`, userAuthorization, { method: "PATCH", body: JSON.stringify(input) })).data;
}

export async function createAgent(
  organizationId: string,
  input: { name: string; description: string; document_ids?: string[] },
  userAuthorization?: string,
): Promise<AgentDto> {
  return (await requestBackend<AgentDto>(`/organizations/${encodeURIComponent(organizationId)}/agents`, userAuthorization, { method: "POST", body: JSON.stringify(input) })).data;
}

export async function replaceAgentDocuments(
  organizationId: string,
  agentId: string,
  documentIds: string[],
  userAuthorization?: string,
): Promise<void> {
  await requestBackend<void>(
    `/organizations/${encodeURIComponent(organizationId)}/agents/${encodeURIComponent(agentId)}/documents`,
    userAuthorization,
    { method: "PUT", body: JSON.stringify({ document_ids: documentIds }) },
  );
}

export async function updateAgent(
  organizationId: string,
  agentId: string,
  input: Partial<Pick<AgentDto, "name" | "description" | "status" | "enabled">> & { version: number },
  userAuthorization?: string,
): Promise<AgentDto> {
  return (await requestBackend<AgentDto>(`/organizations/${encodeURIComponent(organizationId)}/agents/${encodeURIComponent(agentId)}`, userAuthorization, { method: "PATCH", body: JSON.stringify(input) })).data;
}

export async function duplicateAgent(
  organizationId: string,
  agentId: string,
  name?: string,
  userAuthorization?: string,
): Promise<AgentDto> {
  return (await requestBackend<AgentDto>(`/organizations/${encodeURIComponent(organizationId)}/agents/${encodeURIComponent(agentId)}/duplicate`, userAuthorization, { method: "POST", body: JSON.stringify(name ? { name } : {}) })).data;
}

export async function deleteAgent(organizationId: string, agentId: string, userAuthorization?: string): Promise<void> {
  await requestBackend<void>(`/organizations/${encodeURIComponent(organizationId)}/agents/${encodeURIComponent(agentId)}`, userAuthorization, { method: "DELETE" });
}

export async function markNotificationRead(notificationId: string, read: boolean, userAuthorization?: string): Promise<NotificationDto> {
  return (await requestBackend<NotificationDto>(`/notifications/${encodeURIComponent(notificationId)}`, userAuthorization, { method: "PATCH", body: JSON.stringify({ read }) })).data;
}
