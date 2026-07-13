import { StaffPlanUploadPanel } from "@/components/plan/staff-plan-upload-panel";
import { StaffClientVaultPanel } from "@/components/vault/staff-client-vault-panel";
import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";

type StaffClientPlanAdminTabProps = {
  client: StaffDashboardClient;
};

export function StaffClientPlanAdminTab({ client }: StaffClientPlanAdminTabProps) {
  return (
    <>
      <StaffPlanUploadPanel
        clientId={client.id}
        clientName={client.name}
        vaultStorage={client.vault_storage}
      />

      <StaffClientVaultPanel
        clientId={client.id}
        clientName={client.name}
        vaultStorage={client.vault_storage}
        layout="tab"
      />
    </>
  );
}
