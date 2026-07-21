import Link from "next/link";
import { adminNavItems, type AdminNavKey } from "@/components/layout/admin-nav-config";
import { withAppPath } from "@/lib/path-routing";

type AdminSidebarProps = {
  active: AdminNavKey;
  pathPrefix: string;
};

export function AdminSidebar({ active, pathPrefix }: AdminSidebarProps) {
  return (
    <nav className="admin-sidebar app-card h-100" aria-label="Admin tools">
      <h2 className="admin-sidebar-title">Platform admin</h2>
      <ul className="admin-nav-list list-unstyled mb-0">
        {adminNavItems.map((item) => (
          <li key={item.key}>
            <Link
              href={withAppPath(item.href, pathPrefix)}
              className={`admin-nav-link${active === item.key ? " active" : ""}`}
              aria-current={active === item.key ? "page" : undefined}
            >
              <span className="fw-medium">{item.label}</span>
              <span className="admin-nav-description text-body-secondary">
                {item.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <hr className="my-2" />
      <Link href={withAppPath("/dashboard", pathPrefix)} className="small admin-back-link">
        ← Back to clients
      </Link>
    </nav>
  );
}
