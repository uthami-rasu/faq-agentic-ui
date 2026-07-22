import type { AgentDto, OrganizationDto } from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { Agent, Organization } from "./types";

export function initials(name: string) {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "QD";
}

export function mapOrganization(item: OrganizationDto): Organization {
  return { id: item.id, name: item.name, description: item.description, category: item.category, initials: initials(item.name), color: "violet", version: item.version };
}

export function mapAgent(item: AgentDto): Agent {
  return {
    id: item.id,
    organizationId: item.organization_id,
    name: item.name,
    description: item.description,
    docs: 0,
    updated: new Date(item.updated_at).toLocaleString(),
    status: item.status === "ACTIVE" && item.enabled ? "Live" : "Draft",
    color: "emerald",
    initials: initials(item.name),
    version: item.version,
  };
}

export function apiErrorMessage(error: unknown) {
  return error instanceof ApiError ? `${error.message} (${error.code})` : "The backend request failed.";
}
