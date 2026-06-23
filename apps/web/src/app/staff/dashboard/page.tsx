import { PlaceholderCard } from "@/components/placeholder-card";
import { Shell } from "@/components/shell";
import { placeholderStaff } from "@/lib/placeholders";

export default function StaffDashboardPage() {
  const { displayName, role } = placeholderStaff;

  return (
    <Shell surface="staff" title={`Welcome, ${displayName}`}>
      <p className="-mt-4 mb-8 capitalize text-stone-600">Role: {role}</p>
      <div className="grid gap-6 sm:grid-cols-2">
        <PlaceholderCard
          title="Client list"
          description="View assigned clients sorted by needs attention vs. on track."
        />
        <PlaceholderCard
          title="Review queue"
          description="Plans and deliverables awaiting advisor review before client delivery."
        />
      </div>
    </Shell>
  );
}
