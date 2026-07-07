"use client";

import {
  formatVaultObjectMeta,
  vaultObjectDisplayTitle,
  vaultObjectIconDefinition,
  vaultObjectTagClass,
  vaultObjectTagLabel,
} from "@/lib/vault-catalog";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faDownload } from "@/lib/fontawesome-icons";
import { VaultClassificationBadges } from "@/components/vault/vault-classification-badges";
import { VaultClassificationEditor } from "@/components/vault/vault-classification-editor";
import type { VaultCatalogGroup, VaultCatalogObject } from "@/lib/vault-catalog-types";
import { downloadVaultObject } from "@/lib/vault-download-client";
import type { VaultApiContext } from "@/lib/vault-api-context";
import { useToast } from "@/lib/toast";
import { useState } from "react";

type VaultCatalogRepositoryProps = {
  groups: VaultCatalogGroup[];
  hiddenGroups?: VaultCatalogGroup[];
  count: number;
  visibleCount?: number;
  hiddenCount?: number;
  pendingS3Key?: string | null;
  loading?: boolean;
  vaultContext?: VaultApiContext;
  emptyMessage?: string;
  classificationReady?: boolean;
  onObjectUpdated?: (object: VaultCatalogObject) => void;
};

function VaultCatalogRow({
  item,
  pending = false,
  vaultContext = { scope: "client" },
  onObjectUpdated,
}: {
  item: VaultCatalogObject;
  pending?: boolean;
  vaultContext?: VaultApiContext;
  onObjectUpdated?: (object: VaultCatalogObject) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const { pushToast } = useToast();
  const isStaff = vaultContext.scope === "staff";

  async function handleDownload() {
    setDownloading(true);

    try {
      await downloadVaultObject(item, vaultContext);
      pushToast(`Downloaded ${vaultObjectDisplayTitle(item)}`, "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Download failed",
        "danger",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={`vault-source-row-wrap${pending ? " pending" : ""}`}>
      <div className="vault-source-row">
        <span className="vault-source-icon" aria-hidden>
          <FontAwesomeIcon icon={vaultObjectIconDefinition(item.object_type)} />
        </span>
        <span
          className="vault-source-title"
          title={vaultObjectDisplayTitle(item)}
        >
          {vaultObjectDisplayTitle(item)}
        </span>
        <VaultClassificationBadges item={item} />
        <span className={`source-tag ${vaultObjectTagClass(item.object_type)}`}>
          {vaultObjectTagLabel(item)}
        </span>
        {isStaff ? (
          <VaultClassificationEditor
            item={item}
            clientId={vaultContext.clientId}
            onUpdated={(object) => onObjectUpdated?.(object)}
          />
        ) : null}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 vault-source-download"
          onClick={() => void handleDownload()}
          disabled={downloading || pending}
          aria-label={`Download ${vaultObjectDisplayTitle(item)}`}
        >
          <FontAwesomeIcon icon={faDownload} />
          {downloading ? "…" : "Download"}
        </button>
      </div>
      <div className="vault-source-meta">{formatVaultObjectMeta(item)}</div>
    </div>
  );
}

function VaultCatalogSections({
  groups,
  pendingS3Key,
  vaultContext,
  onObjectUpdated,
}: {
  groups: VaultCatalogGroup[];
  pendingS3Key?: string | null;
  vaultContext?: VaultApiContext;
  onObjectUpdated?: (object: VaultCatalogObject) => void;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.source} className="mb-4 mt-4">
          <h3 className="vault-section-label">{group.label}</h3>
          <div className="d-flex flex-column gap-2">
            {group.items.map((item) => (
              <VaultCatalogRow
                key={item.id}
                item={item}
                pending={item.s3_key === pendingS3Key}
                vaultContext={vaultContext}
                onObjectUpdated={onObjectUpdated}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export function VaultCatalogRepository({
  groups,
  hiddenGroups = [],
  count,
  visibleCount,
  hiddenCount = 0,
  pendingS3Key,
  loading = false,
  vaultContext = { scope: "client" },
  emptyMessage,
  classificationReady = true,
  onObjectUpdated,
}: VaultCatalogRepositoryProps) {
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const sourceCount = groups.length;
  const visible = visibleCount ?? count - hiddenCount;

  const subtitle =
    count === 0
      ? "No files yet"
      : hiddenCount > 0
        ? `${visible} file${visible === 1 ? "" : "s"} across ${sourceCount} source${sourceCount === 1 ? "" : "s"} · ${hiddenCount} hidden`
        : `${count} file${count === 1 ? "" : "s"} across ${sourceCount} source${sourceCount === 1 ? "" : "s"}`;

  const defaultEmptyMessage =
    vaultContext.scope === "staff"
      ? "No files in this client's Vault yet. Upload a file to get started."
      : "Your Vault is empty. Upload a file on the left and it will appear here after processing.";

  return (
    <div className="app-card vault-catalog">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <div>
          <h2 className="h5 mb-1">Data repository</h2>
          <p className="text-body-secondary small mb-0">{subtitle}</p>
        </div>
      </div>

      {pendingS3Key ? (
        <div className="alert alert-light border py-2 small my-3" role="status">
          Finishing upload — your file will appear in the catalog shortly.
        </div>
      ) : null}

      {!classificationReady ? (
        <div className="alert alert-warning py-2 small my-3" role="status">
          Classification is not available until the vault catalog migration is applied
          (20260706213000_vault_object_classification.sql). Staff cannot save changes yet.
        </div>
      ) : null}

      {loading ? (
        <div className="text-body-secondary small my-4">Loading your Vault catalog…</div>
      ) : count === 0 ? (
        <div className="text-body-secondary small my-4">
          {emptyMessage ?? defaultEmptyMessage}
        </div>
      ) : (
        <>
          <VaultCatalogSections
            groups={groups}
            pendingS3Key={pendingS3Key}
            vaultContext={vaultContext}
            onObjectUpdated={onObjectUpdated}
          />

          {hiddenCount > 0 ? (
            <section className="vault-hidden-section mt-4">
              <button
                type="button"
                className="vault-hidden-toggle"
                onClick={() => setHiddenOpen((value) => !value)}
                aria-expanded={hiddenOpen}
              >
                Hidden files ({hiddenCount})
              </button>
              {hiddenOpen ? (
                <VaultCatalogSections
                  groups={hiddenGroups}
                  pendingS3Key={pendingS3Key}
                  vaultContext={vaultContext}
                  onObjectUpdated={onObjectUpdated}
                />
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
