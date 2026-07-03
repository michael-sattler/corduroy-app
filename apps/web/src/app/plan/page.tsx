import { ClientLayout } from "@/components/layout";
import { ClientPlanView } from "@/components/views/client-plan-view";
import { requireClientSession } from "@/lib/auth/session";

export default async function PlanPage() {
  const { organization, displayName, user, avatarPath, avatarUpdatedAt } =
    await requireClientSession();

  return (
    <ClientLayout
      organization={organization}
      displayName={displayName}
      email={user.email ?? ""}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="plan"
    >
      <ClientPlanView />
    </ClientLayout>
  );
}
