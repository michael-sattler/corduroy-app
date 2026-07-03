import { ClientLayout } from "@/components/layout";
import { ClientVaultView } from "@/components/views/client-vault-view";
import { requireClientSession } from "@/lib/auth/session";

export default async function VaultPage() {
  const { organization, displayName, user, avatarPath, avatarUpdatedAt } =
    await requireClientSession();

  return (
    <ClientLayout
      organization={organization}
      displayName={displayName}
      email={user.email ?? ""}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="vault"
    >
      <ClientVaultView organization={organization} />
    </ClientLayout>
  );
}
