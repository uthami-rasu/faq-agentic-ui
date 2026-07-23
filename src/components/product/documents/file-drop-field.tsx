"use client";

import { useRef, useState } from "react";
import { Files, FileText, FileUp, Trash2, X } from "lucide-react";

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  compact?: boolean;
  disabled?: boolean;
  pendingLabel?: string;
};
const accepted = ".pdf,.txt,.md,.markdown,.docx";

export function FileDropField({ files, onChange, compact = false, disabled = false, pendingLabel = "Not uploaded yet" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const add = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    Array.from(incoming).forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (["pdf", "txt", "md", "markdown", "docx"].includes(extension ?? "") && file.size <= 25 * 1024 * 1024
          && !next.some((item) => item.name === file.name && item.size === file.size)) next.push(file);
    });
    onChange(next.slice(0, 10));
  };
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return <div className={`file-drop-field ${compact ? "compact" : ""} ${files.length ? "has-files" : ""}`}>
    <button type="button" disabled={disabled} className={`drop-zone ${dragging ? "dragging" : ""}`} onClick={() => input.current?.click()} onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); if (!disabled) add(event.dataTransfer.files); }}><span className="upload-orbit"><FileUp size={22}/></span><div><strong>{files.length ? "Add more files" : "Drop files here or click to browse"}</strong><small>PDF, TXT, MD, Markdown, or DOCX · 25 MB each · 10 files max</small></div><span className="browse-button">Browse files</span></button>
    <input ref={input} hidden disabled={disabled} type="file" multiple accept={accepted} onChange={(event) => { add(event.target.files); event.target.value = ""; }}/>
    {files.length > 0 && <section className="file-selection-card" aria-label="Files selected for upload">
      <header><span><i><Files size={16}/></i><span><b>{files.length} file{files.length === 1 ? "" : "s"} ready</b><small>{formatBytes(totalSize)} total · {pendingLabel}</small></span></span><button type="button" disabled={disabled} onClick={() => onChange([])}><Trash2 size={13}/> Clear</button></header>
      <div className="file-drop-queue">{files.map((file) => <span key={`${file.name}-${file.size}`}><i><FileText size={14}/></i><span><b>{file.name}</b><small>{formatBytes(file.size)}</small></span><em>Ready</em><button type="button" disabled={disabled} aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((item) => item !== file))}><X size={13}/></button></span>)}</div>
    </section>}
  </div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
