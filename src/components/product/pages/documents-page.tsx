"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Eye, FileClock, FileText, Files, LoaderCircle, Search } from "lucide-react";
import { loadDocumentsPageAction } from "@/app/actions";
import type { DocumentDto, InitialAppData, PaginatedResult } from "@/lib/api";
import type { Agent } from "../types";
import type { Notify } from "../types";
import { PageHeading } from "../shared";
import { DocumentUploadPanel } from "../documents/document-upload-panel";
import { DocumentViewer } from "../documents/document-viewer";

type Props = {
  organizationId: string;
  agents: Agent[];
  ssrPage?: PaginatedResult<DocumentDto>;
  query: InitialAppData["documentQuery"];
  notify: Notify;
  canUpload: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(status: DocumentDto["status"]) {
  if (status === "READY") return <em className="ready"><Check size={11}/> Ready</em>;
  if (status === "FAILED") return <em className="failed"><AlertCircle size={11}/> Failed</em>;
  return <em className="processing"><LoaderCircle className="spin" size={11}/> Processing</em>;
}

export function DocumentsPage({ organizationId, agents, ssrPage, query, notify, canUpload }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(query.search);
  const [stagedFiles, setStagedFiles] = useState(0);
  const [previewDocument, setPreviewDocument] = useState<DocumentDto | null>(null);
  const [pending, startTransition] = useTransition();
  useEffect(() => setSearch(query.search), [query.search]);
  const documentsQuery = useQuery({
    queryKey: ["documents", organizationId, query.search, query.agentId, query.page],
    queryFn: () => loadDocumentsPageAction({ organizationId, search: query.search, agentId: query.agentId, page: query.page, pageSize: query.pageSize }),
    initialData: ssrPage,
    enabled: Boolean(organizationId),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const page = documentsQuery.data;

  const navigate = (next: { search?: string; agentId?: string; page?: number }) => {
    const params = new URLSearchParams({ view: "documents" });
    const nextSearch = next.search ?? query.search;
    const nextAgent = next.agentId ?? query.agentId;
    if (nextSearch) params.set("document_search", nextSearch);
    if (nextAgent) params.set("document_agent", nextAgent);
    if ((next.page ?? 1) > 1) params.set("document_page", String(next.page));
    startTransition(() => router.replace(`${pathname}?${params}`));
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const nextSearch = search.trim();
    if (nextSearch === query.search.trim() && query.page === 1) {
      void documentsQuery.refetch();
      return;
    }
    navigate({ search: nextSearch, page: 1 });
  };

  return <>
    <PageHeading title="Documents" description="View processing status and manage knowledge across your FAQ agents."/>
    {canUpload && <DocumentUploadPanel organizationId={organizationId} agentId={query.agentId || undefined} notify={notify} compact onStagedFilesChange={setStagedFiles}/>}
    <section className="documents-overview panel"><div><span><Files size={20}/></span><div><b>{page?.totalItems ?? 0} uploaded knowledge documents</b><p>{stagedFiles ? `${stagedFiles} file${stagedFiles === 1 ? " is" : "s are"} staged above—upload to add ${stagedFiles === 1 ? "it" : "them"} to the library.` : query.agentId ? `Filtered to ${agents.find((agent) => agent.id === query.agentId)?.name ?? "selected agent"}` : "Across all FAQ agents in this organization"}</p></div></div><span className="documents-live"><i/> Processing updates enabled</span></section>
    <section className="panel documents-panel">
      <header className="documents-toolbar"><form role="search" onSubmit={submitSearch}><Search size={17}/><input type="search" enterKeyHint="search" aria-label="Search uploaded documents" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by document name…"/><button type="submit" disabled={pending}>{pending ? "Searching…" : "Search"}</button></form><label><span>FAQ agent</span><select value={query.agentId} onChange={(event) => navigate({ agentId: event.target.value, page: 1 })}><option value="">All agents</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label></header>
      {pending || documentsQuery.isLoading ? <DocumentsShimmer/> : documentsQuery.isError ? <div className="documents-state"><AlertCircle size={25}/><h2>Documents couldn’t be loaded</h2><p>The backend is temporarily unavailable. Please try again.</p><button className="secondary-button" onClick={() => documentsQuery.refetch()}>Retry</button></div> : page?.items.length ? <div className="documents-table"><div className="documents-head"><span>Document</span><span>FAQ agents</span><span>Chunks</span><span>Updated</span><span>Status</span><span>Preview</span></div>{page.items.map((document) => <div className="documents-row" key={document.id}><span className="document-file"><i><FileText size={17}/></i><span><b>{document.file_name}</b><small>{formatBytes(document.size_bytes)} · {document.mime_type}</small></span></span><span>{document.assigned_agents.length ? document.assigned_agents.map((agent) => agent.name).join(", ") : "Organization library"}</span><span>{document.chunk_count ?? "—"}</span><time>{new Date(document.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time><span>{statusLabel(document.status)}</span><button className="document-view-button" onClick={() => setPreviewDocument(document)}><Eye size={14}/>View</button></div>)}</div> : <div className="documents-state"><FileClock size={28}/><h2>No documents found</h2><p>{query.search || query.agentId ? "Try a different search or FAQ agent." : "Documents uploaded to this organization will appear here."}</p>{(query.search || query.agentId) && <button className="secondary-button" onClick={() => { setSearch(""); navigate({ search: "", agentId: "", page: 1 }); }}>Clear filters</button>}</div>}
      {page && page.totalPages > 1 && <footer className="documents-pagination"><span>Page {page.page} of {page.totalPages} · {page.totalItems} documents</span><div><button disabled={page.page <= 1 || pending} onClick={() => navigate({ page: page.page - 1 })}><ChevronLeft size={16}/></button><button disabled={page.page >= page.totalPages || pending} onClick={() => navigate({ page: page.page + 1 })}><ChevronRight size={16}/></button></div></footer>}
    </section>
    {previewDocument && <DocumentViewer organizationId={organizationId} document={previewDocument} close={() => setPreviewDocument(null)}/>}
  </>;
}

function DocumentsShimmer() {
  return <div className="documents-table documents-shimmer" aria-label="Loading documents" aria-busy="true">{Array.from({ length: 5 }, (_, index) => <div className="documents-row" key={index}><span className="shimmer-block"/><span className="shimmer-block"/><span className="shimmer-block"/><span className="shimmer-block"/><span className="shimmer-block"/></div>)}</div>;
}
