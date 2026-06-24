import Link from "next/link";
import { adminWaitlist } from "@/lib/placeholder-admin-data";

const statusClass: Record<string, string> = {
  New: "admin-waitlist-new",
  Contacted: "admin-waitlist-contacted",
  Scheduled: "admin-waitlist-scheduled",
  Declined: "admin-waitlist-declined",
};

export function AdminWaitlistView() {
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
            {adminWaitlist.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <Link
                    href={`/admin/waitlist/${entry.id}`}
                    className="fw-medium text-decoration-none"
                  >
                    {entry.name}
                  </Link>
                </td>
                <td>{entry.company}</td>
                <td>{entry.email}</td>
                <td>{entry.submittedAt}</td>
                <td>
                  <span className={`badge ${statusClass[entry.status] ?? ""}`}>
                    {entry.status}
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
