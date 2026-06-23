import { PlaceholderCard } from "@/components/placeholder-card";
import { Shell } from "@/components/shell";
import { requireSurface } from "@/lib/require-surface";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const surface = await requireSurface();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (surface === "client") {
    const { data: profile } = await supabase
      .from("client_users")
      .select("display_name, clients(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    const displayName =
      profile?.display_name ??
      (user.user_metadata?.display_name as string | undefined) ??
      user.email ??
      "Client";
    const clientsJoin = profile?.clients as
      | { name: string }
      | { name: string }[]
      | null
      | undefined;
    const organization = Array.isArray(clientsJoin)
      ? (clientsJoin[0]?.name ?? "Your organization")
      : (clientsJoin?.name ?? "Your organization");

    return (
      <Shell surface="client" title={`Welcome, ${displayName}`} signedIn>
        <p className="text-body-secondary mb-4">{organization}</p>
        <div className="row g-4">
          <div className="col-md-6">
            <PlaceholderCard
              title="The Vault"
              description="Secure storage for your business documents and data sources. Upload and browse files from one place."
            />
          </div>
          <div className="col-md-6">
            <PlaceholderCard
              title="90-Day Plan"
              description="Your advisor-reviewed action plan with milestones and weekly priorities."
            />
          </div>
        </div>
      </Shell>
    );
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ??
    user.email ??
    "Staff";
  const role =
    staff?.role ?? (user.app_metadata?.staff_role as string) ?? "staff";

  return (
    <Shell surface="staff" title={`Welcome, ${displayName}`} signedIn>
      <p className="text-body-secondary mb-4 text-capitalize">Role: {role}</p>
      <div className="row g-4">
        <div className="col-md-6">
          <PlaceholderCard
            title="Client list"
            description="View assigned clients sorted by needs attention vs. on track."
          />
        </div>
        <div className="col-md-6">
          <PlaceholderCard
            title="Review queue"
            description="Plans and deliverables awaiting advisor review before client delivery."
          />
        </div>
      </div>
    </Shell>
  );
}
