"use client";

import {
  formatVaultObjectMeta,
  groupVaultObjectsByCategory,
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
  onReprocess?: (object: VaultCatalogObject) => void;
};

function VaultCatalogRow({
  item,
  pending = false,
  vaultContext = { scope: "client" },
  onObjectUpdated,
  onReprocess,
}: {
  item: VaultCatalogObject;
  pending?: boolean;
  vaultContext?: VaultApiContext;
  onObjectUpdated?: (object: VaultCatalogObject) => void;
  onReprocess?: (object: VaultCatalogObject) => void;
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
      <div className="vault-source-primary">
        <div className="vault-source-file">
          <div className="vault-source-file-line">
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
          </div>
          <div className="vault-source-meta">{formatVaultObjectMeta(item)}</div>
        </div>
        <button
          type="button"
          className="btn btn-xs btn-outline-secondary d-inline-flex align-items-center gap-1 vault-source-download"
          onClick={() => void handleDownload()}
          disabled={downloading || pending}
          aria-label={`Download ${vaultObjectDisplayTitle(item)}`}
        >
          <FontAwesomeIcon icon={faDownload} />
          {downloading ? "…" : "Download"}
        </button>
      </div>
      {isStaff ? (
        <div className="vault-source-actions">
          {onReprocess ? (
            <button
              type="button"
              className="btn btn-xs btn-outline-primary"
              disabled={pending}
              onClick={() => onReprocess(item)}
            >
              Reprocess
            </button>
          ) : null}
          <VaultClassificationEditor
            item={item}
            clientId={vaultContext.clientId}
            onUpdated={(object) => onObjectUpdated?.(object)}
          />
        </div>
      ) : null}
    </div>
  );
}

function VaultCatalogSections({
  groups,
  pendingS3Key,
  vaultContext,
  onObjectUpdated,
  onReprocess,
}: {
  groups: VaultCatalogGroup[];
  pendingS3Key?: string | null;
  vaultContext?: VaultApiContext;
  onObjectUpdated?: (object: VaultCatalogObject) => void;
  onReprocess?: (object: VaultCatalogObject) => void;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.source} className="vault-catalog-section">
          <h3 className="vault-section-label">{group.label}</h3>
          <div className="vault-catalog-rows">
            {group.items.map((item) => (
              <VaultCatalogRow
                key={item.id}
                item={item}
                pending={item.s3_key === pendingS3Key}
                vaultContext={vaultContext}
                onObjectUpdated={onObjectUpdated}
                onReprocess={onReprocess}
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
  onReprocess,
}: VaultCatalogRepositoryProps) {
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const categoryGroups = groupVaultObjectsByCategory(
    groups.flatMap((group) => group.items),
  );
  const hiddenCategoryGroups = groupVaultObjectsByCategory(
    hiddenGroups.flatMap((group) => group.items),
  );
  const categoryCount = categoryGroups.length;
  const visible = visibleCount ?? count - hiddenCount;

  const subtitle =
    count === 0
      ? "No files yet"
      : hiddenCount > 0
        ? `${visible} file${visible === 1 ? "" : "s"} across ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"} · ${hiddenCount} hidden`
        : `${count} file${count === 1 ? "" : "s"} across ${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`;

  const defaultEmptyMessage =
    vaultContext.scope === "staff"
      ? "No files in this client's Vault yet. Upload a file to get started."
      : "Your Vault is empty. Upload a file on the left and it will appear here after processing.";

  return (
    <div className="app-card vault-catalog">
      <div className="vault-catalog-header">
        <h2 className="vault-catalog-title">Data repository</h2>
        <p className="vault-catalog-subtitle">{subtitle}</p>
      </div>

      {pendingS3Key ? (
        <div className="alert alert-light border vault-catalog-alert" role="status">
          Finishing upload — your file will appear in the catalog shortly.
        </div>
      ) : null}

      {!classificationReady ? (
        <div className="alert alert-warning vault-catalog-alert" role="status">
          Classification is not available until the vault catalog migration is applied
          (20260706213000_vault_object_classification.sql). Staff cannot save changes yet.
        </div>
      ) : null}

      {loading ? (
        <div className="vault-catalog-empty">Loading your Vault catalog…</div>
      ) : count === 0 ? (
        <div className="vault-catalog-empty">
          {emptyMessage ?? defaultEmptyMessage}
        </div>
      ) : (
        <>
          <VaultCatalogSections
            groups={categoryGroups}
            pendingS3Key={pendingS3Key}
            vaultContext={vaultContext}
            onObjectUpdated={onObjectUpdated}
            onReprocess={onReprocess}
          />

          {hiddenCount > 0 ? (
            <section className="vault-hidden-section">
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
                  groups={hiddenCategoryGroups}
                  pendingS3Key={pendingS3Key}
                  vaultContext={vaultContext}
                  onObjectUpdated={onObjectUpdated}
                  onReprocess={onReprocess}
                />
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
