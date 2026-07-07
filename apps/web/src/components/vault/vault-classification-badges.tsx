import { vaultCategoryLabel } from "@/lib/vault-categories";
import type { VaultCatalogObject } from "@/lib/vault-catalog-types";

export function VaultClassificationBadges({
  item,
}: {
  item: VaultCatalogObject;
}) {
  const badges: Array<{ key: string; label: string; className: string }> = [];

  if (item.category) {
    const categoryLabel = vaultCategoryLabel(item.category);
    if (categoryLabel) {
      badges.push({
        key: "category",
        label: categoryLabel,
        className: "vault-class-pill vault-class-pill-category",
      });
    }
  }

  if (item.is_latest) {
    badges.push({
      key: "latest",
      label: "Latest",
      className: "vault-class-pill vault-class-pill-latest",
    });
  }

  if (item.is_ignored) {
    badges.push({
      key: "ignore",
      label: "Ignore",
      className: "vault-class-pill vault-class-pill-ignore",
    });
  }

  if (item.is_processed) {
    badges.push({
      key: "processed",
      label: "Processed",
      className: "vault-class-pill vault-class-pill-processed",
    });
  }

  if (item.is_hidden) {
    badges.push({
      key: "hidden",
      label: "Hidden",
      className: "vault-class-pill vault-class-pill-hidden",
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <>
      {badges.map((badge) => (
        <span key={badge.key} className={badge.className}>
          {badge.label}
        </span>
      ))}
    </>
  );
}
