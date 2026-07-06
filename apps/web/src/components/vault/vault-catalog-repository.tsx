"use client";

import {
  formatVaultObjectMeta,
  vaultObjectDisplayTitle,
  vaultObjectIcon,
  vaultObjectTagClass,
  vaultObjectTagLabel,
} from "@/lib/vault-catalog";
import type { VaultCatalogGroup, VaultCatalogObject } from "@/lib/vault-catalog-types";
import { downloadVaultObject } from "@/lib/vault-download-client";
import { useState } from "react";

type VaultCatalogRepositoryProps = {
  organization: string;
  groups: VaultCatalogGroup[];
  count: number;
  pendingS3Key?: string | null;
  loading?: boolean;
};

function VaultCatalogRow({
  item,
  pending = false,
}: {
  item: VaultCatalogObject;
  pending?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);

    try {
      await downloadVaultObject(item.s3_key);
    } catch (error) {
      setDownloadError(
        error instanceof Error ? error.message : "Download failed",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className={`vault-source-row${pending ? " pending" : ""}`}>
        <input
          type="checkbox"
          className="form-check-input mt-0"
          checked
          readOnly
          aria-label={vaultObjectDisplayTitle(item)}
        />
        <span className="vault-source-icon" aria-hidden>
          {vaultObjectIcon(item.object_type)}
        </span>
        <div className="flex-grow-1 min-w-0">
          <div className="fw-medium">{vaultObjectDisplayTitle(item)}</div>
          <div className="small text-body-secondary text-break">
            {formatVaultObjectMeta(item)}
          </div>
        </div>
        <span className={`source-tag ${vaultObjectTagClass(item.object_type)}`}>
          {vaultObjectTagLabel(item)}
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => void handleDownload()}
          disabled={downloading}
          aria-label={`Download ${vaultObjectDisplayTitle(item)}`}
        >
          {downloading ? "…" : "Download"}
        </button>
      </div>
      {downloadError ? (
        <div className="small text-danger mt-1 ms-5 ps-2">{downloadError}</div>
      ) : null}
    </div>
  );
}

export function VaultCatalogRepository({
  organization,
  groups,
  count,
  pendingS3Key,
  loading = false,
}: VaultCatalogRepositoryProps) {
  const sourceCount = groups.length;
  const subtitle =
    count === 0
      ? `${organization} — no files yet`
      : `${organization} — ${count} file${count === 1 ? "" : "s"} across ${sourceCount} source${sourceCount === 1 ? "" : "s"}`;

  return (
    <div className="app-card">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <div>
          <h2 className="h5 mb-1">Data repository</h2>
          <p className="text-body-secondary small mb-0">{subtitle}</p>
        </div>
      </div>

      {pendingS3Key ? (
        <div className="alert alert-light border py-2 small my-3" role="status">
          Processing upload — catalog updates in a few seconds…
        </div>
      ) : null}

      {loading ? (
        <div className="text-body-secondary small my-4">Loading Vault catalog…</div>
      ) : count === 0 ? (
        <div className="text-body-secondary small my-4">
          Upload a file on the left to add your first Vault object. After
          processing, it appears here grouped by source.
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.source} className="mb-4 mt-4">
            <h3 className="vault-section-label">{group.label}</h3>
            <div className="d-flex flex-column gap-2">
              {group.items.map((item) => (
                <VaultCatalogRow
                  key={item.id}
                  item={item}
                  pending={item.s3_key === pendingS3Key}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
