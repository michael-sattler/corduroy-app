"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createPortalUserAction,
  updatePortalUserAction,
  uploadPortalUserAvatarAction,
} from "@/app/actions/admin";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import type { StaffClientUserRecord } from "@/components/management/staff-client-types";

type ClientUsersSectionProps = {
  clientId: string | null;
  users?: StaffClientUserRecord[];
};

function StaffPortalUserCreateCard({
  clientId,
  onCancel,
  onCreated,
}: {
  clientId: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(form: HTMLFormElement) {
    const formData = new FormData(form);

    setError(null);
    startTransition(async () => {
      try {
        await createPortalUserAction(clientId, {
          displayName: String(formData.get("displayName") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        });
        onCreated();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not create portal user",
        );
      }
    });
  }

  return (
    <form
      className="management-user-card border border-primary"
      onSubmit={(event) => {
        event.preventDefault();
        handleCreate(event.currentTarget);
      }}
    >
      {error ? (
        <div className="alert alert-warning py-2 small">{error}</div>
      ) : null}
      <div className="small fw-semibold mb-3">New portal user</div>
      <div className="row g-2">
        <div className="col-sm-6">
          <label className="form-label small" htmlFor="new-portal-display-name">
            Name
          </label>
          <input
            id="new-portal-display-name"
            name="displayName"
            className="form-control form-control-sm"
            required
            disabled={pending}
            autoFocus
          />
        </div>
        <div className="col-sm-6">
          <label className="form-label small" htmlFor="new-portal-email">
            Email
          </label>
          <input
            id="new-portal-email"
            name="email"
            type="email"
            className="form-control form-control-sm"
            required
            disabled={pending}
            autoComplete="off"
          />
        </div>
        <div className="col-sm-6">
          <label className="form-label small" htmlFor="new-portal-password">
            Temporary password
          </label>
          <input
            id="new-portal-password"
            name="password"
            type="password"
            className="form-control form-control-sm"
            minLength={8}
            required
            disabled={pending}
            autoComplete="new-password"
          />
          <div className="form-text">Minimum 8 characters.</div>
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

function StaffPortalUserCard({
  clientId,
  user,
}: {
  clientId: string;
  user: StaffClientUserRecord;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave(form: HTMLFormElement) {
    const formData = new FormData(form);

    setError(null);
    startTransition(async () => {
      try {
        await updatePortalUserAction(clientId, user.id, {
          displayName: String(formData.get("displayName") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        });
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save portal user",
        );
      }
    });
  }

  return (
    <form
      className="management-user-card"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave(event.currentTarget);
      }}
    >
      {error ? (
        <div className="alert alert-warning py-2 small">{error}</div>
      ) : null}
      <ImageUploadField
        label="Avatar"
        imagePath={user.avatar_path}
        imageVersion={user.avatar_updated_at}
        fallbackLabel={user.display_name}
        disabled={pending}
        onUpload={(formData) =>
          uploadPortalUserAvatarAction(clientId, user.id, formData)
        }
      />
      <div className="row g-2">
        <div className="col-sm-6">
          <label className="form-label small" htmlFor={`user-name-${user.id}`}>
            Name
          </label>
          <input
            id={`user-name-${user.id}`}
            name="displayName"
            className="form-control form-control-sm"
            defaultValue={user.display_name}
            required
            disabled={pending}
          />
        </div>
        <div className="col-sm-6">
          <label className="form-label small" htmlFor={`user-email-${user.id}`}>
            Email
          </label>
          <input
            id={`user-email-${user.id}`}
            name="email"
            className="form-control form-control-sm"
            type="email"
            defaultValue={user.email}
            required
            disabled={pending}
            autoComplete="off"
          />
        </div>
        <div className="col-sm-6">
          <label
            className="form-label small"
            htmlFor={`user-password-${user.id}`}
          >
            New password
          </label>
          <input
            id={`user-password-${user.id}`}
            name="password"
            className="form-control form-control-sm"
            type="password"
            placeholder="Leave blank to keep"
            disabled={pending}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-2">
        <button
          type="reset"
          className="btn btn-sm btn-outline-secondary"
          disabled={pending}
        >
          Reset
        </button>
        <button type="submit" className="btn btn-sm btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save user"}
        </button>
      </div>
    </form>
  );
}

export function ClientUsersSection({
  clientId,
  users = [],
}: ClientUsersSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="management-form-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 mb-0">Client users</h3>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          disabled={!clientId || createOpen}
          onClick={() => setCreateOpen(true)}
        >
          Add user
        </button>
      </div>

      {!clientId ? (
        <p className="small text-body-secondary mb-0">
          Save the client account before managing portal users.
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {createOpen ? (
            <StaffPortalUserCreateCard
              clientId={clientId}
              onCancel={() => setCreateOpen(false)}
              onCreated={() => setCreateOpen(false)}
            />
          ) : null}

          {users.length === 0 && !createOpen ? (
            <p className="small text-body-secondary mb-0">
              No portal users for this organization yet.
            </p>
          ) : null}

          {users.map((user) => (
            <StaffPortalUserCard key={user.id} clientId={clientId} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
