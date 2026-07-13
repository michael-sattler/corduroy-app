import "server-only";

import type { User } from "@supabase/supabase-js";
import { readUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export class StaffApiAuthError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StaffApiAuthError";
  }
}

/**
 * Guard for staff-only API route handlers. Verifies the caller is authenticated
 * AND carries the staff role (same source of truth the middleware uses to gate
 * staff pages). Throws {@link StaffApiAuthError} with an appropriate status.
 */
export async function requireStaffApiUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new StaffApiAuthError(401, "Unauthorized");
  }

  if (readUserRole(user.app_metadata) !== "staff") {
    throw new StaffApiAuthError(403, "Staff access required");
  }

  return user;
}
