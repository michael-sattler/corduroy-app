"use client";

import { useRef, useState } from "react";
import { uploadAndIngestPlanJson, PlanUploadError } from "@/lib/plan-upload-client";
import type { PlanUploadResult } from "@/lib/plan-upload-types";
import type { ClientVaultStorageSummary } from "@/lib/staff-dashboard-types";
import { PLAN_UPLOAD_ACCEPT } from "@/lib/vault-upload-types";
import { useAppProgress } from "@/lib/app-progress";
import { useToast } from "@/lib/toast";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faFileLines } from "@/lib/fontawesome-icons";

type UploadPhase = "idle" | "uploading";

type StaffPlanUploadPanelProps = {
  clientId: string;
  clientName: string;
  vaultStorage: ClientVaultStorageSummary | null;
  onUploaded?: (result: PlanUploadResult) => void;
};

export function StaffPlanUploadPanel({
  clientId,
  clientName,
  vaultStorage,
  onUploaded,
}: StaffPlanUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [dragOver, setDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<PlanUploadResult | null>(null);
  const { startProgress, stopProgress } = useAppProgress();
  const { pushToast } = useToast();

  const provisioned = vaultStorage?.status === "active";

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !provisioned) {
      return;
    }

    setPhase("uploading");
    startProgress();

    try {
      const result = await uploadAndIngestPlanJson(file, clientId);
      setLastResult(result);
      pushToast(
        `Plan "${result.ingest.plan_id}" uploaded and queued for ingest`,
        "success",
      );
      onUploaded?.(result);
    } catch (error) {
      pushToast(
        error instanceof PlanUploadError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Plan upload failed",
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
    "staff-plan-dropzone",
    dragOver ? "vault-dropzone-active" : "",
    phase === "uploading" || !provisioned ? "vault-dropzone-busy" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="staff-plan-upload-panel mb-2">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h3 className="staff-section-heading mb-1">90-day plan</h3>
          <p className="staff-dashboard-muted mb-0">
            Upload a Corduroy plan JSON for {clientName}. A copy is stored in the
            vault, then elements are extracted into the client record.
          </p>
        </div>
        {!provisioned ? (
          <span className="staff-vault-indicator small">Vault required</span>
        ) : lastResult ? (
          <span className="badge staff-badge-on-track">Last: {lastResult.ingest.plan_id}</span>
        ) : null}
      </div>

      {!provisioned ? (
        <div className="staff-dashboard-muted">
          Activate vault storage for this client before uploading a plan.
        </div>
      ) : (
        <>
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
              accept={PLAN_UPLOAD_ACCEPT}
              disabled={phase === "uploading"}
              onChange={(event) => void handleFiles(event.target.files)}
            />

            <div className="vault-dropzone-icon">
              <FontAwesomeIcon icon={faFileLines} size="2x" />
            </div>
            <div className="fw-medium">
              {phase === "uploading"
                ? "Uploading plan to vault and running ingest…"
                : "Drop a plan JSON here or click to browse"}
            </div>
            <div className="small text-body-secondary">
              Corduroy 90-day plan schema · validated before upload
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
              <span className="file-pill file-pill-json">JSON</span>
            </div>
          </label>

          {lastResult ? (
            <div className="staff-dashboard-muted mt-2">
              Vault key{" "}
              <code className="user-select-all">{lastResult.vault.s3_key}</code>
              {" · "}
              {lastResult.ingest.counts.tasks} tasks,{" "}
              {lastResult.ingest.counts.milestones} milestones,{" "}
              {lastResult.ingest.counts.kpis} KPIs ingested (stub).
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
