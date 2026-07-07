"use client";

import { VaultCatalogRepository } from "@/components/vault/vault-catalog-repository";
import { VaultFileUpload } from "@/components/vault/vault-file-upload";
import type {
  VaultCatalogGroup,
  VaultCatalogResponse,
} from "@/lib/vault-catalog-types";
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
};

type CatalogStatus = "idle" | "loading" | "ready" | "error";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function StaffClientVaultPanel({
  clientId,
  clientName,
  vaultStorage,
}: StaffClientVaultPanelProps) {
  const vaultContext = useMemo(
    () => ({ scope: "staff" as const, clientId }),
    [clientId],
  );
  const [groups, setGroups] = useState<VaultCatalogGroup[]>([]);
  const [hiddenGroups, setHiddenGroups] = useState<VaultCatalogGroup[]>([]);
  const [count, setCount] = useState(0);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [classificationReady, setClassificationReady] = useState(true);
  const [pendingS3Key, setPendingS3Key] = useState<string | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>("loading");
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const { startProgress, stopProgress } = useAppProgress();
  const { pushToast } = useToast();

  const provisioned = vaultStorage?.status === "active";

  const applyCatalog = useCallback((catalog: VaultCatalogResponse) => {
    setGroups(catalog.groups);
    setHiddenGroups(catalog.hiddenGroups);
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
      startProgress();

      try {
        for (let attempt = 0; attempt < 20; attempt += 1) {
          await sleep(attempt === 0 ? 1500 : 3000);
          const catalog = await fetchCatalog();
          applyCatalog(catalog);

          if (catalog.objects.some((object) => object.s3_key === result.s3_key)) {
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

  return (
    <section className="staff-vault-panel mt-4 pt-4 border-top">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h3 className="h6 mb-1">Client vault</h3>
          <p className="small text-body-secondary mb-0">
            Upload and download files for {clientName}
          </p>
        </div>
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

      {!provisioned ? (
        <div className="small text-body-secondary">
          Vault storage is not active for this client yet. Provision the bucket in
          Terraform before exchanging files here.
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-5">
            <VaultFileUpload
              vaultContext={vaultContext}
              onUploaded={(result, filename) => void handleUploaded(result, filename)}
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
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
