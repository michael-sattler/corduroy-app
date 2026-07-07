import "server-only";

import type { ClientUserRecord } from "@/lib/admin-api-types";
import { enrichPortalUsersForAdmin } from "@/lib/admin-directory";
import { requireStaffSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  buildStaffDashboardClients,
  pickPrimaryVaultStorage,
  type StaffDashboardClient,
  type StaffManagedClient,
} from "@/lib/staff-dashboard-types";

export type {
  StaffDashboardClient,
  StaffManagedClient,
  StaffManagedClientUser,
} from "@/lib/staff-dashboard-types";

export { buildStaffDashboardClients, toStaffClientRecord } from "@/lib/staff-dashboard-types";
export { pickPrimaryVaultStorage } from "@/lib/staff-dashboard-types";

type ClientJoinRow = {
  id: string;
  name: string;
  created_at: string;
  logo_path: string | null;
  logo_updated_at: string | null;
  client_users: ClientUserRecord[] | null;
  client_vault_storage?:
    | Array<{
        bucket_name: string;
        kms_key_arn: string;
        status: string;
        purpose: string;
      }>
    | null;
};

function mapClientJoin(client: ClientJoinRow): StaffManagedClient {
  return {
    id: client.id,
    name: client.name,
    created_at: client.created_at,
    logo_path: client.logo_path ?? null,
    logo_updated_at: client.logo_updated_at ?? null,
    users: (client.client_users ?? []).map((portalUser) => ({
      id: portalUser.id,
      display_name: portalUser.display_name,
      email: "",
      avatar_path: portalUser.avatar_path ?? null,
      avatar_updated_at: portalUser.avatar_updated_at ?? null,
    })),
    vault_storage: pickPrimaryVaultStorage(client.client_vault_storage),
  };
}

async function mapAssignmentRows(
  assignments: Array<{ clients: unknown }>,
): Promise<StaffManagedClient[]> {
  const clients = await Promise.all(
    assignments.map(async (row) => {
      const clientsJoin = row.clients as ClientJoinRow | ClientJoinRow[] | null;

      const client = Array.isArray(clientsJoin) ? clientsJoin[0] : clientsJoin;

      if (!client) {
        return null;
      }

      const enrichedUsers = await enrichPortalUsersForAdmin(
        client.client_users ?? [],
      );

      return {
        ...mapClientJoin(client),
        users: enrichedUsers.map((portalUser) => ({
          id: portalUser.id,
          display_name: portalUser.display_name,
          email: portalUser.email,
          avatar_path: portalUser.avatar_path ?? null,
          avatar_updated_at: portalUser.avatar_updated_at ?? null,
        })),
      } satisfies StaffManagedClient;
    }),
  );

  return clients.filter((client): client is StaffManagedClient => client !== null);
}

function normalizeFallbackClient(clientsJoin: unknown) {
  const normalizeOne = (client: ClientJoinRow) => ({
    ...client,
    logo_path: client.logo_path ?? null,
    logo_updated_at: client.logo_updated_at ?? null,
    client_vault_storage: client.client_vault_storage ?? null,
    client_users: (client.client_users ?? []).map((user) => ({
      ...user,
      avatar_path: user.avatar_path ?? null,
      avatar_updated_at: user.avatar_updated_at ?? null,
    })),
  });

  if (Array.isArray(clientsJoin)) {
    return clientsJoin.map((client) => normalizeOne(client as ClientJoinRow));
  }

  if (clientsJoin && typeof clientsJoin === "object") {
    return normalizeOne(clientsJoin as ClientJoinRow);
  }

  return clientsJoin;
}

export async function fetchStaffAssignedClients(): Promise<StaffManagedClient[]> {
  const { user } = await requireStaffSession();
  const supabase = await createClient();

  const { data: staffRow, error: staffError } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (staffError) throw new Error(staffError.message);
  if (!staffRow) return [];

  const fullSelect =
    "clients(id, name, created_at, logo_path, logo_updated_at, client_users(id, user_id, client_id, display_name, created_at, avatar_path, avatar_updated_at), client_vault_storage(bucket_name, kms_key_arn, status, purpose))";

  const { data: assignments, error: assignmentError } = await supabase
    .from("staff_assignments")
    .select(fullSelect)
    .eq("staff_id", staffRow.id);

  if (assignmentError) {
    const { data: fallbackAssignments, error: fallbackError } = await supabase
      .from("staff_assignments")
      .select(
        "clients(id, name, created_at, client_users(id, user_id, client_id, display_name, created_at))",
      )
      .eq("staff_id", staffRow.id);

    if (!fallbackError) {
      return mapAssignmentRows(
        (fallbackAssignments ?? []).map((row) => ({
          clients: normalizeFallbackClient(row.clients),
        })),
      );
    }

    console.error(
      "Staff client directory query failed:",
      assignmentError.message,
      fallbackError.message,
    );
    return [];
  }

  return mapAssignmentRows(assignments ?? []);
}

export async function fetchStaffDashboardClients(): Promise<StaffDashboardClient[]> {
  return buildStaffDashboardClients(await fetchStaffAssignedClients());
}
