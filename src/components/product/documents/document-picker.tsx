"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, FileText, FolderOpen, LoaderCircle, Search } from "lucide-react";
import { loadDocumentsPageAction } from "@/app/actions";
import type { DocumentDto, PaginatedResult } from "@/lib/api";

type Props = {
  organizationId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  initialPage?: PaginatedResult<DocumentDto>;
  agentId?: string;
};

export function DocumentPicker({ organizationId, selectedIds, onChange, initialPage, agentId }: Props) {
  const [search, setSearch] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const query = useQuery({
    queryKey: ["document-library", organizationId],
    queryFn: () => loadDocumentsPageAction({ organizationId, page: 1, pageSize: 100 }),
    initialData: initialPage,
    initialDataUpdatedAt: 0,
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  });
  const documents = query.data?.items ?? [];
  const linkedDocuments = useMemo(() => documents.filter((document) => selectedIds.includes(document.id)), [documents, selectedIds]);
  const availableDocuments = useMemo(() => documents.filter((document) => !selectedIds.includes(document.id)), [documents, selectedIds]);
  const visibleAvailable = useMemo(() => {
    const term = search.trim().toLowerCase();
    return availableDocuments.filter((document) => !term || document.file_name.toLowerCase().includes(term));
  }, [availableDocuments, search]);
  const toggle = (documentId: string) => onChange(selectedIds.includes(documentId)
    ? selectedIds.filter((id) => id !== documentId)
    : [...selectedIds, documentId]);

  if (agentId) return <div className="document-picker agent-document-picker">
    <div className="document-picker-title"><span><b>Linked to this agent</b><small>Only the documents listed here are available to this agent.</small></span><em>{selectedIds.length} selected</em></div>
    <div className="document-picker-list linked-document-list">
      {query.isLoading && <PickerState><LoaderCircle className="spin" size={17}/> Loading linked documents…</PickerState>}
      {query.isError && <button type="button" className="document-picker-state" onClick={() => query.refetch()}>Couldn&apos;t load documents · Retry</button>}
      {!query.isLoading && !query.isError && !linkedDocuments.length && <PickerState>No documents linked yet. Upload below or expand the organization library.</PickerState>}
      {linkedDocuments.map((document) => <DocumentRow key={document.id} document={document} selected onClick={() => toggle(document.id)} detail={document.assigned_agents.some((agent) => agent.id === agentId) ? `Linked · ${statusText(document)}` : "Will link after Save knowledge"}/>) }
    </div>
    <div className={`organization-library-disclosure ${libraryOpen ? "open" : ""}`}>
      <button type="button" className="organization-library-toggle" aria-expanded={libraryOpen} onClick={() => setLibraryOpen((open) => !open)}><span><i><FolderOpen size={17}/></i><span><b>Share from organization library</b><small>Documents from other agents are not linked by default.</small></span></span><em>{availableDocuments.length} available</em><ChevronDown size={16}/></button>
      {libraryOpen && <div className="organization-library-content"><p>Selecting a document stages an explicit link. Use <b>Save knowledge</b> to confirm.</p><label className="document-picker-search"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the organization library…"/></label><div className="document-picker-list">
        {!visibleAvailable.length && <PickerState>{search ? "No matching documents" : "No other documents are available"}</PickerState>}
        {visibleAvailable.map((document) => <DocumentRow key={document.id} document={document} selected={false} onClick={() => toggle(document.id)} detail={sharingDetail(document, agentId)}/>) }
      </div></div>}
    </div>
  </div>;

  const term = search.trim().toLowerCase();
  const visibleDocuments = documents.filter((document) => !term || document.file_name.toLowerCase().includes(term));
  return <div className="document-picker">
    <div className="document-picker-title"><span><b>Organization documents</b><small>Select documents to explicitly link them to the new agent.</small></span><em>{selectedIds.length} selected</em></div>
    <label className="document-picker-search"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents…"/></label>
    <div className="document-picker-list">
      {query.isLoading && <PickerState><LoaderCircle className="spin" size={17}/> Loading documents…</PickerState>}
      {query.isError && <button type="button" className="document-picker-state" onClick={() => query.refetch()}>Couldn&apos;t load documents · Retry</button>}
      {!query.isLoading && !query.isError && !visibleDocuments.length && <PickerState>{search ? "No matching documents" : "No organization documents yet"}</PickerState>}
      {visibleDocuments.map((document) => <DocumentRow key={document.id} document={document} selected={selectedIds.includes(document.id)} onClick={() => toggle(document.id)} detail={sharingDetail(document)}/>) }
    </div>
  </div>;
}

function DocumentRow({ document, selected, onClick, detail }: { document: DocumentDto; selected: boolean; onClick: () => void; detail: string }) {
  return <button type="button" aria-pressed={selected} className={selected ? "selected" : ""} onClick={onClick}><i><FileText size={15}/></i><span><b>{document.file_name}</b><small>{detail}</small></span><em>{selected && <Check size={13}/>}</em></button>;
}

function PickerState({ children }: { children: React.ReactNode }) {
  return <div className="document-picker-state">{children}</div>;
}

function sharingDetail(document: DocumentDto, currentAgentId?: string) {
  const otherAgents = document.assigned_agents.filter((agent) => agent.id !== currentAgentId);
  if (otherAgents.length) return `Used by ${otherAgents.map((agent) => agent.name).join(", ")}`;
  return `Organization library · ${statusText(document)}`;
}

function statusText(document: DocumentDto) {
  return document.status === "READY" ? `${document.chunk_count ?? 0} chunks · Ready` : document.status.toLowerCase();
}
