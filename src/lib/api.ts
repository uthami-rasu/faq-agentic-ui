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

export type DocumentDto = {
  id: string;
  organization_id: string;
  file_name: string;
  normalized_file_name: string;
  mime_type: string;
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

export type InitialAppData = {
  organizations: OrganizationDto[];
  agentsPage: PaginatedResult<AgentDto>;
  faqAgentsPage: PaginatedResult<AgentDto>;
  documentsPage: PaginatedResult<DocumentDto>;
  notifications: NotificationDto[];
  aiModels: AiModelDto[];
  aiModelsAvailable: boolean;
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
