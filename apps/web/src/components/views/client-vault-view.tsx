import { ClientVaultContent } from "@/components/views/client-vault-content";
import type { VaultCatalogGroup } from "@/lib/vault-catalog-types";

type ClientVaultViewProps = {
  organization: string;
  organizationLogoPath?: string | null;
  organizationLogoUpdatedAt?: string | null;
  initialGroups: VaultCatalogGroup[];
  initialHiddenGroups?: VaultCatalogGroup[];
  initialCount: number;
  initialHiddenCount?: number;
  initialVisibleCount?: number;
  initialClassificationReady?: boolean;
};

export function ClientVaultView({
  organization,
  organizationLogoPath = null,
  organizationLogoUpdatedAt = null,
  initialGroups,
  initialHiddenGroups = [],
  initialCount,
  initialHiddenCount = 0,
  initialVisibleCount,
  initialClassificationReady = true,
}: ClientVaultViewProps) {
  return (
    <ClientVaultContent
      organization={organization}
      organizationLogoPath={organizationLogoPath}
      organizationLogoUpdatedAt={organizationLogoUpdatedAt}
      initialGroups={initialGroups}
      initialHiddenGroups={initialHiddenGroups}
      initialCount={initialCount}
      initialHiddenCount={initialHiddenCount}
      initialVisibleCount={initialVisibleCount}
      initialClassificationReady={initialClassificationReady}
    />
  );
}
