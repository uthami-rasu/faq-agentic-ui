"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, FileText, LoaderCircle, Search } from "lucide-react";
import { loadDocumentsPageAction } from "@/app/actions";
import type { DocumentDto, PaginatedResult } from "@/lib/api";

type Props = {
  organizationId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  initialPage?: PaginatedResult<DocumentDto>;
};

export function DocumentPicker({ organizationId, selectedIds, onChange, initialPage }: Props) {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["document-library", organizationId],
    queryFn: () => loadDocumentsPageAction({ organizationId, page: 1, pageSize: 100 }),
    initialData: initialPage,
    initialDataUpdatedAt: 0,
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  });
  const documents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data?.items ?? []).filter((document) => !term || document.file_name.toLowerCase().includes(term));
  }, [query.data, search]);
  const toggle = (documentId: string) => onChange(selectedIds.includes(documentId)
    ? selectedIds.filter((id) => id !== documentId)
    : [...selectedIds, documentId]);

  return <div className="document-picker">
    <div className="document-picker-title"><span><b>Organization documents</b><small>Select any existing knowledge. A document can be shared by multiple agents.</small></span><em>{selectedIds.length} selected</em></div>
    <label className="document-picker-search"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents…"/></label>
    <div className="document-picker-list">
      {query.isLoading && <div className="document-picker-state"><LoaderCircle className="spin" size={17}/> Loading documents…</div>}
      {query.isError && <button type="button" className="document-picker-state" onClick={() => query.refetch()}>Couldn&apos;t load documents · Retry</button>}
      {!query.isLoading && !query.isError && !documents.length && <div className="document-picker-state">{search ? "No matching documents" : "No organization documents yet"}</div>}
      {documents.map((document) => {
        const checked = selectedIds.includes(document.id);
        return <button type="button" key={document.id} className={checked ? "selected" : ""} onClick={() => toggle(document.id)}><i><FileText size={15}/></i><span><b>{document.file_name}</b><small>{document.status === "READY" ? `${document.chunk_count ?? 0} chunks · Ready` : document.status.toLowerCase()}</small></span><em>{checked && <Check size={13}/>}</em></button>;
      })}
    </div>
  </div>;
}
