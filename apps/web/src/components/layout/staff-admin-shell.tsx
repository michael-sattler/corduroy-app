import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { StaffLayout } from "@/components/layout/staff-layout";
import type { AdminNavKey } from "@/components/layout/admin-nav-config";

type StaffAdminShellProps = {
  displayName: string;
  email: string;
  role: string;
  active: AdminNavKey;
  children: React.ReactNode;
};

export function StaffAdminShell({
  displayName,
  email,
  role,
  active,
  children,
}: StaffAdminShellProps) {
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
            <AdminSidebar active={active} />
          </div>
          <div className="col-lg-9">{children}</div>
        </div>
      </div>
    </StaffLayout>
  );
}
