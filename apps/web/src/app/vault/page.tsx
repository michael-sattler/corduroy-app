import { ClientLayout } from "@/components/layout";
import { ClientVaultView } from "@/components/views/client-vault-view";
import { requireClientSession } from "@/lib/auth/session";

export default async function VaultPage() {
  const { organization, displayName, user } = await requireClientSession();

  return (
    <ClientLayout
      organization={organization}
      displayName={displayName}
      email={user.email ?? ""}
      active="vault"
    >
      <ClientVaultView organization={organization} />
    </ClientLayout>
  );
}
