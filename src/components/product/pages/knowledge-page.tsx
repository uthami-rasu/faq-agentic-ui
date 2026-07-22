"use client";

import { useState } from "react";
import { Check, ChevronDown, FileText, FileUp, Globe2, MoreHorizontal, RotateCcw, Search, Upload } from "lucide-react";
import { documents } from "../data";
import type { Notify } from "../types";
import { PageHeading } from "../shared";

export function KnowledgePage({ search, notify, embedded = false, agentName }: { search: string; notify: Notify; embedded?: boolean; agentName?: string }) {
  const [dragging, setDragging] = useState(false);
  const filtered = documents.filter((document) => (!agentName || document.agent === agentName) && `${document.name} ${document.agent}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    {!embedded && <PageHeading title="Knowledge sources" description="Manage the content your agents use to answer questions."><button className="secondary-button"><Globe2 size={16}/> Connect website</button><button className="primary-button" onClick={() => notify("File browser opened in demo mode")}><Upload size={16}/> Upload files</button></PageHeading>}
    {embedded && <div className="section-intro"><div><h2>Knowledge</h2><p>Upload and manage the documents owned by {agentName}.</p></div><button className="primary-button" onClick={() => notify("File browser opened in demo mode")}><Upload size={16}/> Upload files</button></div>}
    <button className={`drop-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); notify("Document uploaded and processing started"); }} onClick={() => notify("File browser opened in demo mode")}><span className="upload-orbit"><FileUp size={24}/></span><div><strong>Drop files here or click to upload</strong><small>PDF, TXT, or Markdown · up to 25 MB each</small></div><span className="browse-button">Browse files</span></button>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2>{embedded ? `${agentName} documents` : "All sources"}</h2><span>{filtered.length} of {embedded ? filtered.length : 44}</span></div><label><Search size={16}/><input placeholder="Search sources..." defaultValue={search}/></label>{!embedded && <button className="select-button">All agents <ChevronDown size={14}/></button>}</div><div className="data-table"><div className="table-head"><span>Name</span><span>{embedded ? "File type" : "Agent"}</span><span>Chunks</span><span>Uploaded</span><span>Status</span><span/></div>{filtered.map((document) => <div className="table-row" key={document.name}><span className="file-name"><i><FileText size={17}/></i><b>{document.name}<small>{document.size}</small></b></span><span>{embedded ? document.name.split(".").pop()?.toUpperCase() : document.agent}</span><span>{document.chunks}</span><span>{document.date}</span><span>{document.status === "Ready" ? <em className="ready"><Check size={11}/> Ready</em> : <em className="processing"><RotateCcw size={11}/> Processing</em>}</span><button className="icon-button small"><MoreHorizontal size={16}/></button></div>)}</div></section>
  </>;
}
