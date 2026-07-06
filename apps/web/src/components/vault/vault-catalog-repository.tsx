"use client";

import {
  formatVaultObjectMeta,
  vaultObjectDisplayTitle,
  vaultObjectIcon,
  vaultObjectTagClass,
  vaultObjectTagLabel,
} from "@/lib/vault-catalog";
import type { VaultCatalogGroup } from "@/lib/vault-catalog-types";

type VaultCatalogRepositoryProps = {
  organization: string;
  groups: VaultCatalogGroup[];
  count: number;
  pendingS3Key?: string | null;
  loading?: boolean;
};

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
                <div
                  key={item.id}
                  className={`vault-source-row${item.s3_key === pendingS3Key ? " pending" : ""}`}
                >
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
                  <span
                    className={`source-tag ${vaultObjectTagClass(item.object_type)}`}
                  >
                    {vaultObjectTagLabel(item)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
