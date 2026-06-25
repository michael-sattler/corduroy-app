import "server-only";

import type {
  ClientUserRecord,
  PortalUserListRecord,
  StaffListRecord,
  StaffRecord,
} from "@/lib/admin-api-types";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type { PortalUserListRecord, StaffListRecord } from "@/lib/admin-api-types";

function tryServiceRoleClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function enrichStaffForAdmin(
  staff: StaffRecord[],
): Promise<StaffListRecord[]> {
  const admin = tryServiceRoleClient();
  if (!admin) {
    return staff.map((member) => ({
      ...member,
      email: "",
      display_name: "",
    }));
  }

  return Promise.all(
    staff.map(async (member) => {
      const { data, error } = await admin.auth.admin.getUserById(member.user_id);
      if (error || !data.user) {
        return {
          ...member,
          email: "",
          display_name: "",
        };
      }

      return {
        ...member,
        email: data.user.email ?? "",
        display_name:
          (data.user.user_metadata?.display_name as string | undefined) ?? "",
      };
    }),
  );
}

export async function enrichPortalUsersForAdmin(
  users: ClientUserRecord[],
): Promise<PortalUserListRecord[]> {
  const admin = tryServiceRoleClient();
  if (!admin) {
    return users.map((user) => ({ ...user, email: "" }));
  }

  return Promise.all(
    users.map(async (user) => {
      const { data, error } = await admin.auth.admin.getUserById(user.user_id);
      if (error || !data.user) {
        return { ...user, email: "" };
      }

      return {
        ...user,
        email: data.user.email ?? "",
      };
    }),
  );
}
