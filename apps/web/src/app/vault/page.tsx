import { ClientLayout } from "@/components/layout";
import { ClientVaultView } from "@/components/views/client-vault-view";
import { requireClientSession } from "@/lib/auth/session";
import { loadVaultCatalog } from "@/lib/vault-catalog";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const { organization, displayName, user, avatarPath, avatarUpdatedAt } =
    await requireClientSession();

  const supabase = await createClient();
  await supabase.auth.getUser();
  const catalog = await loadVaultCatalog(supabase);

  return (
    <ClientLayout
      organization={organization}
      displayName={displayName}
      email={user.email ?? ""}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="vault"
    >
      <ClientVaultView
        organization={organization}
        initialGroups={catalog.groups}
        initialCount={catalog.count}
      />
    </ClientLayout>
  );
}
