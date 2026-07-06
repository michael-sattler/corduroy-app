"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createStaffManagedClientAction,
  updateClientAction,
} from "@/app/actions/admin";
import {
  ClientAccountFields,
  STAFF_CLIENT_ACCOUNT_FORM_ID,
} from "@/components/management/client-account-fields";
import { ClientUsersSection } from "@/components/management/client-users-section";
import type { StaffClientRecord } from "@/components/management/staff-client-types";
import { SlidePanel } from "@/components/ui/slide-panel";

export type { StaffClientRecord, StaffClientUserRecord } from "@/components/management/staff-client-types";

type StaffClientManagementPanelProps = {
  open: boolean;
  onClose: () => void;
  client: StaffClientRecord | null;
  onClientSaved?: (clientId: string) => void;
};

export function StaffClientManagementPanel({
  open,
  onClose,
  client,
  onClientSaved,
}: StaffClientManagementPanelProps) {
  const router = useRouter();
  const isNew = client === null;
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountPending, startAccountTransition] = useTransition();

  function handleAccountSave(form: HTMLFormElement) {
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");

    setAccountError(null);
    startAccountTransition(async () => {
      try {
        if (isNew) {
          const created = await createStaffManagedClientAction(name);
          onClientSaved?.(created.id);
        } else {
          await updateClientAction(client.id, { name });
          onClientSaved?.(client.id);
        }
        router.refresh();
      } catch (err) {
        setAccountError(
          err instanceof Error ? err.message : "Could not save client account",
        );
      }
    });
  }

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={isNew ? "New client" : "Manage client"}
      subtitle={
        isNew
          ? "Create a client account and invite users later."
          : client.name
      }
      size="xl"
    >
      {accountError ? (
        <div className="alert alert-warning py-2 small">{accountError}</div>
      ) : null}

      <ClientAccountFields
        name={client?.name ?? ""}
        location={client?.location ?? ""}
        dateCreated={client?.dateCreated ?? ""}
        dateCreatedReadOnly={client?.dateCreatedReadOnly ?? false}
        clientId={isNew ? null : client?.id ?? null}
        logoPath={client?.logoPath ?? null}
        logoUpdatedAt={client?.logoUpdatedAt ?? null}
        pending={accountPending}
        onSave={handleAccountSave}
      />

      {!isNew && client ? (
        <>
          <hr className="my-4" />
          <ClientUsersSection clientId={client.id} users={client.users} />
        </>
      ) : null}

      <div className="slide-panel-footer">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={accountPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          form={STAFF_CLIENT_ACCOUNT_FORM_ID}
          className="btn btn-primary"
          disabled={accountPending}
        >
          {accountPending
            ? isNew
              ? "Creating…"
              : "Saving…"
            : isNew
              ? "Create client"
              : "Save changes"}
        </button>
      </div>
    </SlidePanel>
  );
}
