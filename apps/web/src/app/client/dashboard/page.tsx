import { PlaceholderCard } from "@/components/placeholder-card";
import { Shell } from "@/components/shell";
import { placeholderClient } from "@/lib/placeholders";

export default function ClientDashboardPage() {
  const { displayName, organization } = placeholderClient;

  return (
    <Shell surface="client" title={`Welcome, ${displayName}`}>
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
