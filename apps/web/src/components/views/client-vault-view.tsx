import { ClientVaultContent } from "@/components/views/client-vault-content";
import type { VaultCatalogGroup } from "@/lib/vault-catalog-types";

type ClientVaultViewProps = {
  organization: string;
  initialGroups: VaultCatalogGroup[];
  initialCount: number;
};

export function ClientVaultView({
  organization,
  initialGroups,
  initialCount,
}: ClientVaultViewProps) {
  return (
    <ClientVaultContent
      organization={organization}
      initialGroups={initialGroups}
      initialCount={initialCount}
    />
  );
}
