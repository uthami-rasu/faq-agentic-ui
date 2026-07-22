import type { ViewKey } from "@/store";

export type Agent = {
  id: string;
  name: string;
  description: string;
  docs: number;
  updated: string;
  status: "Live" | "Draft";
  color: string;
  initials: string;
  organizationId: string;
  version: number;
};

export type Organization = {
  id: string;
  name: string;
  description: string;
  category: string;
  initials: string;
  color: string;
  version: number;
};

export type DashboardBackendData = {
  processing: { completed: number; processing: number; failed: number };
  orchestratorConfigured: boolean;
  organizationWidgetConfigured: boolean;
  faqAgentWidgets: number;
  activity: Array<{
    id: number;
    label: string;
    context: string;
    time: string;
    kind: "document" | "agent" | "widget";
  }>;
};

export type OrganizationTab = "overview" | "branding" | "members" | "api" | "danger";
export type AgentTab = "overview" | "knowledge" | "ai" | "retrieval" | "prompt" | "playground" | "widget";
export type Notify = (message: string) => void;

export const titleMap: Record<ViewKey, string> = {
  dashboard: "Dashboard",
  organization: "Organization Overview",
  orchestrator: "AI Orchestrator",
  agents: "FAQ Agents",
  agent: "Agent details",
  documents: "Documents",
  settings: "Settings",
};
