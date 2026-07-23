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

export type AiModelDto = {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  context_window: number | null;
  default_model: boolean;
};

export type ServiceStatusDto = {
  id: "backend" | "storage" | "ai";
  name: string;
  status: "UP" | "DOWN" | "UNKNOWN";
  detail: string;
};

export type SettingsDataDto = {
  services: ServiceStatusDto[];
  models: AiModelDto[];
  checked_at: string;
};

export type DocumentDto = {
  id: string;
  organization_id: string;
  file_name: string;
  normalized_file_name: string;
  mime_type: string;
  storage_bucket: string | null;
  storage_key: string;
  storage_uri: string | null;
  size_bytes: number;
  status: "UPLOADING" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";
  chunk_count: number | null;
  failure_code: string | null;
  failure_message: string | null;
  assigned_agents: Array<{ id: string; name: string }>;
  created_at: string;
  updated_at: string;
};

export type NotificationDto = {
  id: string;
  organization_id: string;
  type: "DOCUMENT_READY" | "DOCUMENT_FAILED";
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type DashboardDto = {
  agents: { total: number; active: number; draft: number; archived: number };
  documents: { total: number; ready: number; processing: number; failed: number; chunks: number };
  orchestrator: { active: boolean };
};

export type OrchestratorConfigurationDto = {
  id: string | null;
  organization_id: string;
  assistant_name: string;
  welcome_message: string;
  system_prompt: string;
  fallback_message: string;
  routing_mode: string;
  active: boolean;
  agent_ids: string[];
  version: number;
};

export type InitialAppData = {
  organizations: OrganizationDto[];
  agentsPage: PaginatedResult<AgentDto>;
  faqAgentsPage: PaginatedResult<AgentDto>;
  documentsPage: PaginatedResult<DocumentDto>;
  notifications: NotificationDto[];
  aiModels: AiModelDto[];
  aiModelsAvailable: boolean;
  dashboard: DashboardDto;
  faqQuery: {
    search: string;
    page: number;
    pageSize: number;
  };
  documentQuery: {
    search: string;
    agentId: string;
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
