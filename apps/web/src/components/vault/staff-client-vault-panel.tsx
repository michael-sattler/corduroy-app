"use client";

import { VaultCatalogRepository } from "@/components/vault/vault-catalog-repository";
import { VaultFileUpload } from "@/components/vault/vault-file-upload";
import { VaultFilesDrawer } from "@/components/vault/vault-files-drawer";
import { VaultAnalysisLiveLog } from "@/components/vault/vault-analysis-live-log";
import type {
  VaultCatalogGroup,
  VaultCatalogObject,
  VaultCatalogResponse,
} from "@/lib/vault-catalog-types";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faTags } from "@/lib/fontawesome-icons";
import type { VaultUploadResult } from "@/lib/vault-upload-types";
import type { ClientVaultStorageSummary } from "@/lib/staff-dashboard-types";
import { vaultObjectsPath } from "@/lib/vault-api-context";
import { useAppProgress } from "@/lib/app-progress";
import { useToast } from "@/lib/toast";
import { useCallback, useEffect, useMemo, useState } from "react";

type StaffClientVaultPanelProps = {
  clientId: string;
  clientName: string;
  vaultStorage: ClientVaultStorageSummary | null;
  layout?: "section" | "tab";
};

type CatalogStatus = "idle" | "loading" | "ready" | "error";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function StaffClientVaultPanel({
  clientId,
  clientName,
  vaultStorage,
  layout = "section",
}: StaffClientVaultPanelProps) {
  const vaultContext = useMemo(
    () => ({ scope: "staff" as const, clientId }),
    [clientId],
  );
  const [groups, setGroups] = useState<VaultCatalogGroup[]>([]);
  const [hiddenGroups, setHiddenGroups] = useState<VaultCatalogGroup[]>([]);
  const [objects, setObjects] = useState<VaultCatalogObject[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [classificationReady, setClassificationReady] = useState(true);
  const [pendingS3Key, setPendingS3Key] = useState<string | null>(null);
  const [analysisVaultObjectId, setAnalysisVaultObjectId] = useState<string | null>(
    null,
  );
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const { startProgress, stopProgress } = useAppProgress();
  const { pushToast } = useToast();

  const provisioned = vaultStorage?.status === "active";

  const applyCatalog = useCallback((catalog: VaultCatalogResponse) => {
    setGroups(catalog.groups);
    setHiddenGroups(catalog.hiddenGroups);
    setObjects(catalog.objects);
    setCount(catalog.count);
    setHiddenCount(catalog.hiddenCount);
    setVisibleCount(catalog.visibleCount);
    setClassificationReady(catalog.classificationReady);
    setCatalogStatus("ready");
    setCatalogError(null);
  }, []);

  const fetchCatalog = useCallback(async (): Promise<VaultCatalogResponse> => {
    const res = await fetch(vaultObjectsPath(vaultContext), { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as
      | VaultCatalogResponse
      | { error?: string };

    if (!res.ok) {
      throw new Error(
        "error" in body && body.error
          ? body.error
          : `Catalog refresh failed (${res.status})`,
      );
    }

    return body as VaultCatalogResponse;
  }, [vaultContext]);

  const refreshCatalog = useCallback(async () => {
    if (!provisioned) {
      return;
    }

    setCatalogStatus("loading");
    setCatalogError(null);
    startProgress();

    try {
      const catalog = await fetchCatalog();
      applyCatalog(catalog);
    } catch (error) {
      setCatalogStatus("error");
      setCatalogError(
        error instanceof Error ? error.message : "Could not load Vault catalog",
      );
    } finally {
      stopProgress();
    }
  }, [applyCatalog, fetchCatalog, provisioned, startProgress, stopProgress]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog, clientId]);

  const handleUploaded = useCallback(
    async (result: VaultUploadResult, _filename: string) => {
      setPendingS3Key(result.s3_key);
      setAnalysisVaultObjectId(null);
      startProgress();

      try {
        for (let attempt = 0; attempt < 20; attempt += 1) {
          await sleep(attempt === 0 ? 1500 : 3000);
          const catalog = await fetchCatalog();
          applyCatalog(catalog);

          const uploadedObject = catalog.objects.find(
            (object) => object.s3_key === result.s3_key,
          );
          if (uploadedObject) {
            setAnalysisVaultObjectId(uploadedObject.id);
            pushToast("File added to client Vault catalog", "success");
            return;
          }
        }

        pushToast(
          "Upload complete — catalog may take a moment to update.",
          "info",
        );
      } catch {
        pushToast(
          "Upload succeeded but catalog refresh failed.",
          "warning",
        );
      } finally {
        setPendingS3Key(null);
        stopProgress();
      }
    },
    [applyCatalog, fetchCatalog, pushToast, startProgress, stopProgress],
  );

  const handleObjectUpdated = useCallback(async () => {
    try {
      const catalog = await fetchCatalog();
      applyCatalog(catalog);
    } catch {
      pushToast("Classification saved but catalog refresh failed.", "warning");
    }
  }, [applyCatalog, fetchCatalog, pushToast]);

  const handleReprocess = useCallback(
    async (object: VaultCatalogObject) => {
      try {
        const response = await fetch("/api/staff/vault/reprocess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId, vault_object_id: object.id }),
        });
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Could not start reprocessing.");
        }
        setAnalysisVaultObjectId(object.id);
        pushToast("Document reprocessing queued", "success");
      } catch (error) {
        pushToast(
          error instanceof Error ? error.message : "Could not start reprocessing.",
          "danger",
        );
      }
    },
    [clientId, pushToast],
  );

  return (
    <section
      className={
        layout === "tab"
          ? "staff-vault-panel"
          : "staff-vault-panel mt-4 pt-4 border-top"
      }
    >
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h3 className="staff-section-heading mb-1">Client vault</h3>
          <p className="staff-dashboard-muted mb-0">
            Upload and download files for {clientName}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {provisioned ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              onClick={() => setDrawerOpen(true)}
              disabled={count === 0}
            >
              <FontAwesomeIcon icon={faTags} />
              Manage files
            </button>
          ) : null}
          {vaultStorage ? (
            <span
              className={`staff-vault-indicator small${provisioned ? " provisioned" : ""}`}
              title={
                provisioned
                  ? vaultStorage.bucket_name
                  : `Vault status: ${vaultStorage.status}`
              }
            >
              {provisioned ? "Bucket ready" : `Vault ${vaultStorage.status}`}
            </span>
          ) : (
            <span className="staff-vault-indicator small">Not provisioned</span>
          )}
        </div>
      </div>

      {!provisioned ? (
        <div className="staff-dashboard-muted">
          Vault storage is not active for this client yet. Provision the bucket in
          Terraform before exchanging files here.
        </div>
      ) : (
        <div className="row g-2">
          <div className="col-lg-5">
            <VaultFileUpload
              vaultContext={vaultContext}
              onUploaded={(result, filename) => void handleUploaded(result, filename)}
            />
            <VaultAnalysisLiveLog
              clientId={clientId}
              vaultObjectId={analysisVaultObjectId}
            />
          </div>
          <div className="col-lg-7">
            {catalogStatus === "error" ? (
              <div className="app-card p-3">
                <p className="text-body-secondary small mb-3">
                  Couldn&apos;t load the Vault catalog for this client.
                </p>
                <div className="alert alert-warning py-2 small mb-3" role="alert">
                  {catalogError ?? "Could not load Vault catalog."}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => void refreshCatalog()}
                >
                  Try again
                </button>
              </div>
            ) : (
              <VaultCatalogRepository
                groups={groups}
                hiddenGroups={hiddenGroups}
                count={count}
                visibleCount={visibleCount}
                hiddenCount={hiddenCount}
                classificationReady={classificationReady}
                pendingS3Key={pendingS3Key}
                loading={catalogStatus === "loading" && count === 0}
                vaultContext={vaultContext}
                onObjectUpdated={() => void handleObjectUpdated()}
                onReprocess={(object) => void handleReprocess(object)}
              />
            )}
          </div>
        </div>
      )}

      <VaultFilesDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        clientId={clientId}
        clientName={clientName}
        objects={objects}
        onObjectUpdated={() => void handleObjectUpdated()}
        onAnalysisStarted={setAnalysisVaultObjectId}
      />
    </section>
  );
}
