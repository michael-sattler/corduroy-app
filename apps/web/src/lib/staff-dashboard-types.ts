import type { StaffClientRecord } from "@/components/management/staff-client-types";
import { formatSubmittedAt } from "@/lib/admin-api-types";

export type StaffManagedClientUser = {
  id: string;
  display_name: string;
  email: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
};

export type ClientVaultStorageSummary = {
  bucket_name: string;
  kms_key_arn: string;
  status: string;
};

type ClientVaultStorageRow = ClientVaultStorageSummary & {
  purpose: string;
};

export function pickPrimaryVaultStorage(
  rows: ClientVaultStorageRow[] | null | undefined,
): ClientVaultStorageSummary | null {
  if (!rows?.length) {
    return null;
  }

  const primary =
    rows.find((row) => row.purpose === "primary" && row.status === "active") ??
    rows.find((row) => row.purpose === "primary") ??
    rows[0];

  if (!primary) {
    return null;
  }

  return {
    bucket_name: primary.bucket_name,
    kms_key_arn: primary.kms_key_arn,
    status: primary.status,
  };
}

export type StaffManagedClient = {
  id: string;
  name: string;
  created_at: string;
  logo_path: string | null;
  logo_updated_at: string | null;
  users: StaffManagedClientUser[];
  vault_storage: ClientVaultStorageSummary | null;
};

export type StaffDashboardClient = StaffManagedClient & {
  initials: string;
  meta: string;
};

function clientInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return initials || "?";
}

function clientMeta(client: StaffManagedClient): string {
  const userCount = client.users.length;
  const usersLabel =
    userCount === 1 ? "1 portal user" : `${userCount} portal users`;

  return `${usersLabel} · Added ${formatSubmittedAt(client.created_at)}`;
}

export function buildStaffDashboardClients(
  clients: StaffManagedClient[],
): StaffDashboardClient[] {
  return clients
    .map((client) => ({
      ...client,
      initials: clientInitials(client.name),
      meta: clientMeta(client),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function toStaffClientRecord(client: StaffDashboardClient): StaffClientRecord {
  return {
    id: client.id,
    name: client.name,
    location: "",
    dateCreated: client.created_at.slice(0, 10),
    dateCreatedReadOnly: true,
    logoPath: client.logo_path,
    logoUpdatedAt: client.logo_updated_at,
    users: client.users,
  };
}
