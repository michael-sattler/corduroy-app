import { ClientUserMenu } from "@/components/layout/client-user-menu";
import { StaffUserMenu } from "@/components/layout/staff-user-menu";
import type { AppSurface } from "@/components/layout/nav-config";

type LoggedInUserProps = {
  surface: AppSurface;
  displayName: string;
  email?: string;
  role?: string;
};

export function LoggedInUser({
  surface,
  displayName,
  email = "",
  role = "",
}: LoggedInUserProps) {
  if (surface === "client") {
    return <ClientUserMenu displayName={displayName} email={email} />;
  }

  return (
    <StaffUserMenu displayName={displayName} email={email} role={role} />
  );
}
