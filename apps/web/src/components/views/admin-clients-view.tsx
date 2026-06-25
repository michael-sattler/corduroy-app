"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClientAction } from "@/app/actions/admin";
import { SlidePanel } from "@/components/ui/slide-panel";
import {
  formatSubmittedAt,
  type ClientRecord,
} from "@/lib/admin-api-types";
import { withAppPath } from "@/lib/path-routing";

type AdminClientsViewProps = {
  clients: ClientRecord[];
  pathPrefix: string;
};

export function AdminClientsView({ clients, pathPrefix }: AdminClientsViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(form: HTMLFormElement) {
    const name = String(new FormData(form).get("name") ?? "");

    setError(null);
    startTransition(async () => {
      try {
        const client = await createClientAction(name);
        setOpen(false);
        router.push(withAppPath(`/admin/clients/${client.id}`, pathPrefix));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create client");
      }
    });
  }

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h1 className="h4 mb-1">Clients</h1>
            <p className="text-body-secondary mb-0">
              Client organizations and portal users.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setOpen(true)}
          >
            New client
          </button>
        </div>

        {error && !open ? (
          <div className="alert alert-warning py-2 small mb-0">{error}</div>
        ) : null}

        <div className="app-card p-0 overflow-hidden">
          <table className="table table-hover mb-0 admin-data-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Users</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-body-secondary py-4 text-center">
                    No client organizations yet.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <Link
                        href={withAppPath(
                          `/admin/clients/${client.id}`,
                          pathPrefix,
                        )}
                        className="fw-medium text-decoration-none"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td>{client.user_count}</td>
                    <td>{formatSubmittedAt(client.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title="New client"
        subtitle="Create a client organization"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleCreate(event.currentTarget);
          }}
        >
          {error ? (
            <div className="alert alert-warning py-2 small">{error}</div>
          ) : null}
          <div className="mb-3">
            <label className="form-label" htmlFor="client-name">
              Organization name
            </label>
            <input
              id="client-name"
              name="name"
              className="form-control"
              placeholder="e.g. Mitchell HVAC Services"
              required
              autoFocus
            />
          </div>
          <div className="slide-panel-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Creating…" : "Create client"}
            </button>
          </div>
        </form>
      </SlidePanel>
    </>
  );
}
