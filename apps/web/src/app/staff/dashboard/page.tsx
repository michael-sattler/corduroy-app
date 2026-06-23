import { PlaceholderCard } from "@/components/placeholder-card";
import { Shell } from "@/components/shell";
import { placeholderStaff } from "@/lib/placeholders";

export default function StaffDashboardPage() {
  const { displayName, role } = placeholderStaff;

  return (
    <Shell surface="staff" title={`Welcome, ${displayName}`}>
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
