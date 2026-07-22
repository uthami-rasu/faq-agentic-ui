"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Upload } from "lucide-react";
import { uploadDocumentsAction } from "@/app/actions";
import type { Notify } from "../types";
import { FileDropField } from "./file-drop-field";

type Props = { organizationId: string; agentId?: string; notify: Notify; compact?: boolean };

export function DocumentUploadPanel({ organizationId, agentId, notify, compact }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("organization_id", organizationId);
    files.forEach((file) => formData.append("files", file));
    if (agentId) formData.append("agent_ids", agentId);
    try {
      const created = await uploadDocumentsAction(formData);
      setFiles([]);
      await queryClient.invalidateQueries({ queryKey: ["document-library", organizationId] });
      await queryClient.invalidateQueries({ queryKey: ["documents", organizationId] });
      const failed = created.filter((document) => document.status === "FAILED").length;
      notify(failed ? `${failed} document upload${failed === 1 ? "" : "s"} failed` : `${created.length} document${created.length === 1 ? "" : "s"} uploaded`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Documents could not be uploaded");
    } finally {
      setUploading(false);
    }
  };
  return <div className="document-upload-panel"><FileDropField files={files} onChange={setFiles} compact={compact}/>{files.length > 0 && <button type="button" className="primary-button" disabled={uploading} onClick={upload}>{uploading ? <LoaderCircle className="spin" size={16}/> : <Upload size={16}/>} {uploading ? "Uploading…" : `Upload ${files.length} file${files.length === 1 ? "" : "s"}`}</button>}</div>;
}
