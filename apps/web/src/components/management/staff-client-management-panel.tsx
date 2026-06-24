"use client";

import { ClientAccountFields } from "@/components/management/client-account-fields";
import { ClientUsersSection } from "@/components/management/client-users-section";
import { SlidePanel } from "@/components/ui/slide-panel";

export type StaffClientRecord = {
  id: string;
  name: string;
  location: string;
  dateCreated: string;
};

type StaffClientManagementPanelProps = {
  open: boolean;
  onClose: () => void;
  client: StaffClientRecord | null;
};

export function StaffClientManagementPanel({
  open,
  onClose,
  client,
}: StaffClientManagementPanelProps) {
  const isNew = client === null;

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
      <ClientAccountFields
        name={client?.name ?? ""}
        location={client?.location ?? ""}
        dateCreated={client?.dateCreated ?? ""}
      />

      {!isNew ? (
        <>
          <hr className="my-4" />
          <ClientUsersSection />
        </>
      ) : null}

      <div className="slide-panel-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary">
          {isNew ? "Create client" : "Save changes"}
        </button>
      </div>
    </SlidePanel>
  );
}
