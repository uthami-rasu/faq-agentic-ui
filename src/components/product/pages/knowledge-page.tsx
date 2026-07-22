"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, LoaderCircle, Save } from "lucide-react";
import { loadDocumentsPageAction, replaceAgentDocumentsAction } from "@/app/actions";
import type { DocumentDto, PaginatedResult } from "@/lib/api";
import type { Notify } from "../types";
import { DocumentPicker } from "../documents/document-picker";
import { DocumentUploadPanel } from "../documents/document-upload-panel";

type Props = {
  organizationId: string;
  agentId: string;
  agentName: string;
  notify: Notify;
  initialPage?: PaginatedResult<DocumentDto>;
};

export function KnowledgePage({ organizationId, agentId, agentName, notify, initialPage }: Props) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["document-library", organizationId],
    queryFn: () => loadDocumentsPageAction({ organizationId, page: 1, pageSize: 100 }),
    initialData: initialPage,
    initialDataUpdatedAt: 0,
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  });
  const assignedIds = useMemo(() => (query.data?.items ?? [])
    .filter((document) => document.assigned_agents.some((agent) => agent.id === agentId))
    .map((document) => document.id), [agentId, query.data]);
  useEffect(() => {
    if (!query.data || edited) return;
    setSelectedIds(assignedIds);
  }, [assignedIds, edited, query.data]);
  useEffect(() => { setEdited(false); }, [agentId]);
  const dirty = [...selectedIds].sort().join() !== [...assignedIds].sort().join();

  const save = async () => {
    setSaving(true);
    try {
      await replaceAgentDocumentsAction(organizationId, agentId, selectedIds);
      setEdited(false);
      await queryClient.invalidateQueries({ queryKey: ["document-library", organizationId] });
      notify(`${agentName} knowledge updated`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Knowledge could not be updated");
    } finally {
      setSaving(false);
    }
  };

  return <section className="knowledge-library-layout">
    <div className="section-intro"><div><h2>Knowledge</h2><p>Select documents from this organization for {agentName}. Files stay reusable across agents.</p></div><button className="primary-button" disabled={!dirty || saving} onClick={save}>{saving ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} {saving ? "Saving…" : "Save knowledge"}</button></div>
    <div className="knowledge-library-grid">
      <div className="panel knowledge-picker-panel"><DocumentPicker organizationId={organizationId} initialPage={initialPage} selectedIds={selectedIds} onChange={(ids) => { setSelectedIds(ids); setEdited(true); }}/></div>
      <aside className="panel knowledge-library-note"><span><BookOpen size={20}/></span><h3>Organization-owned knowledge</h3><p>Upload a document once, then assign it to any FAQ agent. Removing it from this agent does not delete the source file.</p><div><Check size={14}/> {selectedIds.length} selected for this agent</div></aside>
    </div>
    <div className="knowledge-upload"><h3>Upload and assign new documents</h3><p>New files are saved to the organization library and assigned to {agentName}.</p><DocumentUploadPanel organizationId={organizationId} agentId={agentId} notify={notify} compact/></div>
  </section>;
}
