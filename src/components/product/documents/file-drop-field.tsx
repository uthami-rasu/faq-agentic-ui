"use client";

import { useRef, useState } from "react";
import { FileText, FileUp, X } from "lucide-react";

type Props = { files: File[]; onChange: (files: File[]) => void; compact?: boolean };
const accepted = ".pdf,.txt,.md,.markdown";

export function FileDropField({ files, onChange, compact = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const add = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    Array.from(incoming).forEach((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (["pdf", "txt", "md", "markdown"].includes(extension ?? "") && file.size <= 25 * 1024 * 1024
          && !next.some((item) => item.name === file.name && item.size === file.size)) next.push(file);
    });
    onChange(next.slice(0, 10));
  };

  return <div className={`file-drop-field ${compact ? "compact" : ""}`}>
    <button type="button" className={`drop-zone ${dragging ? "dragging" : ""}`} onClick={() => input.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); add(event.dataTransfer.files); }}><span className="upload-orbit"><FileUp size={22}/></span><div><strong>Drop files here or click to browse</strong><small>PDF, TXT, MD, or Markdown · 25 MB each · 10 files max</small></div><span className="browse-button">Browse files</span></button>
    <input ref={input} hidden type="file" multiple accept={accepted} onChange={(event) => { add(event.target.files); event.target.value = ""; }}/>
    {files.length > 0 && <div className="file-drop-queue">{files.map((file) => <span key={`${file.name}-${file.size}`}><FileText size={14}/><b>{file.name}</b><small>{formatBytes(file.size)}</small><button type="button" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((item) => item !== file))}><X size={13}/></button></span>)}</div>}
  </div>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
