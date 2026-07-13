"use client";

import { EditorDrawer } from "@/components/ui/editor-drawer";
import { VaultClassificationEditor } from "@/components/vault/vault-classification-editor";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import {
  formatVaultObjectMeta,
  vaultObjectDisplayTitle,
  vaultObjectIconDefinition,
  vaultObjectTagClass,
  vaultObjectTagLabel,
} from "@/lib/vault-catalog";
import type { VaultCatalogObject } from "@/lib/vault-catalog-types";
import {
  fetchVaultSourceBindings,
  updateVaultSourceBindings,
} from "@/lib/vault-source-binding-client";
import type { VaultSourceBindingOption } from "@/lib/vault-source-binding-types";
import { useToast } from "@/lib/toast";
import { useCallback, useEffect, useMemo, useState } from "react";

type VaultFilesDrawerProps = {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  objects: VaultCatalogObject[];
  onObjectUpdated: (object: VaultCatalogObject) => void;
};

type LoadStatus = "idle" | "loading" | "ready" | "error";

export function VaultFilesDrawer({
  open,
  onClose,
  clientId,
  clientName,
  objects,
  onObjectUpdated,
}: VaultFilesDrawerProps) {
  const { pushToast } = useToast();
  const [options, setOptions] = useState<VaultSourceBindingOption[]>([]);
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [hiddenOpen, setHiddenOpen] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const data = await fetchVaultSourceBindings(clientId);
      setOptions(data.options);
      setTags(data.tags);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Could not load source bindings",
      );
    }
  }, [clientId]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  const setSaving = useCallback((objectId: string, saving: boolean) => {
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (saving) {
        next.add(objectId);
      } else {
        next.delete(objectId);
      }
      return next;
    });
  }, []);

  const toggleBinding = useCallback(
    async (objectId: string, binding: string) => {
      const current = tags[objectId] ?? [];
      const next = current.includes(binding)
        ? current.filter((value) => value !== binding)
        : [...current, binding];

      setSaving(objectId, true);

      try {
        const result = await updateVaultSourceBindings(clientId, objectId, next);
        setTags((prev) => ({ ...prev, [objectId]: result.source_bindings }));
      } catch (err) {
        pushToast(
          err instanceof Error ? err.message : "Could not update source binding",
          "danger",
        );
      } finally {
        setSaving(objectId, false);
      }
    },
    [clientId, tags, setSaving, pushToast],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return objects;
    }
    return objects.filter((object) => {
      const title = vaultObjectDisplayTitle(object).toLowerCase();
      const bindings = (tags[object.id] ?? []).join(" ").toLowerCase();
      return title.includes(term) || bindings.includes(term);
    });
  }, [objects, query, tags]);

  const visibleFiles = useMemo(
    () => filtered.filter((object) => !object.is_hidden),
    [filtered],
  );
  const hiddenFiles = useMemo(
    () => filtered.filter((object) => object.is_hidden),
    [filtered],
  );

  const renderCard = (object: VaultCatalogObject) => (
    <VaultFileManageCard
      key={object.id}
      object={object}
      clientId={clientId}
      options={options}
      selected={tags[object.id] ?? []}
      saving={savingIds.has(object.id)}
      bindingsReady={status === "ready"}
      onToggleBinding={(binding) => void toggleBinding(object.id, binding)}
      onObjectUpdated={onObjectUpdated}
    />
  );

  const subtitle = `${objects.length} file${objects.length === 1 ? "" : "s"} · ${clientName}`;

  return (
    <EditorDrawer
      open={open}
      onClose={onClose}
      title="Manage vault files"
      subtitle={subtitle}
      width="46rem"
    >
      {options.length === 0 && status === "ready" ? (
        <div className="alert alert-light border small mb-3" role="status">
          This client has no active KPI source bindings yet. Add source bindings on
          the client&apos;s KPIs and they&apos;ll appear here as taggable options.
        </div>
      ) : null}

      {status === "error" ? (
        <div className="alert alert-warning small" role="alert">
          {error ?? "Could not load source bindings."}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {objects.length === 0 ? (
        <div className="vault-catalog-empty">
          No files in this client&apos;s vault yet.
        </div>
      ) : (
        <>
          <div className="vault-files-drawer-search mb-3">
            <input
              type="search"
              className="form-control form-control-sm"
              placeholder="Filter by filename or source binding…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filter vault files"
            />
          </div>

          <div className="vault-files-drawer-list">
            {visibleFiles.map((object) => renderCard(object))}

            {filtered.length === 0 ? (
              <div className="vault-catalog-empty">
                No files match &quot;{query}&quot;.
              </div>
            ) : null}
          </div>

          {hiddenFiles.length > 0 ? (
            <section className="vault-hidden-section mt-3">
              <button
                type="button"
                className="vault-hidden-toggle"
                onClick={() => setHiddenOpen((value) => !value)}
                aria-expanded={hiddenOpen}
              >
                Hidden files ({hiddenFiles.length})
              </button>
              {hiddenOpen ? (
                <div className="vault-files-drawer-list mt-2">
                  {hiddenFiles.map((object) => renderCard(object))}
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </EditorDrawer>
  );
}

function VaultFileManageCard({
  object,
  clientId,
  options,
  selected,
  saving,
  bindingsReady,
  onToggleBinding,
  onObjectUpdated,
}: {
  object: VaultCatalogObject;
  clientId: string;
  options: VaultSourceBindingOption[];
  selected: string[];
  saving: boolean;
  bindingsReady: boolean;
  onToggleBinding: (binding: string) => void;
  onObjectUpdated: (object: VaultCatalogObject) => void;
}) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div className="vault-file-manage-card">
      <div className="vault-file-manage-head">
        <span className="vault-source-icon" aria-hidden>
          <FontAwesomeIcon icon={vaultObjectIconDefinition(object.object_type)} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="vault-file-manage-title" title={vaultObjectDisplayTitle(object)}>
            {vaultObjectDisplayTitle(object)}
          </div>
          <div className="vault-source-meta">{formatVaultObjectMeta(object)}</div>
        </div>
        <span className={`source-tag ${vaultObjectTagClass(object.object_type)}`}>
          {vaultObjectTagLabel(object)}
        </span>
      </div>

      <div className="vault-file-manage-bindings">
        <div className="vault-file-manage-label">
          Source bindings
          {saving ? <span className="vault-file-manage-saving">saving…</span> : null}
        </div>
        {options.length === 0 ? (
          <span className="text-body-secondary small">
            {bindingsReady ? "No source bindings available." : "Loading…"}
          </span>
        ) : (
          <div className="vault-binding-chips">
            {options.map((option) => {
              const active = selectedSet.has(option.value);
              const title =
                option.metricLabels.length > 0
                  ? `Feeds: ${option.metricLabels.join(", ")}`
                  : undefined;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`vault-binding-chip${active ? " active" : ""}`}
                  disabled={saving}
                  aria-pressed={active}
                  title={title}
                  onClick={() => onToggleBinding(option.value)}
                >
                  {option.value}
                  {option.metricCount > 0 ? (
                    <span className="vault-binding-chip-count">
                      {option.metricCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="vault-file-manage-classify">
        <VaultClassificationEditor
          item={object}
          clientId={clientId}
          onUpdated={onObjectUpdated}
        />
      </div>
    </div>
  );
}
