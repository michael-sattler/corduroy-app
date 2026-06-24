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
      <h2 className="h6 mb-1">Platform admin</h2>
      <p className="small text-body-secondary mb-4">
        Global tools — not tied to a client engagement.
      </p>
      <ul className="admin-nav-list list-unstyled mb-0">
        {adminNavItems.map((item) => (
          <li key={item.key}>
            <Link
              href={withAppPath(item.href, pathPrefix)}
              className={`admin-nav-link${active === item.key ? " active" : ""}`}
              aria-current={active === item.key ? "page" : undefined}
            >
              <span className="fw-medium">{item.label}</span>
              <span className="small text-body-secondary d-block">
                {item.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <hr className="my-4" />
      <Link href={withAppPath("/dashboard", pathPrefix)} className="small admin-back-link">
        ← Back to client portfolio
      </Link>
    </nav>
  );
}
