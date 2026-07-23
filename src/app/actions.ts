"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type { AdminAccessDto, AdminUserDto, AgentDto, DashboardDto, DocumentDto, NotificationDto, OrchestratorConfigurationDto, OrganizationDto, PaginatedResult, SettingsDataDto } from "@/lib/api";
import {
  createAgent,
  createOrganization,
  configureOrchestrator,
  deleteAgent,
  duplicateAgent,
  loadAgentsPage,
  loadDocumentsPage,
  loadDashboard,
  loadNotifications,
  loadOrchestratorConfiguration,
  loadOrganizations,
  loadSettingsData,
  markNotificationRead,
  replaceAgentDocuments,
  updateAgent,
  updateOrganization,
  uploadDocuments,
  loadAdminAccess,
  createAdminUser,
  updateAdminUser,
  createAdminRole,
  assignAdminRoles,
} from "@/lib/server-api";

async function authorization(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("arffy-ai-access-token")?.value
    ?? cookieStore.get("querydesk-access-token")?.value;
  return accessToken ? `Bearer ${accessToken}` : undefined;
}

export async function loadOrganizationsAction(): Promise<OrganizationDto[]> {
  return loadOrganizations(await authorization());
}

export async function loadAgentsPageAction(input: {
  organizationId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AgentDto>> {
  return loadAgentsPage(
    input.organizationId,
    {
      search: input.search?.slice(0, 200),
      page: input.page,
      pageSize: input.pageSize,
    },
    await authorization(),
  );
}

export async function loadDocumentsPageAction(input: {
  organizationId: string;
  search?: string;
  agentId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<DocumentDto>> {
  return loadDocumentsPage(input.organizationId, {
    search: input.search?.slice(0, 200),
    agentId: input.agentId,
    page: input.page,
    pageSize: input.pageSize,
  }, await authorization());
}

export async function loadNotificationsAction(): Promise<NotificationDto[]> {
  return loadNotifications(await authorization());
}

export async function loadDashboardAction(organizationId: string): Promise<DashboardDto> {
  return loadDashboard(organizationId, await authorization());
}

export async function loadSettingsAction(): Promise<SettingsDataDto> {
  return loadSettingsData(await authorization());
}

export async function loadOrchestratorConfigurationAction(
  organizationId: string,
): Promise<OrchestratorConfigurationDto> {
  return loadOrchestratorConfiguration(organizationId, await authorization());
}

export async function markNotificationReadAction(notificationId: string, read = true): Promise<NotificationDto> {
  return markNotificationRead(notificationId, read, await authorization());
}

export async function createOrganizationAction(input: {
  name: string;
  description: string;
  category: string;
}): Promise<OrganizationDto> {
  const created = await createOrganization(input, await authorization());
  revalidatePath("/");
  return created;
}

export async function configureOrchestratorAction(
  organizationId: string,
  input: { assistantName?: string; welcomeMessage: string; systemPrompt: string; active?: boolean; agentIds?: string[] },
): Promise<OrchestratorConfigurationDto> {
  const configured = await configureOrchestrator(organizationId, {
    assistant_name: input.assistantName,
    welcome_message: input.welcomeMessage,
    system_prompt: input.systemPrompt,
    active: input.active,
    agent_ids: input.agentIds,
  }, await authorization());
  revalidatePath("/");
  return configured;
}

export async function updateOrganizationAction(
  organizationId: string,
  input: Partial<Pick<OrganizationDto, "name" | "description" | "category" | "public_display_name" | "primary_color">> & { version: number },
): Promise<OrganizationDto> {
  const updated = await updateOrganization(organizationId, input, await authorization());
  revalidatePath("/");
  return updated;
}

export async function createAgentAction(
  organizationId: string,
  input: { name: string; description: string; documentIds?: string[] },
): Promise<AgentDto> {
  const created = await createAgent(organizationId, {
    name: input.name,
    description: input.description,
    document_ids: input.documentIds,
  }, await authorization());
  revalidatePath("/");
  return created;
}

export async function replaceAgentDocumentsAction(
  organizationId: string,
  agentId: string,
  documentIds: string[],
): Promise<void> {
  await replaceAgentDocuments(organizationId, agentId, documentIds, await authorization());
  revalidatePath("/");
}

export async function uploadDocumentsAction(formData: FormData): Promise<DocumentDto[]> {
  const organizationId = String(formData.get("organization_id") ?? "");
  if (!organizationId) throw new Error("Organization is required for document upload.");
  formData.delete("organization_id");
  const created = await uploadDocuments(organizationId, formData, await authorization());
  revalidatePath("/");
  return created;
}

export async function updateAgentAction(
  organizationId: string,
  agentId: string,
  input: Partial<Pick<AgentDto, "name" | "description" | "status" | "enabled">> & { version: number },
): Promise<AgentDto> {
  const updated = await updateAgent(organizationId, agentId, input, await authorization());
  revalidatePath("/");
  return updated;
}

export async function duplicateAgentAction(organizationId: string, agentId: string, name?: string): Promise<AgentDto> {
  const created = await duplicateAgent(organizationId, agentId, name, await authorization());
  revalidatePath("/");
  return created;
}

export async function deleteAgentAction(organizationId: string, agentId: string): Promise<void> {
  await deleteAgent(organizationId, agentId, await authorization());
  revalidatePath("/");
}

export async function loadAdminAccessAction(): Promise<AdminAccessDto> { return loadAdminAccess(await authorization()); }

export async function createAdminUserAction(input: { email: string; fullName: string; password: string; superAdmin: boolean }): Promise<AdminUserDto> {
  const user = await createAdminUser({ email: input.email, full_name: input.fullName, password: input.password, super_admin: input.superAdmin }, await authorization());
  revalidatePath("/admin"); return user;
}

export async function changeAdminPasswordAction(userId: string, password: string): Promise<AdminUserDto> {
  return updateAdminUser(userId, { password }, await authorization());
}

export async function setAdminUserActiveAction(userId: string, active: boolean): Promise<AdminUserDto> {
  return updateAdminUser(userId, { active }, await authorization());
}

export async function createAdminRoleAction(input: { name: string; description: string; scope: "PLATFORM" | "ORGANIZATION"; permissions: string[] }): Promise<string> {
  const role = await createAdminRole(input, await authorization()); revalidatePath("/admin"); return role;
}

export async function assignAdminRolesAction(input: { userId: string; organizationId?: string; roleIds: string[] }): Promise<void> {
  await assignAdminRoles({ user_id: input.userId, organization_id: input.organizationId, role_ids: input.roleIds }, await authorization());
  revalidatePath("/admin");
}
