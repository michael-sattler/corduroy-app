import { ClientVaultContent } from "@/components/views/client-vault-content";
import type { VaultCatalogGroup } from "@/lib/vault-catalog-types";

type ClientVaultViewProps = {
  initialGroups: VaultCatalogGroup[];
  initialHiddenGroups?: VaultCatalogGroup[];
  initialCount: number;
  initialHiddenCount?: number;
  initialVisibleCount?: number;
  initialClassificationReady?: boolean;
};

export function ClientVaultView({
  initialGroups,
  initialHiddenGroups = [],
  initialCount,
  initialHiddenCount = 0,
  initialVisibleCount,
  initialClassificationReady = true,
}: ClientVaultViewProps) {
  return (
    <ClientVaultContent
      initialGroups={initialGroups}
      initialHiddenGroups={initialHiddenGroups}
      initialCount={initialCount}
      initialHiddenCount={initialHiddenCount}
      initialVisibleCount={initialVisibleCount}
      initialClassificationReady={initialClassificationReady}
    />
  );
}
