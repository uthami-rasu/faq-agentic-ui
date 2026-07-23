"use client";

import { useEffect, useRef, useState, type JSX, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, ExternalLink, FileCode2, FileText, LoaderCircle, ShieldCheck, X } from "lucide-react";
import type { DocumentDto } from "@/lib/api";

type Props = { organizationId: string; document: DocumentDto; close: () => void };
type ViewerKind = "pdf" | "markdown" | "text" | "docx";

export function DocumentViewer({ organizationId, document: selectedDocument, close }: Props) {
  const kind = viewerKind(selectedDocument);
  const baseUrl = `/api/organizations/${encodeURIComponent(organizationId)}/documents/${encodeURIComponent(selectedDocument.id)}/content`;
  const textQuery = useQuery({
    queryKey: ["document-preview", organizationId, selectedDocument.id, kind],
    queryFn: async () => {
      const response = await fetch(baseUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(await response.text() || "Preview could not be loaded.");
      return response.text();
    },
    enabled: kind === "markdown" || kind === "text",
    staleTime: 60_000,
  });
  useEffect(() => {
    const previous = documentBodyOverflow();
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKeyDown); };
  }, [close]);

  return <div className="document-viewer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="document-viewer" role="dialog" aria-modal="true" aria-label={`Preview ${selectedDocument.file_name}`}><header className="document-viewer-header"><div className="document-viewer-title"><span className="document-viewer-icon">{kind === "markdown" ? <FileCode2 size={20}/> : <FileText size={20}/>}</span><div><h2>{selectedDocument.file_name}</h2><p><span>{kind.toUpperCase()}</span>{formatBytes(selectedDocument.size_bytes)} · Private organization document</p></div></div><nav className="document-viewer-actions" aria-label="Preview actions"><a href={baseUrl} download={selectedDocument.file_name}><Download size={15}/><span>Download</span></a><button className="document-viewer-close" aria-label="Close preview" title="Close preview" onClick={close}><X size={19}/></button></nav></header><div className="document-viewer-trust"><span><ShieldCheck size={14}/><b>Secure preview</b><small>Streamed through your authenticated organization</small></span><span><kbd>ESC</kbd> to close</span></div><main className={`document-viewer-content viewer-${kind}`}>{kind === "pdf" ? <iframe src={baseUrl} title={selectedDocument.file_name}/> : kind === "docx" ? <RichDocxPreview sourceUrl={baseUrl}/> : textQuery.isLoading ? <div className="viewer-state"><LoaderCircle className="spin" size={27}/><b>Preparing preview</b><p>Loading document content…</p></div> : textQuery.isError ? <div className="viewer-state error"><ExternalLink size={26}/><b>Preview unavailable</b><p>{textQuery.error instanceof Error ? textQuery.error.message : "The document could not be opened."}</p><a href={baseUrl} download={selectedDocument.file_name}>Download original file</a></div> : kind === "markdown" ? <MarkdownPreview source={textQuery.data ?? ""}/> : <pre className="plain-text-preview">{textQuery.data}</pre>}</main></section></div>;
}

function RichDocxPreview({ sourceUrl }: { sourceUrl: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      setState("loading");
      try {
        const response = await fetch(sourceUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(await response.text() || "DOCX preview could not be loaded.");
        const data = await response.blob();
        const { renderAsync } = await import("docx-preview");
        if (cancelled || !container.current) return;
        container.current.replaceChildren();
        await renderAsync(data, container.current, undefined, {
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          useBase64URL: true,
          experimental: true,
        });
        if (!cancelled) setState("ready");
      } catch (error) {
        if (!cancelled) { setMessage(error instanceof Error ? error.message : "DOCX preview failed."); setState("error"); }
      }
    };
    void render();
    return () => { cancelled = true; };
  }, [sourceUrl]);
  return <div className="rich-docx-preview">{state === "loading" && <div className="viewer-state docx-render-state"><LoaderCircle className="spin" size={27}/><b>Rendering original DOCX</b><p>Rebuilding pages, styles, images, tables, headers, and footers…</p></div>}{state === "error" && <div className="viewer-state error docx-render-state"><ExternalLink size={26}/><b>Rich preview unavailable</b><p>{message}</p></div>}<div ref={container} className={`rich-docx-pages ${state === "ready" ? "ready" : ""}`}/></div>;
}

function viewerKind(document: DocumentDto): ViewerKind {
  const name = document.file_name.toLowerCase();
  if (name.endsWith(".pdf") || document.mime_type === "application/pdf") return "pdf";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
  if (name.endsWith(".docx")) return "docx";
  return "text";
}

function MarkdownPreview({ source }: { source: string }) {
  const output: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      while (++index < lines.length && !lines[index].startsWith("```")) code.push(lines[index]);
      output.push(<pre key={`code-${index}`}><small>{language || "code"}</small><code>{code.join("\n")}</code></pre>);
    } else if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const Heading = `h${Math.min(level, 4)}` as keyof JSX.IntrinsicElements;
      output.push(<Heading key={index}>{inlineMarkdown(line.replace(/^#{1,6}\s+/, ""))}</Heading>);
    } else if (/^[-*]\s+/.test(line)) {
      output.push(<ul key={index}><li>{inlineMarkdown(line.replace(/^[-*]\s+/, ""))}</li></ul>);
    } else if (/^\d+\.\s+/.test(line)) {
      output.push(<ol key={index}><li>{inlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li></ol>);
    } else if (line.startsWith("> ")) {
      output.push(<blockquote key={index}>{inlineMarkdown(line.slice(2))}</blockquote>);
    } else if (/^---+$/.test(line.trim())) {
      output.push(<hr key={index}/>);
    } else if (line.trim()) {
      output.push(<p key={index}>{inlineMarkdown(line)}</p>);
    }
  }
  return <article className="markdown-preview">{output.length ? output : <p>This Markdown document is empty.</p>}</article>;
}

function inlineMarkdown(value: string) {
  return value.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => part.startsWith("`") ? <code key={index}>{part.slice(1, -1)}</code> : part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}

function documentBodyOverflow() { return typeof document === "undefined" ? "" : document.body.style.overflow; }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
