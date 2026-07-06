"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  StaffClientManagementPanel,
  type StaffClientRecord,
} from "@/components/management/staff-client-management-panel";
import { StaffClientDetailPanel } from "@/components/views/staff-client-detail-panel";
import {
  toStaffClientRecord,
  type ClientVaultStorageSummary,
  type StaffDashboardClient,
} from "@/lib/staff-dashboard-types";
import { withImageCacheBuster } from "@/lib/platform-images-client";
import { useStaffSelectedClient } from "@/lib/use-staff-selected-client";

type StaffDashboardViewProps = {
  displayName: string;
  clients: StaffDashboardClient[];
};

export function StaffDashboardView({
  displayName,
  clients,
}: StaffDashboardViewProps) {
  const router = useRouter();
  const { selectedId, selectedClient, selectClient } =
    useStaffSelectedClient(clients);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<StaffClientRecord | null>(
    null,
  );
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return clients;

    return clients.filter((client) => client.name.toLowerCase().includes(query));
  }, [clients, search]);

  useEffect(() => {
    if (clients.length === 0) {
      return;
    }

    if (!clients.some((client) => client.id === selectedId)) {
      selectClient(clients[0].id);
    }
  }, [clients, selectedId, selectClient]);

  useEffect(() => {
    if (!panelOpen || !editingClient) {
      return;
    }

    const fresh = clients.find((client) => client.id === editingClient.id);
    if (fresh) {
      setEditingClient(toStaffClientRecord(fresh));
    }
  }, [clients, panelOpen, editingClient?.id]);

  function openEditPanel(client: StaffDashboardClient) {
    setEditingClient(toStaffClientRecord(client));
    setPanelOpen(true);
  }

  function openNewClient() {
    setEditingClient(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    router.refresh();
  }

  function handleClientSaved(clientId: string) {
    selectClient(clientId);
    setPanelOpen(false);
    router.refresh();
  }

  const engagementLabel =
    clients.length === 1
      ? "1 active engagement"
      : `${clients.length} active engagements`;

  return (
    <>
      <div className="container-fluid py-4">
        <div className="row g-4">
          <div className="col-lg-3">
            <div className="app-card staff-client-sidebar h-100 d-flex flex-column">
              <h2 className="h6 mb-1">My clients</h2>
              <p className="small text-body-secondary mb-3">
                {displayName} — {engagementLabel}
              </p>
              <input
                className="form-control form-control-sm mb-4"
                placeholder="Search clients…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                disabled={clients.length === 0}
              />

              {clients.length === 0 ? (
                <div className="small text-body-secondary flex-grow-1">
                  No assigned clients yet. Create your first organization below.
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="small text-body-secondary flex-grow-1">
                  No clients match your search.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 flex-grow-1">
                  {filteredClients.map((client) => (
                    <ClientSidebarItem
                      key={client.id}
                      client={client}
                      selected={selectedId === client.id}
                      onSelect={() => selectClient(client.id)}
                      onEdit={() => openEditPanel(client)}
                    />
                  ))}
                </div>
              )}

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
        onClose={closePanel}
        client={editingClient}
        onClientSaved={handleClientSaved}
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
  client: StaffDashboardClient;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const logoSrc = withImageCacheBuster(client.logo_path, client.logo_updated_at);

  return (
    <div className={`staff-client-item${selected ? " selected" : ""}`}>
      <button
        type="button"
        className="staff-client-item-select"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
      >
        <span className="staff-client-avatar">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" />
          ) : (
            client.initials
          )}
        </span>
        <div className="min-w-0 text-start">
          <div className="fw-medium text-truncate">{client.name}</div>
          <div className="small text-body-secondary text-truncate">
            {client.meta}
          </div>
        </div>
        <ClientVaultBucketIndicator vaultStorage={client.vault_storage} />
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

function ClientVaultBucketIndicator({
  vaultStorage,
}: {
  vaultStorage: ClientVaultStorageSummary | null;
}) {
  const provisioned = vaultStorage?.status === "active";
  const title = provisioned
    ? `Vault bucket: ${vaultStorage.bucket_name}`
    : vaultStorage
      ? `Vault (${vaultStorage.status}): ${vaultStorage.bucket_name}`
      : "Vault not provisioned";

  return (
    <span
      className={`staff-vault-indicator${provisioned ? " provisioned" : ""}`}
      title={title}
      aria-label={title}
    >
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        aria-hidden
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M8 1.5 2 4v1h12V4L8 1.5ZM1 6v7.5A1.5 1.5 0 0 0 2.5 15h11A1.5 1.5 0 0 0 15 13.5V6H1Zm2 1h10v6.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7Z"
        />
      </svg>
    </span>
  );
}
