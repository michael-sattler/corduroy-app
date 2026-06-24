import Link from "next/link";
import { headers } from "next/headers";
import { getSurfaceDashboardLinks } from "@/lib/surface-urls";

export default async function Home() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const links = getSurfaceDashboardLinks(host, protocol);

  return (
    <div className="dev-landing d-flex align-items-center justify-content-center p-4">
      <main className="card shadow-sm" style={{ maxWidth: "32rem" }}>
        <div className="card-body p-4 p-md-5">
          <p className="text-uppercase small fw-medium text-warning-emphasis mb-1">
            Corduroy Behavioral Intelligence Platform
          </p>
          <h1 className="h3 mb-3">
            {links.isLocal ? "Local development" : "Choose a portal"}
          </h1>
          <p className="text-body-secondary">
            This app serves two surfaces from one codebase. Use the client or
            staff subdomain for your environment — plain{" "}
            <code>{host.split(":")[0]}</code> shows this landing page.
          </p>
          <ul className="list-unstyled mt-4 mb-0">
            <li className="mb-2">
              <Link
                href={links.client.href}
                className="link-warning link-offset-2"
              >
                Client portal → {links.client.label}
              </Link>
            </li>
            <li>
              <Link
                href={links.staff.href}
                className="link-dark link-offset-2"
              >
                Staff console → {links.staff.label}
              </Link>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
