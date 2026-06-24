"use client";

import { useState } from "react";
import {
  StaffClientManagementPanel,
  type StaffClientRecord,
} from "@/components/management/staff-client-management-panel";
import { StaffClientDetailPanel } from "@/components/views/staff-client-detail-panel";
import { staffClients, type StaffClientListItem } from "@/lib/placeholder-data";
import { useStaffSelectedClient } from "@/lib/use-staff-selected-client";

function toClientRecord(client: StaffClientListItem): StaffClientRecord {
  return {
    id: client.id,
    name: client.name,
    location: client.location,
    dateCreated: client.dateCreated,
  };
}

export function StaffDashboardView({ displayName }: { displayName: string }) {
  const { selectedId, selectedClient, selectClient } = useStaffSelectedClient();
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<StaffClientRecord | null>(null);

  const attention = staffClients.filter((c) => c.attention);
  const onTrack = staffClients.filter((c) => !c.attention);

  const openEditPanel = (client: StaffClientListItem) => {
    setEditingClient(toClientRecord(client));
    setPanelOpen(true);
  };

  const openNewClient = () => {
    setEditingClient(null);
    setPanelOpen(true);
  };

  return (
    <>
      <div className="container-fluid py-4">
        <div className="row g-4">
          <div className="col-lg-3">
            <div className="app-card staff-client-sidebar h-100 d-flex flex-column">
              <h2 className="h6 mb-1">My clients</h2>
              <p className="small text-body-secondary mb-3">
                {displayName} — 6 active engagements
              </p>
              <input
                className="form-control form-control-sm mb-4"
                placeholder="Search clients…"
                readOnly
              />

              <div className="staff-client-group-label">Needs attention</div>
              <div className="d-flex flex-column gap-2 mb-4">
                {attention.map((client) => (
                  <ClientSidebarItem
                    key={client.id}
                    client={client}
                    selected={selectedId === client.id}
                    onSelect={() => selectClient(client.id)}
                    onEdit={() => openEditPanel(client)}
                  />
                ))}
              </div>

              <div className="staff-client-group-label">On track</div>
              <div className="d-flex flex-column gap-2 flex-grow-1">
                {onTrack.map((client) => (
                  <ClientSidebarItem
                    key={client.id}
                    client={client}
                    selected={selectedId === client.id}
                    onSelect={() => selectClient(client.id)}
                    onEdit={() => openEditPanel(client)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm w-100 mt-4"
                onClick={openNewClient}
              >
                + Add client
              </button>
            </div>
          </div>

          <div className="col-lg-9">
            <StaffClientDetailPanel
              client={selectedClient}
              consultantName={displayName}
            />
          </div>
        </div>
      </div>

      <StaffClientManagementPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        client={editingClient}
      />
    </>
  );
}

function ClientSidebarItem({
  client,
  selected,
  onSelect,
  onEdit,
}: {
  client: StaffClientListItem;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={`staff-client-item${selected ? " selected" : ""}${client.attention ? " attention" : ""}`}
    >
      <button
        type="button"
        className="staff-client-item-select"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
      >
        <span className="staff-client-avatar">{client.initials}</span>
        <div className="min-w-0 text-start">
          <div className="fw-medium text-truncate">{client.name}</div>
          <div className="small text-body-secondary text-truncate">{client.meta}</div>
        </div>
        <span
          className={`staff-status-dot${client.attention ? " warning" : " ok"}`}
          aria-hidden
        />
      </button>
      <button
        type="button"
        className="btn btn-link btn-sm staff-client-edit-btn"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
      >
        Edit
      </button>
    </div>
  );
}
