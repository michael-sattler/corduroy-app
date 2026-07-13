"use client";

import { useState } from "react";
import { VAULT_CATEGORIES } from "@/lib/vault-categories";
import { updateVaultClassification } from "@/lib/vault-classification-client";
import type { VaultClassificationPatch } from "@/lib/vault-classification-types";
import type { VaultCatalogObject } from "@/lib/vault-catalog-types";
import { useToast } from "@/lib/toast";

type VaultClassificationEditorProps = {
  item: VaultCatalogObject;
  clientId: string;
  onUpdated: (object: VaultCatalogObject) => void;
};

export function VaultClassificationEditor({
  item,
  clientId,
  onUpdated,
}: VaultClassificationEditorProps) {
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  async function save(patch: VaultClassificationPatch) {
    setSaving(true);

    try {
      const result = await updateVaultClassification(item.id, patch, {
        scope: "staff",
        clientId,
      });
      onUpdated(result.object);
      pushToast("Classification updated", "success");
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Could not update classification",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="vault-class-editor">
      <select
        className="form-select form-select-xs vault-class-editor-category"
        value={item.category ?? ""}
        disabled={saving}
        aria-label="Category"
        onChange={(event) => {
          const value = event.target.value;
          void save({ category: value || null });
        }}
      >
        <option value="">Category</option>
        {VAULT_CATEGORIES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      <ToggleButton
        label="Latest"
        active={item.is_latest}
        disabled={saving}
        onToggle={() => void save({ is_latest: !item.is_latest })}
      />
      <ToggleButton
        label="Ignore"
        active={item.is_ignored}
        disabled={saving}
        onToggle={() => void save({ is_ignored: !item.is_ignored })}
      />
      <ToggleButton
        label="Processed"
        active={item.is_processed}
        disabled={saving}
        onToggle={() => void save({ is_processed: !item.is_processed })}
      />
      <ToggleButton
        label="Hide"
        active={item.is_hidden}
        disabled={saving}
        onToggle={() => void save({ is_hidden: !item.is_hidden })}
      />
    </div>
  );
}

function ToggleButton({
  label,
  active,
  disabled,
  onToggle,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`btn btn-xs vault-class-editor-toggle-btn ${active ? "btn-primary" : "btn-outline-secondary"}`}
      disabled={disabled}
      onClick={onToggle}
    >
      {label}
    </button>
  );
}
