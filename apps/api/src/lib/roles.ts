export type UserRole = "client" | "staff";

export function readUserRole(
  appMetadata: Record<string, unknown> | undefined,
): UserRole | null {
  const role = appMetadata?.role;
  if (role === "client" || role === "staff") {
    return role;
  }
  return null;
}

export type AuthUser = {
  id: string;
  email: string | undefined;
  role: UserRole;
  clientId: string | null;
  staffRole: string | null;
};

export function authUserFromSupabase(user: {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
}): AuthUser | null {
  const role = readUserRole(user.app_metadata);
  if (!role) return null;

  return {
    id: user.id,
    email: user.email,
    role,
    clientId:
      role === "client"
        ? (user.app_metadata?.client_id as string | undefined) ?? null
        : null,
    staffRole:
      role === "staff"
        ? (user.app_metadata?.staff_role as string | undefined) ?? null
        : null,
  };
}
