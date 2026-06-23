export type UserRole = "client" | "staff";

export function roleForSurface(surface: "client" | "staff"): UserRole {
  return surface;
}

export function readUserRole(
  appMetadata: Record<string, unknown> | undefined,
): UserRole | null {
  const role = appMetadata?.role;
  if (role === "client" || role === "staff") {
    return role;
  }
  return null;
}

const STAFF_EMAIL_DOMAIN = "@corduroytech.ai";

export function isStaffEmail(email: string): boolean {
  return email.toLowerCase().endsWith(STAFF_EMAIL_DOMAIN);
}
