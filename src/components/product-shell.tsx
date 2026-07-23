"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Database, RotateCcw } from "lucide-react";
import type { InitialAppData } from "@/lib/api";
import type { ViewKey } from "@/store";
import { AppSidebar, AppTopbar } from "./product/app-chrome";
import { emptyDashboardData, useProductController } from "./product/use-product-controller";
import { apiErrorMessage } from "./product/utils";
import { DashboardPage } from "./product/pages/dashboard-page";
import { OrganizationPage } from "./product/pages/organization-page";
import { OrchestratorPage } from "./product/pages/orchestrator-page";
import { AgentsPage } from "./product/pages/agents-page";
import { AgentDetailsPage } from "./product/pages/agent-details-page";
import { SettingsPage } from "./product/pages/settings-page";
import { DocumentsPage } from "./product/pages/documents-page";
import { CreateAgentModal } from "./product/dialogs/create-agent-modal";
import { CreateOrganizationWizard } from "./product/dialogs/create-organization-wizard";
import { DeleteAgentConfirmation } from "./product/dialogs/delete-agent-confirmation";

export function ProductShell({ initialData, initialView }: { initialData?: InitialAppData; initialView?: ViewKey }) {
  const controller = useProductController(initialData, initialView);
  const {
    view, theme, sidebarOpen, search, setSearch, organizations, organizationAgents, selectedOrganization, selectedAgent,
    selectedOrganizationId, setSelectedOrganizationId, organizationSearch, setOrganizationSearch, organizationTab, setOrganizationTab,
    agentTab, setAgentTab, dashboardData, setDashboardData, showCreate, setShowCreate, showOrganizationMenu, setShowOrganizationMenu,
    showOrganizationWizard, setShowOrganizationWizard, toast, deleteConfirmation, setDeleteConfirmation, deletingAgent,
    organizationsQuery, dashboardQuery, notify, changeView, openAgent, saveOrganization, saveAgent, duplicateAgent, confirmDeleteAgent, createAgent, createOrganization,
  } = controller;

  if (!selectedOrganization) {
    const failed = organizationsQuery.isError;
    return <main className="min-h-screen bg-app-bg text-app-text grid place-items-center p-8"><section className="panel max-w-xl p-8 text-center"><span className="wizard-step-icon mx-auto"><Database size={24}/></span><h1 className="mt-4 font-display text-2xl font-bold">{failed ? "Backend connection failed" : "Loading Arffy AI"}</h1><p className="mt-2 text-sm text-app-muted">{failed ? apiErrorMessage(organizationsQuery.error) : "Loading organizations and FAQ agents from the backend…"}</p>{failed && <button className="primary-button mt-5" onClick={() => organizationsQuery.refetch()}><RotateCcw size={16}/> Retry connection</button>}</section></main>;
  }

  const currentDashboard = dashboardData[selectedOrganization.id] || emptyDashboardData;
  const currentUser = initialData?.currentUser ?? { id: "mock-user", subject: "mock-user", email: "olivia@acme.com", full_name: "Olivia Stone", super_admin: true, active: true, platform_permissions: [], organization_permissions: {} };
  const organizationPermissions = currentUser.organization_permissions[selectedOrganization.id] ?? [];
  const can = (permission: string) => currentUser.super_admin || organizationPermissions.includes(permission);
  const ssrOrganizationId = initialData?.organizations[0]?.id;
  return <div className="app-shell">
    <AppSidebar open={sidebarOpen} view={view} currentUser={currentUser} organizationPermissions={organizationPermissions} canCreateOrganization={currentUser.super_admin || currentUser.platform_permissions.includes("organization.create")} selectedOrganization={selectedOrganization} organizations={organizations} organizationAgents={organizationAgents} selectedAgent={selectedAgent} menuOpen={showOrganizationMenu} setMenuOpen={setShowOrganizationMenu} organizationSearch={organizationSearch} setOrganizationSearch={setOrganizationSearch} setSelectedOrganizationId={setSelectedOrganizationId} setOrganizationTab={setOrganizationTab} showOrganizationWizard={() => setShowOrganizationWizard(true)} changeView={changeView} notify={notify}/>
    <main className="main-area">
      <AppTopbar view={view} organization={selectedOrganization} search={search} setSearch={setSearch} theme={theme} notifications={initialData?.notifications ?? []} notify={notify} canCreateAgent={can("agent.create")} createAgent={() => setShowCreate(true)}/>
      <div className="content-wrap">
        <AnimatePresence mode="wait"><motion.div key={`${view}-${view === "organization" ? organizationTab : view === "agent" ? agentTab : ""}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: .2 }}>
          {view === "dashboard" && <DashboardPage organization={selectedOrganization} data={currentDashboard} loading={dashboardQuery.isFetching} failed={dashboardQuery.isError} retry={() => dashboardQuery.refetch()}/>}
          {view === "organization" && <OrganizationPage tab={organizationTab} setTab={setOrganizationTab} organization={selectedOrganization} agents={organizationAgents} notify={notify} updateOrganization={saveOrganization} canEdit={can("organization.edit")} canDelete={can("organization.delete")}/>}
          {view === "orchestrator" && <OrchestratorPage organizationId={selectedOrganization.id} agents={organizationAgents} organizationName={selectedOrganization.name} notify={notify} canManage={can("orchestrator.manage")} onSaved={(active) => setDashboardData((current) => ({ ...current, [selectedOrganization.id]: { ...currentDashboard, orchestrator: { active } } }))}/>}
          {view === "agents" && <AgentsPage agents={organizationAgents} organizationId={selectedOrganization.id} search={search} setSearch={setSearch} ssrPage={selectedOrganization.id === ssrOrganizationId ? initialData?.faqAgentsPage : undefined} ssrQuery={selectedOrganization.id === ssrOrganizationId ? initialData?.faqQuery : undefined} create={() => setShowCreate(true)} openAgent={openAgent} duplicateAgent={duplicateAgent} deleteAgent={(agent) => setDeleteConfirmation({ agent, returnToList: false })} notify={notify} canCreate={can("agent.create")} canEdit={can("agent.edit")} canDelete={can("agent.delete")}/>}
          {view === "agent" && selectedAgent && <AgentDetailsPage agent={selectedAgent} tab={agentTab} setTab={setAgentTab} models={initialData?.aiModels ?? []} modelCatalogAvailable={initialData?.aiModelsAvailable ?? false} initialDocuments={selectedOrganization.id === ssrOrganizationId ? initialData?.documentsPage : undefined} notify={notify} onBack={() => changeView("agents")} updateAgent={saveAgent} duplicateAgent={() => duplicateAgent(selectedAgent, true)} deleteAgent={() => setDeleteConfirmation({ agent: selectedAgent, returnToList: true })} canEdit={can("agent.edit")} canCreate={can("agent.create")} canDelete={can("agent.delete")} canAssign={can("document.assign")} canUpload={can("document.upload")}/>}
          {view === "documents" && <DocumentsPage organizationId={selectedOrganization.id} agents={organizationAgents} ssrPage={selectedOrganization.id === ssrOrganizationId ? initialData?.documentsPage : undefined} query={initialData?.documentQuery ?? { search: "", agentId: "", page: 1, pageSize: 12 }} notify={notify} canUpload={can("document.upload")}/>}
          {view === "settings" && <SettingsPage user={currentUser}/>}
        </motion.div></AnimatePresence>
      </div>
    </main>
    <AnimatePresence>{showCreate && can("agent.create") && <CreateAgentModal close={() => setShowCreate(false)} add={createAgent} organizationId={selectedOrganization.id} initialDocuments={selectedOrganization.id === ssrOrganizationId ? initialData?.documentsPage : undefined}/>}</AnimatePresence>
    <AnimatePresence>{showOrganizationWizard && (currentUser.super_admin || currentUser.platform_permissions.includes("organization.create")) && <CreateOrganizationWizard close={() => setShowOrganizationWizard(false)} complete={createOrganization}/>}</AnimatePresence>
    <AnimatePresence>{deleteConfirmation && <DeleteAgentConfirmation agent={deleteConfirmation.agent} deleting={deletingAgent} cancel={() => { if (!deletingAgent) setDeleteConfirmation(null); }} confirm={confirmDeleteAgent}/>}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><span><Check size={15}/></span>{toast}</motion.div>}</AnimatePresence>
  </div>;
}
