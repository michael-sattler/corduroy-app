import { PlaceholderCard } from "@/components/placeholder-card";
import { Shell } from "@/components/shell";
import { placeholderClient } from "@/lib/placeholders";

export default function ClientDashboardPage() {
  const { displayName, organization } = placeholderClient;

  return (
    <Shell surface="client" title={`Welcome, ${displayName}`}>
      <p className="-mt-4 mb-8 text-stone-600">{organization}</p>
      <div className="grid gap-6 sm:grid-cols-2">
        <PlaceholderCard
          title="The Vault"
          description="Secure storage for your business documents and data sources. Upload and browse files from one place."
        />
        <PlaceholderCard
          title="90-Day Plan"
          description="Your advisor-reviewed action plan with milestones and weekly priorities."
        />
      </div>
    </Shell>
  );
}
