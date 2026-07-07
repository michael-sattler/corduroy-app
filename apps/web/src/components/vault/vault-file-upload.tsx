"use client";

import { useRef, useState } from "react";
import { useAppProgress } from "@/lib/app-progress";
import { useToast } from "@/lib/toast";
import { uploadVaultFile } from "@/lib/vault-upload-client";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faCloudArrowUp } from "@/lib/fontawesome-icons";
import type { VaultApiContext } from "@/lib/vault-api-context";
import type { VaultUploadResult } from "@/lib/vault-upload-types";
import {
  VAULT_UPLOAD_ACCEPT,
  vaultSourceFromFilename,
} from "@/lib/vault-upload-types";

type UploadPhase = "idle" | "uploading";

type VaultFileUploadProps = {
  onUploaded?: (result: VaultUploadResult, filename: string) => void;
  vaultContext?: VaultApiContext;
};

export function VaultFileUpload({
  onUploaded,
  vaultContext = { scope: "client" },
}: VaultFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const { startProgress, stopProgress } = useAppProgress();
  const { pushToast } = useToast();

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    const source = vaultSourceFromFilename(file.name);

    setPhase("uploading");
    startProgress();

    try {
      const result = await uploadVaultFile(file, source, vaultContext);
      pushToast(`${file.name} uploaded to Vault`, "success");
      onUploaded?.(result, file.name);
    } catch (err) {
      pushToast(
        err instanceof Error ? err.message : "Upload failed",
        "danger",
      );
    } finally {
      setPhase("idle");
      stopProgress();
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  const dropzoneClass = [
    "vault-dropzone",
    "mb-4",
    dragOver ? "vault-dropzone-active" : "",
    phase === "uploading" ? "vault-dropzone-busy" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label
      className={dropzoneClass}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="vault-file-input"
        accept={VAULT_UPLOAD_ACCEPT}
        disabled={phase === "uploading"}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="vault-dropzone-icon">
        <FontAwesomeIcon icon={faCloudArrowUp} size="2x" />
      </div>
      <div className="fw-medium">
        {phase === "uploading"
          ? "Uploading to Vault…"
          : "Drop a file here or click to browse"}
      </div>
      <div className="small text-body-secondary">
        Financials, proposals, contracts, reports
      </div>
      <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
        <span className="file-pill file-pill-pdf">PDF</span>
        <span className="file-pill file-pill-xlsx">XLSX</span>
        <span className="file-pill file-pill-docx">DOCX</span>
        <span className="file-pill file-pill-csv">CSV</span>
      </div>
    </label>
  );
}
