"use client";

import { useRef, useState } from "react";
import { uploadVaultFile } from "@/lib/vault-upload-client";
import type { VaultUploadResult } from "@/lib/vault-upload-types";
import { VAULT_UPLOAD_ACCEPT } from "@/lib/vault-upload-types";

type UploadPhase = "idle" | "uploading" | "success" | "error";

type VaultFileUploadProps = {
  onUploaded?: (result: VaultUploadResult) => void;
};

export function VaultFileUpload({ onUploaded }: VaultFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sourceLabel, setSourceLabel] = useState("");
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VaultUploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    setPhase("uploading");
    setError(null);
    setLastResult(null);

    try {
      const result = await uploadVaultFile(file, sourceLabel);
      setLastResult(result);
      setPhase("success");
      onUploaded?.(result);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function openPicker() {
    inputRef.current?.click();
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
    <div>
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        accept={VAULT_UPLOAD_ACCEPT}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div
        className={dropzoneClass}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
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
        <div className="vault-dropzone-icon">☁</div>
        <div className="fw-medium">
          {phase === "uploading"
            ? "Uploading to Vault…"
            : "Drop files here or click to browse"}
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
      </div>

      <div className="mb-3">
        <label className="form-label small fw-medium" htmlFor="vault-source-label">
          Source label
        </label>
        <input
          id="vault-source-label"
          className="form-control form-control-sm"
          placeholder="e.g. Q1 2026 P&L statement"
          value={sourceLabel}
          onChange={(event) => setSourceLabel(event.target.value)}
          disabled={phase === "uploading"}
        />
        <div className="form-text">
          Used in the storage path (e.g. manual-upload, quickbooks).
        </div>
      </div>

      {error ? (
        <div className="alert alert-warning py-2 small" role="alert">
          {error}
        </div>
      ) : null}

      {lastResult && phase === "success" ? (
        <div className="alert alert-success py-2 small" role="status">
          <div className="fw-medium">Uploaded to Vault</div>
          <div className="text-break">{lastResult.s3_key}</div>
          <div className="text-body-secondary">
            Audit event {lastResult.audit_event_id.slice(0, 8)}… — catalog update
            follows when processing runs.
          </div>
        </div>
      ) : null}
    </div>
  );
}
