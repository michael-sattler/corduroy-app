import Link from "next/link";
import type { WaitlistEntry } from "@/lib/placeholder-admin-data";
import { withAppPath } from "@/lib/path-routing";
import { getSurfacePathPrefix } from "@/lib/surface-path";

type AdminWaitlistDetailViewProps = {
  entry: WaitlistEntry;
};

export async function AdminWaitlistDetailView({ entry }: AdminWaitlistDetailViewProps) {
  const pathPrefix = await getSurfacePathPrefix();

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <Link href={withAppPath("/admin/waitlist", pathPrefix)} className="small admin-back-link">
          ← Back to wait list
        </Link>
        <h1 className="h4 mb-1 mt-2">{entry.name}</h1>
        <p className="text-body-secondary mb-0">{entry.company}</p>
      </div>

      <div className="app-card">
        <h2 className="h6 mb-3">Signup details</h2>
        <dl className="row mb-0">
          <dt className="col-sm-3">Email</dt>
          <dd className="col-sm-9">{entry.email}</dd>
          <dt className="col-sm-3">Submitted</dt>
          <dd className="col-sm-9">{entry.submittedAt}</dd>
          <dt className="col-sm-3">Status</dt>
          <dd className="col-sm-9">
            <select className="form-select form-select-sm" style={{ maxWidth: "12rem" }} defaultValue={entry.status}>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Declined">Declined</option>
            </select>
          </dd>
          <dt className="col-sm-3">Referral source</dt>
          <dd className="col-sm-9">corduroytech.ai — consultation form</dd>
          <dt className="col-sm-3">Notes</dt>
          <dd className="col-sm-9">
            <textarea
              className="form-control"
              rows={4}
              placeholder="Internal notes about this lead…"
              defaultValue="Interested in 90-day plan for commercial trades business. Revenue ~$2M."
            />
          </dd>
        </dl>
        <div className="d-flex gap-2 mt-4">
          <button type="button" className="btn btn-primary btn-sm">
            Save
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled>
            Convert to client
          </button>
        </div>
      </div>
    </div>
  );
}
