"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Info, LoaderCircle, Upload } from "lucide-react";
import { uploadDocumentsAction } from "@/app/actions";
import type { Notify } from "../types";
import { FileDropField } from "./file-drop-field";

type Props = {
  organizationId: string;
  agentId?: string;
  notify: Notify;
  compact?: boolean;
  onStagedFilesChange?: (count: number) => void;
};

export function DocumentUploadPanel({ organizationId, agentId, notify, compact, onStagedFilesChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const changeFiles = (next: File[]) => {
    setFiles(next);
    onStagedFilesChange?.(next.length);
  };
  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("organization_id", organizationId);
    files.forEach((file) => formData.append("files", file));
    if (agentId) formData.append("agent_ids", agentId);
    try {
      const created = await uploadDocumentsAction(formData);
      changeFiles([]);
      await queryClient.invalidateQueries({ queryKey: ["document-library", organizationId] });
      await queryClient.invalidateQueries({ queryKey: ["documents", organizationId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", organizationId] });
      const failed = created.filter((document) => document.status === "FAILED").length;
      notify(failed ? `${failed} document upload${failed === 1 ? "" : "s"} failed` : `${created.length} document${created.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Documents could not be uploaded");
    } finally {
      setUploading(false);
    }
  };
  return <div className={`document-upload-panel ${files.length ? "has-files" : ""}`}><FileDropField files={files} onChange={changeFiles} compact={compact} disabled={uploading} pendingLabel={uploading ? "Uploading to your library…" : "Not uploaded yet"}/>{files.length > 0 && <div className="document-upload-actions" aria-live="polite"><p><Info size={16}/><span><b>{uploading ? "Upload in progress" : "These files are staged locally"}</b><small>{uploading ? "Keep this page open until the upload finishes." : "They won’t appear in your document library until you upload them."}</small></span></p><button type="button" className="primary-button" disabled={uploading} onClick={upload}>{uploading ? <LoaderCircle className="spin" size={16}/> : <Upload size={16}/>} {uploading ? "Uploading…" : `Upload ${files.length} to library`}</button></div>}</div>;
}
