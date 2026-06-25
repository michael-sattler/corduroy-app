"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateWaitlistEntryAction } from "@/app/actions/admin";
import {
  formatSubmittedAt,
  formatWaitlistStatus,
  type WaitlistRecord,
} from "@/lib/admin-api-types";
import { withAppPath } from "@/lib/path-routing";

type AdminWaitlistDetailViewProps = {
  entry: WaitlistRecord;
  pathPrefix: string;
};

export function AdminWaitlistDetailView({
  entry,
  pathPrefix,
}: AdminWaitlistDetailViewProps) {
  const [pending, startTransition] = useTransition();

  function handleSave(form: HTMLFormElement) {
    const formData = new FormData(form);
    const status = String(formData.get("status") ?? entry.status);
    const notes = String(formData.get("notes") ?? "");

    startTransition(async () => {
      await updateWaitlistEntryAction(entry.id, { status, notes });
    });
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <Link href={withAppPath("/admin/waitlist", pathPrefix)} className="small admin-back-link">
          ← Back to wait list
        </Link>
        <h1 className="h4 mb-1 mt-2">{entry.name}</h1>
        <p className="text-body-secondary mb-0">{entry.company}</p>
      </div>

      <form
        className="app-card"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave(event.currentTarget);
        }}
      >
        <h2 className="h6 mb-3">Signup details</h2>
        <dl className="row mb-0">
          <dt className="col-sm-3">Email</dt>
          <dd className="col-sm-9">{entry.email}</dd>
          <dt className="col-sm-3">Submitted</dt>
          <dd className="col-sm-9">{formatSubmittedAt(entry.submitted_at)}</dd>
          <dt className="col-sm-3">Status</dt>
          <dd className="col-sm-9">
            <select
              name="status"
              className="form-select form-select-sm"
              style={{ maxWidth: "12rem" }}
              defaultValue={entry.status}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="scheduled">Scheduled</option>
              <option value="declined">Declined</option>
            </select>
            <span className="small text-body-secondary ms-2">
              ({formatWaitlistStatus(entry.status)})
            </span>
          </dd>
          <dt className="col-sm-3">Referral source</dt>
          <dd className="col-sm-9">
            {entry.referral_source || "—"}
          </dd>
          <dt className="col-sm-3">Notes</dt>
          <dd className="col-sm-9">
            <textarea
              name="notes"
              className="form-control"
              rows={4}
              placeholder="Internal notes about this lead…"
              defaultValue={entry.notes ?? ""}
            />
          </dd>
        </dl>
        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled>
            Convert to client
          </button>
        </div>
      </form>
    </div>
  );
}
