"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAgentAction,
  configureOrchestratorAction,
  createOrganizationAction,
  deleteAgentAction,
  duplicateAgentAction,
  loadAgentsPageAction,
  loadDashboardAction,
  loadOrganizationsAction,
  updateAgentAction,
  updateOrganizationAction,
  uploadDocumentsAction,
} from "@/app/actions";
import type { InitialAppData } from "@/lib/api";
import { setTheme, setView, useAppDispatch, useAppSelector, type ViewKey } from "@/store";
import { initialAgents, initialDashboardData, initialOrganizations, useMockData } from "./data";
import type { Agent, AgentTab, DashboardBackendData, Organization, OrganizationTab } from "./types";
import { apiErrorMessage, mapAgent, mapOrganization } from "./utils";
import type { AgentForm } from "./dialogs/create-agent-modal";
import type { OrganizationSetupDraft } from "./dialogs/create-organization-wizard";

export const emptyDashboardData: DashboardBackendData = {
  agents: { total: 0, active: 0, draft: 0, archived: 0 },
  documents: { total: 0, ready: 0, processing: 0, failed: 0, chunks: 0 },
  orchestrator: { active: false },
};

export function useProductController(initialData?: InitialAppData, initialView?: ViewKey) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { view: storedView, theme, sidebarOpen } = useAppSelector((state) => state.ui);
  const [applyingInitialView, setApplyingInitialView] = useState(Boolean(initialView));
  const view = applyingInitialView && initialView ? initialView : storedView;
  const serverOrganizations = initialData?.organizations.map(mapOrganization) ?? [];
  const serverAgents = initialData?.agentsPage.items.map(mapAgent) ?? [];
  const [agents, setAgents] = useState<Agent[]>(useMockData ? initialAgents : serverAgents);
  const [organizations, setOrganizations] = useState<Organization[]>(useMockData ? initialOrganizations : serverOrganizations);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(useMockData ? initialOrganizations[0].id : serverOrganizations[0]?.id ?? "");
  const [selectedAgentId, setSelectedAgentId] = useState(useMockData ? initialAgents[0].id : serverAgents[0]?.id ?? "");
  const [search, setSearch] = useState(initialData?.faqQuery.search ?? "");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [organizationTab, setOrganizationTab] = useState<OrganizationTab>("overview");
  const [agentTab, setAgentTab] = useState<AgentTab>("overview");
  const [dashboardData, setDashboardData] = useState<Record<string, DashboardBackendData>>(
    useMockData
      ? initialDashboardData
      : initialData?.organizations[0]
        ? { [initialData.organizations[0].id]: initialData.dashboard }
        : {},
  );
  const [showCreate, setShowCreate] = useState(false);
  const [showOrganizationMenu, setShowOrganizationMenu] = useState(false);
  const [showOrganizationWizard, setShowOrganizationWizard] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ agent: Agent; returnToList: boolean } | null>(null);
  const [deletingAgent, setDeletingAgent] = useState(false);

  const organizationsQuery = useQuery({
    queryKey: ["organizations"], queryFn: () => loadOrganizationsAction(), enabled: !useMockData,
    initialData: initialData?.organizations, retry: 1, staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false, refetchOnWindowFocus: false,
  });
  const agentsQuery = useQuery({
    queryKey: ["faq-agents", selectedOrganizationId],
    queryFn: () => loadAgentsPageAction({ organizationId: selectedOrganizationId, pageSize: 100 }),
    enabled: !useMockData && Boolean(selectedOrganizationId),
    initialData: selectedOrganizationId === initialData?.organizations[0]?.id ? initialData.agentsPage : undefined,
    retry: 1, staleTime: Number.POSITIVE_INFINITY, refetchOnMount: false, refetchOnWindowFocus: false,
  });
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", selectedOrganizationId],
    queryFn: () => loadDashboardAction(selectedOrganizationId),
    enabled: !useMockData && Boolean(selectedOrganizationId),
    initialData: selectedOrganizationId === initialData?.organizations[0]?.id ? initialData.dashboard : undefined,
    retry: 1,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!initialView) return;
    dispatch(setView(initialView));
    setApplyingInitialView(false);
  }, [dispatch, initialView]);
  useEffect(() => {
    const saved = (localStorage.getItem("arffy-ai-theme") ?? localStorage.getItem("querydesk-theme")) as "light" | "dark" | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    dispatch(setTheme(saved || preferred));
  }, [dispatch]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("arffy-ai-theme", theme);
  }, [theme]);
  useEffect(() => {
    if (initialData) setSearch(initialData.faqQuery.search);
  }, [initialData?.faqQuery.search]);
  useEffect(() => {
    if (!organizationsQuery.data) return;
    const loaded = organizationsQuery.data.map(mapOrganization);
    setOrganizations(loaded);
    setSelectedOrganizationId((current) => loaded.some((organization) => organization.id === current) ? current : loaded[0]?.id ?? "");
  }, [organizationsQuery.data]);
  useEffect(() => {
    if (!agentsQuery.data || !selectedOrganizationId) return;
    const loaded = agentsQuery.data.items.map(mapAgent);
    setAgents((current) => [...current.filter((agent) => agent.organizationId !== selectedOrganizationId), ...loaded]);
    setSelectedAgentId((current) => loaded.some((agent) => agent.id === current) ? current : loaded[0]?.id ?? "");
  }, [agentsQuery.data, selectedOrganizationId]);
  useEffect(() => {
    if (!dashboardQuery.data || !selectedOrganizationId) return;
    setDashboardData((current) => ({ ...current, [selectedOrganizationId]: dashboardQuery.data }));
  }, [dashboardQuery.data, selectedOrganizationId]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };
  const changeView = (next: ViewKey) => dispatch(setView(next));
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId) || organizations[0];
  const organizationAgents = agents.filter((agent) => agent.organizationId === selectedOrganization?.id);
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) || organizationAgents[0] || agents[0];
  const openAgent = (agent: Agent, tab: AgentTab = "overview") => {
    setAgents((current) => current.some((item) => item.id === agent.id) ? current.map((item) => item.id === agent.id ? agent : item) : [agent, ...current]);
    setSelectedAgentId(agent.id); setAgentTab(tab); changeView("agent");
  };

  const saveOrganization = (updates: Partial<Organization>) => {
    if (!selectedOrganization) return;
    const previous = selectedOrganization;
    setOrganizations((current) => current.map((organization) => organization.id === previous.id ? { ...organization, ...updates } : organization));
    void updateOrganizationAction(previous.id, { ...(updates.name !== undefined ? { name: updates.name } : {}), ...(updates.description !== undefined ? { description: updates.description } : {}), ...(updates.category !== undefined ? { category: updates.category } : {}), version: previous.version })
      .then((saved) => { setOrganizations((current) => current.map((organization) => organization.id === saved.id ? mapOrganization(saved) : organization)); notify("Organization profile saved"); })
      .catch((error) => { setOrganizations((current) => current.map((organization) => organization.id === previous.id ? previous : organization)); notify(apiErrorMessage(error)); });
  };
  const saveAgent = (updates: Partial<Agent>) => {
    if (!selectedAgent) return;
    const previous = selectedAgent;
    setAgents((current) => current.map((agent) => agent.id === previous.id ? { ...agent, ...updates, updated: "Saving…" } : agent));
    void updateAgentAction(previous.organizationId, previous.id, { ...(updates.name !== undefined ? { name: updates.name } : {}), ...(updates.description !== undefined ? { description: updates.description } : {}), ...(updates.status !== undefined ? { status: updates.status === "Live" ? "ACTIVE" as const : "DRAFT" as const, enabled: updates.status === "Live" } : {}), version: previous.version })
      .then((saved) => { setAgents((current) => current.map((agent) => agent.id === saved.id ? mapAgent(saved) : agent)); void queryClient.invalidateQueries({ queryKey: ["dashboard", previous.organizationId] }); notify(`${saved.name} updated`); })
      .catch((error) => { setAgents((current) => current.map((agent) => agent.id === previous.id ? previous : agent)); notify(apiErrorMessage(error)); });
  };
  const duplicateAgent = (source: Agent, openCreated = false) => {
    void duplicateAgentAction(source.organizationId, source.id).then((created) => {
      const mapped = mapAgent(created); setAgents((current) => [mapped, ...current]);
      if (openCreated) setSelectedAgentId(mapped.id);
      void queryClient.invalidateQueries({ queryKey: ["dashboard", source.organizationId] });
      router.refresh(); notify(`${mapped.name} created as a draft`);
    }).catch((error) => notify(apiErrorMessage(error)));
  };
  const confirmDeleteAgent = () => {
    if (!deleteConfirmation || deletingAgent) return;
    const { agent: target, returnToList } = deleteConfirmation;
    setDeletingAgent(true);
    void deleteAgentAction(target.organizationId, target.id).then(() => {
      setAgents((current) => current.filter((agent) => agent.id !== target.id));
      if (selectedAgentId === target.id) setSelectedAgentId("");
      if (returnToList) changeView("agents");
      void queryClient.invalidateQueries({ queryKey: ["dashboard", target.organizationId] });
      router.refresh(); setDeleteConfirmation(null); notify(`${target.name} deleted`);
    }).catch((error) => notify(apiErrorMessage(error))).finally(() => setDeletingAgent(false));
  };
  const createAgent = async (values: AgentForm) => {
    if (!selectedOrganization) return;
    try {
      const createdDto = await createAgentAction(selectedOrganization.id, {
        name: values.name,
        description: values.description,
        documentIds: values.documentIds,
      });
      let uploadedCount = 0;
      let uploadWarning = false;
      if (values.files.length) {
        const formData = new FormData();
        formData.set("organization_id", selectedOrganization.id);
        values.files.forEach((file) => formData.append("files", file));
        formData.append("agent_ids", createdDto.id);
        try {
          const uploaded = await uploadDocumentsAction(formData);
          uploadedCount = uploaded.filter((document) => document.status !== "FAILED").length;
          uploadWarning = uploaded.some((document) => document.status === "FAILED");
        } catch {
          uploadWarning = true;
        }
      }
      const created = { ...mapAgent(createdDto), docs: new Set(values.documentIds).size + uploadedCount };
      setAgents((current) => [created, ...current]); setSelectedAgentId(created.id); setAgentTab("overview"); setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ["document-library", selectedOrganization.id] });
      await queryClient.invalidateQueries({ queryKey: ["documents", selectedOrganization.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", selectedOrganization.id] });
      notify(uploadWarning ? `${values.name} created; some files could not be uploaded` : `${values.name} created as a draft`); changeView("agent"); router.refresh();
    } catch (error) { notify(apiErrorMessage(error)); }
  };
  const createOrganization = async (organization: Omit<Organization, "id" | "version">, setup: OrganizationSetupDraft) => {
    let created: Organization;
    try {
      created = mapOrganization(await createOrganizationAction({ name: organization.name, description: organization.description, category: organization.category }));
    } catch (error) { notify(apiErrorMessage(error)); return; }
    setOrganizations((current) => [...current, created]); setSelectedOrganizationId(created.id);
    const warnings: string[] = [];
    if (setup.orchestrator) {
      try { await configureOrchestratorAction(created.id, setup.orchestrator); }
      catch { warnings.push("orchestrator setup"); }
    }
    let createdAgent: Agent | undefined;
    if (setup.agent?.name) {
      try { createdAgent = mapAgent(await createAgentAction(created.id, { ...setup.agent, documentIds: [] })); setAgents((current) => [createdAgent!, ...current]); setSelectedAgentId(createdAgent.id); }
      catch { warnings.push("first agent"); }
    }
    if (setup.files.length) {
      try {
        const formData = new FormData();
        formData.set("organization_id", created.id);
        setup.files.forEach((file) => formData.append("files", file));
        if (createdAgent) formData.append("agent_ids", createdAgent.id);
        await uploadDocumentsAction(formData);
      } catch { warnings.push("document upload"); }
    }
    setDashboardData((current) => ({ ...current, [created.id]: emptyDashboardData }));
    setShowOrganizationWizard(false); changeView("dashboard"); router.refresh();
    notify(warnings.length ? `${created.name} created; retry ${warnings.join(" and ")} from the dashboard` : `${created.name} created successfully`);
  };

  return {
    view, theme, sidebarOpen, search, setSearch, agents, organizations, organizationAgents, selectedOrganization, selectedAgent,
    selectedOrganizationId, setSelectedOrganizationId, organizationSearch, setOrganizationSearch, organizationTab, setOrganizationTab,
    agentTab, setAgentTab, dashboardData, setDashboardData, showCreate, setShowCreate, showOrganizationMenu, setShowOrganizationMenu,
    showOrganizationWizard, setShowOrganizationWizard, toast, deleteConfirmation, setDeleteConfirmation, deletingAgent,
    organizationsQuery, dashboardQuery, notify, changeView, openAgent, saveOrganization, saveAgent, duplicateAgent, confirmDeleteAgent, createAgent, createOrganization,
  };
}
