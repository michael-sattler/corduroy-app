import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { StaffLayout } from "@/components/layout/staff-layout";
import type { AdminNavKey } from "@/components/layout/admin-nav-config";
import { getSurfacePathPrefix } from "@/lib/surface-path";

type StaffAdminShellProps = {
  displayName: string;
  email: string;
  role: string;
  active: AdminNavKey;
  children: React.ReactNode;
};

export async function StaffAdminShell({
  displayName,
  email,
  role,
  active,
  children,
}: StaffAdminShellProps) {
  const pathPrefix = await getSurfacePathPrefix();

  return (
    <StaffLayout
      displayName={displayName}
      email={email}
      role={role}
      active="admin"
      subtitle="Platform admin"
    >
      <div className="container-fluid py-4">
        <div className="row g-4">
          <div className="col-lg-3">
            <AdminSidebar active={active} pathPrefix={pathPrefix} />
          </div>
          <div className="col-lg-9">{children}</div>
        </div>
      </div>
    </StaffLayout>
  );
}
