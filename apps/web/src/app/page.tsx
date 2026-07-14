import Link from "next/link";
import { headers } from "next/headers";
import { BrandCardHeader } from "@/components/brand-card-header";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faBuilding, faUserTie } from "@/lib/fontawesome-icons";
import {
  getPresenceBridgeId,
  readLandingPresence,
  withBridgeQuery,
} from "@/lib/auth/landing-presence";
import { readUserRole } from "@/lib/auth/roles";
import { getSurfaceDashboardLinks } from "@/lib/surface-urls";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const links = getSurfaceDashboardLinks(host, protocol);

  const bridge = await getPresenceBridgeId();
  const presence = await readLandingPresence();

  let staffName = presence.staff;
  let clientName = presence.client;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const role = readUserRole(user.app_metadata);
      const displayName =
        (user.user_metadata?.display_name as string | undefined) ??
        user.email ??
        null;
      if (role === "staff" && displayName) {
        staffName = staffName ?? displayName;
      }
      if (role === "client" && displayName) {
        clientName = clientName ?? displayName;
      }
    }
  } catch {
    // Supabase may be unset on a bare apex boot; cards still render.
  }

  const staffHref = withBridgeQuery(links.staff.href, bridge);
  const clientHref = withBridgeQuery(links.client.href, bridge);

  return (
    <div className="dev-landing d-flex align-items-center justify-content-center p-4">
      <main
        className="card shadow-sm overflow-hidden w-100"
        style={{ maxWidth: "40rem" }}
      >
        <BrandCardHeader />

        <div className="d-flex p-4 gap-2" style={{ minHeight: "12rem" }}>
          <Link
            href={staffHref}
            className="d-flex flex-column flex-fill text-decoration-none"
            style={{ flexBasis: 0, minHeight: "10rem" }}
          >
            <div
              className="d-flex flex-column align-items-center justify-content-center start-card dark gap-2"
              style={{ height: "100%" }}
            >
              <FontAwesomeIcon icon={faUserTie} className="start-card-icon" />
              <span className="fw-semibold">Staff Console</span>
              <span className="start-card-subtitle">
                {staffName ? `Signed in as ${staffName}` : "Not signed in"}
              </span>
            </div>
          </Link>

          <Link
            href={clientHref}
            className="d-flex flex-column flex-fill text-decoration-none"
            style={{ flexBasis: 0, minHeight: "10rem" }}
          >
            <div
              className="d-flex flex-column align-items-center justify-content-center start-card light gap-2"
              style={{ height: "100%" }}
            >
              <FontAwesomeIcon icon={faBuilding} className="start-card-icon" />
              <span className="fw-semibold">Client Portal</span>
              <span className="start-card-subtitle">
                {clientName ? `Signed in as ${clientName}` : "Not signed in"}
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
