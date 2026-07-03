import { ClientUserMenu } from "@/components/layout/client-user-menu";
import { StaffUserMenu } from "@/components/layout/staff-user-menu";
import type { AppSurface } from "@/components/layout/nav-config";

type LoggedInUserProps = {
  surface: AppSurface;
  displayName: string;
  email?: string;
  role?: string;
  avatarPath?: string | null;
  avatarVersion?: string | null;
};

export function LoggedInUser({
  surface,
  displayName,
  email = "",
  role = "",
  avatarPath = null,
  avatarVersion = null,
}: LoggedInUserProps) {
  if (surface === "client") {
    return (
      <ClientUserMenu
        displayName={displayName}
        email={email}
        avatarPath={avatarPath}
        avatarVersion={avatarVersion}
      />
    );
  }

  return (
    <StaffUserMenu
      displayName={displayName}
      email={email}
      role={role}
      avatarPath={avatarPath}
      avatarVersion={avatarVersion}
    />
  );
}
