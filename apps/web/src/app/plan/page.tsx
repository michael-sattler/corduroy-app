import { ClientLayout } from "@/components/layout";
import { ClientPlanShell } from "@/components/views/client-plan-shell";
import { requireClientSession } from "@/lib/auth/session";
import { getMessagingContact } from "@/lib/messaging/messaging-contact";

const CORDUROY_CONTACT_USER_ID = "54cc7c22-7263-4935-9357-5a288b7285ca";

export default async function PlanPage() {
  const {
    organization,
    displayName,
    user,
    avatarPath,
    avatarUpdatedAt,
    organizationLogoPath,
    organizationLogoUpdatedAt,
  } = await requireClientSession();

  const messagingContact = await getMessagingContact(CORDUROY_CONTACT_USER_ID);

  return (
    <ClientLayout
      organization={organization}
      displayName={displayName}
      email={user.email ?? ""}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      orgLogoPath={organizationLogoPath}
      orgLogoVersion={organizationLogoUpdatedAt}
      active="plan"
    >
      <ClientPlanShell messagingContact={messagingContact} />
    </ClientLayout>
  );
}
