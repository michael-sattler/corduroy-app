"use client";

import { VaultCatalogRepository } from "@/components/vault/vault-catalog-repository";
import { VaultFileUpload } from "@/components/vault/vault-file-upload";
import type {
  VaultCatalogGroup,
  VaultCatalogResponse,
} from "@/lib/vault-catalog-types";
import type { VaultUploadResult } from "@/lib/vault-upload-types";
import { useCallback, useEffect, useState } from "react";

type ClientVaultContentProps = {
  organization: string;
  initialGroups: VaultCatalogGroup[];
  initialCount: number;
};

type CatalogStatus = "idle" | "loading" | "ready" | "error";

const integrations = [
  { name: "QuickBooks", connected: true },
  { name: "Pipedrive", connected: true },
  { name: "Quotient", connected: true },
  { name: "AnswerConnect", connected: true },
  { name: "Salesforce", connected: false },
  { name: "Google Sheets", connected: false },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ClientVaultContent({
  organization,
  initialGroups,
  initialCount,
}: ClientVaultContentProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [count, setCount] = useState(initialCount);
  const [pendingS3Key, setPendingS3Key] = useState<string | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>(
    initialCount > 0 ? "ready" : "loading",
  );
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    setGroups(initialGroups);
    setCount(initialCount);
    if (initialCount > 0) {
      setCatalogStatus("ready");
      setCatalogError(null);
    }
  }, [initialCount, initialGroups]);

  const applyCatalog = useCallback((catalog: VaultCatalogResponse) => {
    setGroups(catalog.groups);
    setCount(catalog.count);
    setCatalogStatus("ready");
    setCatalogError(null);
  }, []);

  const fetchCatalog = useCallback(async (): Promise<VaultCatalogResponse> => {
    const res = await fetch("/api/client/vault/objects", {
      cache: "no-store",
    });
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
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogStatus("loading");
    setCatalogError(null);

    try {
      const catalog = await fetchCatalog();
      applyCatalog(catalog);
    } catch (error) {
      setCatalogStatus("error");
      setCatalogError(
        error instanceof Error ? error.message : "Could not load Vault catalog",
      );
    }
  }, [applyCatalog, fetchCatalog]);

  useEffect(() => {
    if (initialCount > 0) {
      return;
    }

    void refreshCatalog();
  }, [initialCount, refreshCatalog]);

  const handleUploaded = useCallback(
    async (result: VaultUploadResult) => {
      setPendingS3Key(result.s3_key);

      try {
        for (let attempt = 0; attempt < 20; attempt += 1) {
          await sleep(attempt === 0 ? 1500 : 3000);
          const catalog = await fetchCatalog();
          applyCatalog(catalog);

          if (catalog.objects.some((object) => object.s3_key === result.s3_key)) {
            return;
          }
        }
      } catch {
        // Upload succeeded; catalog polling is best-effort.
      } finally {
        setPendingS3Key(null);
      }
    },
    [applyCatalog, fetchCatalog],
  );

  return (    <div className="container-fluid py-4">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="app-card h-100">
            <h2 className="h5 mb-1">Add data source</h2>
            <p className="text-body-secondary small mb-4">
              Upload files or connect a system
            </p>

            <VaultFileUpload onUploaded={(result) => void handleUploaded(result)} />

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-medium">Category</label>
                <select className="form-select form-select-sm" defaultValue="financial" disabled>
                  <option value="financial">Financial</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-medium">Date of data</label>
                <input className="form-control form-control-sm" defaultValue="Mar 2026" readOnly />
              </div>
            </div>

            <div className="mb-3">
              <div className="small fw-medium mb-2">Connect a system</div>
              <div className="row g-2">
                {integrations.map((item) => (
                  <div key={item.name} className="col-6">
                    <div
                      className={`integration-tile${item.connected ? " connected" : ""}`}
                    >
                      <span>{item.name}</span>
                      <span className="small">
                        {item.connected ? "✓" : "+ Add"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          {catalogStatus === "error" ? (
            <div className="app-card">
              <h2 className="h5 mb-2">Data repository</h2>
              <div className="alert alert-warning py-2 small mb-3" role="alert">
                {catalogError ?? "Could not load Vault catalog."}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => void refreshCatalog()}
              >
                Retry
              </button>
            </div>
          ) : (
            <VaultCatalogRepository
              organization={organization}
              groups={groups}
              count={count}
              pendingS3Key={pendingS3Key}
              loading={catalogStatus === "loading" && count === 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}
