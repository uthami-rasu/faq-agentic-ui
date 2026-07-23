import type { Agent, DashboardBackendData, Organization } from "./types";

export const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export const initialOrganizations: Organization[] = [
  { id: "1", name: "Acme Inc.", description: "AI-powered tools for modern support teams.", category: "SaaS Company", initials: "A", color: "sand", version: 0 },
  { id: "2", name: "TechNova Pvt Ltd", description: "Building better digital learning experiences.", category: "Educational Institute", initials: "T", color: "blue", version: 0 },
  { id: "3", name: "Healthcare Plus", description: "Accessible patient information and support.", category: "Healthcare", initials: "H", color: "green", version: 0 },
];

export const initialAgents: Agent[] = [
  { id: "1", name: "Customer Support", description: "Product questions, troubleshooting, and account help.", docs: 22, updated: "12 min ago", status: "Live", color: "violet", initials: "CS", organizationId: "1", version: 0 },
  { id: "2", name: "Employee Handbook", description: "Benefits, workplace policies, and people operations.", docs: 18, updated: "Yesterday", status: "Live", color: "blue", initials: "EH", organizationId: "1", version: 0 },
  { id: "3", name: "Developer Docs", description: "API references, SDK guides, and integrations.", docs: 16, updated: "3 days ago", status: "Draft", color: "orange", initials: "DD", organizationId: "1", version: 0 },
  { id: "4", name: "Billing & Plans", description: "Subscriptions, invoices, pricing, and plan changes.", docs: 15, updated: "4 days ago", status: "Live", color: "emerald", initials: "BP", organizationId: "1", version: 0 },
  { id: "5", name: "Sales FAQ", description: "Product capabilities, plans, and purchasing questions.", docs: 13, updated: "1 week ago", status: "Live", color: "blue", initials: "SF", organizationId: "1", version: 0 },
];

export const initialDashboardData: Record<string, DashboardBackendData> = {
  "1": {
    agents: { total: 5, active: 4, draft: 1, archived: 0 },
    documents: { total: 84, ready: 80, processing: 3, failed: 1, chunks: 1240 },
    orchestrator: { active: true },
  },
};

export const documents = [
  { name: "Product_Guide_2026.pdf", agent: "Customer Support", size: "4.8 MB", chunks: 142, date: "Today, 9:42 AM", status: "Ready" },
  { name: "Returns_and_Refunds.md", agent: "Customer Support", size: "68 KB", chunks: 18, date: "Yesterday", status: "Ready" },
  { name: "Employee_Handbook.pdf", agent: "Employee Handbook", size: "2.1 MB", chunks: 86, date: "Jul 18, 2026", status: "Ready" },
  { name: "API_Authentication.md", agent: "Developer Docs", size: "124 KB", chunks: 31, date: "Jul 17, 2026", status: "Processing" },
];
