import Link from "next/link";
import {
  formatSubmittedAt,
  formatWaitlistStatus,
  type WaitlistRecord,
} from "@/lib/admin-api-types";
import { withAppPath } from "@/lib/path-routing";
import { getSurfacePathPrefix } from "@/lib/surface-path";

const statusClass: Record<WaitlistRecord["status"], string> = {
  new: "admin-waitlist-new",
  contacted: "admin-waitlist-contacted",
  scheduled: "admin-waitlist-scheduled",
  declined: "admin-waitlist-declined",
};

type AdminWaitlistViewProps = {
  entries: WaitlistRecord[];
};

export async function AdminWaitlistView({ entries }: AdminWaitlistViewProps) {
  const pathPrefix = await getSurfacePathPrefix();

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="h4 mb-1">Wait list</h1>
        <p className="text-body-secondary mb-0">
          Consultation signups from the main Corduroy marketing site.
        </p>
      </div>

      <div className="app-card p-0 overflow-hidden">
        <table className="table table-hover mb-0 admin-data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <Link
                    href={withAppPath(`/admin/waitlist/${entry.id}`, pathPrefix)}
                    className="fw-medium text-decoration-none"
                  >
                    {entry.name}
                  </Link>
                </td>
                <td>{entry.company}</td>
                <td>{entry.email}</td>
                <td>{formatSubmittedAt(entry.submitted_at)}</td>
                <td>
                  <span className={`badge ${statusClass[entry.status] ?? ""}`}>
                    {formatWaitlistStatus(entry.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
