"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createPortalUserAction,
  startClientImpersonationAction,
  updateClientAction,
  updatePortalUserAction,
  uploadClientLogoAction,
  uploadPortalUserAvatarAction,
} from "@/app/actions/admin";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { SlidePanel } from "@/components/ui/slide-panel";
import {
  formatSubmittedAt,
  type PortalUserListRecord,
} from "@/lib/admin-api-types";
import { withAppPath } from "@/lib/path-routing";

type AdminClientDetailViewProps = {
  client: {
    id: string;
    name: string;
    created_at: string;
    logo_path: string | null;
    logo_updated_at: string | null;
  };
  users: PortalUserListRecord[];
  pathPrefix: string;
};

type PortalPanelMode = "create" | "edit" | null;

function PortalUserForm({
  mode,
  user,
  clientId,
  error,
  pending,
  onCancel,
  onCreate,
  onSave,
}: {
  mode: "create" | "edit";
  user: PortalUserListRecord | null;
  clientId: string;
  error: string | null;
  pending: boolean;
  onCancel: () => void;
  onCreate: (form: HTMLFormElement) => void;
  onSave: (form: HTMLFormElement) => void;
}) {
  const isEdit = mode === "edit";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isEdit) {
          onSave(event.currentTarget);
        } else {
          onCreate(event.currentTarget);
        }
      }}
    >
      {error ? (
        <div className="alert alert-warning py-2 small">{error}</div>
      ) : null}
      {isEdit && user ? (
        <ImageUploadField
          label="Avatar"
          imagePath={user.avatar_path}
          imageVersion={user.avatar_updated_at}
          fallbackLabel={user.display_name}
          onUpload={(formData) =>
            uploadPortalUserAvatarAction(clientId, user.id, formData)
          }
        />
      ) : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="portal-display-name">
          Display name
        </label>
        <input
          id="portal-display-name"
          name="displayName"
          className="form-control"
          defaultValue={user?.display_name ?? ""}
          key={user?.id ?? "create"}
          required
          autoFocus
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="portal-email">
          Email
        </label>
        <input
          id="portal-email"
          name="email"
          type="email"
          className="form-control"
          defaultValue={user?.email ?? ""}
          key={`${user?.id ?? "create"}-email`}
          required
          autoComplete="off"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="portal-password">
          {isEdit ? "New password" : "Temporary password"}
        </label>
        <input
          id="portal-password"
          name="password"
          type="password"
          className="form-control"
          minLength={isEdit ? undefined : 8}
          required={!isEdit}
          autoComplete="new-password"
        />
        {isEdit ? (
          <div className="form-text">Leave blank to keep the current password.</div>
        ) : (
          <div className="form-text">
            Minimum 8 characters. User can change after login.
          </div>
        )}
      </div>
      <div className="slide-panel-footer">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save portal user"
              : "Create portal user"}
        </button>
      </div>
    </form>
  );
}

export function AdminClientDetailView({
  client,
  users,
  pathPrefix,
}: AdminClientDetailViewProps) {
  const router = useRouter();
  const [savedOrgName, setSavedOrgName] = useState<string | null>(null);
  const orgName = savedOrgName ?? client.name;
  const [orgError, setOrgError] = useState<string | null>(null);
  const [portalPanelMode, setPortalPanelMode] = useState<PortalPanelMode>(null);
  const [selectedUser, setSelectedUser] = useState<PortalUserListRecord | null>(
    null,
  );
  const [portalError, setPortalError] = useState<string | null>(null);
  const [orgPending, startOrgTransition] = useTransition();
  const [portalPending, startPortalTransition] = useTransition();
  const [impersonatePending, startImpersonateTransition] = useTransition();
  const [impersonateError, setImpersonateError] = useState<string | null>(null);

  function closePortalPanel() {
    setPortalPanelMode(null);
    setSelectedUser(null);
    setPortalError(null);
  }

  function handleOrgSave(form: HTMLFormElement) {
    const name = String(new FormData(form).get("name") ?? "");

    setOrgError(null);
    startOrgTransition(async () => {
      try {
        const updated = await updateClientAction(client.id, { name });
        setSavedOrgName(updated.name);
        router.refresh();
      } catch (err) {
        setOrgError(
          err instanceof Error ? err.message : "Could not update organization",
        );
      }
    });
  }

  function handleViewAsClient(user: PortalUserListRecord) {
    setImpersonateError(null);
    startImpersonateTransition(async () => {
      try {
        const { url } = await startClientImpersonationAction(user.id, client.id);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setImpersonateError(
          err instanceof Error ? err.message : "Could not start client session",
        );
      }
    });
  }

  function handleCreatePortalUser(form: HTMLFormElement) {
    const formData = new FormData(form);

    setPortalError(null);
    startPortalTransition(async () => {
      try {
        await createPortalUserAction(client.id, {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          displayName: String(formData.get("displayName") ?? ""),
        });
        closePortalPanel();
        router.refresh();
      } catch (err) {
        setPortalError(
          err instanceof Error ? err.message : "Could not create portal user",
        );
      }
    });
  }

  function handleUpdatePortalUser(form: HTMLFormElement) {
    if (!selectedUser) return;

    const formData = new FormData(form);

    setPortalError(null);
    startPortalTransition(async () => {
      try {
        await updatePortalUserAction(client.id, selectedUser.id, {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          displayName: String(formData.get("displayName") ?? ""),
        });
        closePortalPanel();
        router.refresh();
      } catch (err) {
        setPortalError(
          err instanceof Error ? err.message : "Could not update portal user",
        );
      }
    });
  }

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div>
          <Link
            href={withAppPath("/admin/clients", pathPrefix)}
            className="small admin-back-link"
          >
            ← Back to clients
          </Link>
          <h1 className="h4 mb-1 mt-2">{orgName}</h1>
          <p className="text-body-secondary mb-0">
            Created {formatSubmittedAt(client.created_at)}
          </p>
        </div>

        <form
          className="app-card"
          onSubmit={(event) => {
            event.preventDefault();
            handleOrgSave(event.currentTarget);
          }}
        >
          <h2 className="h6 mb-3">Organization</h2>

          {orgError ? (
            <div className="alert alert-warning py-2 small">{orgError}</div>
          ) : null}

          <div className="mb-3">
            <label className="form-label" htmlFor="client-org-name">
              Organization name
            </label>
            <input
              id="client-org-name"
              name="name"
              className="form-control"
              defaultValue={client.name}
              key={client.name}
              required
            />
          </div>

          <ImageUploadField
            label="Organization logo"
            shape="logo"
            imagePath={client.logo_path}
            imageVersion={client.logo_updated_at}
            fallbackLabel={orgName}
            onUpload={(formData) => uploadClientLogoAction(client.id, formData)}
          />

          <dl className="row mb-0">
            <dt className="col-sm-3">Client ID</dt>
            <dd className="col-sm-9 font-monospace small">{client.id}</dd>
            <dt className="col-sm-3">Portal users</dt>
            <dd className="col-sm-9">{users.length}</dd>
          </dl>

          <div className="mt-4">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={orgPending}
            >
              {orgPending ? "Saving…" : "Save organization"}
            </button>
          </div>
        </form>

        <div className="app-card p-0 overflow-hidden">
          <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
            <h2 className="h6 mb-0">Portal users</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelectedUser(null);
                setPortalError(null);
                setPortalPanelMode("create");
              }}
            >
              New portal user
            </button>
          </div>
          {impersonateError ? (
            <div className="alert alert-warning py-2 small mx-3 mt-3 mb-0">
              {impersonateError}
            </div>
          ) : null}
          <table className="table table-hover mb-0 admin-data-table">
            <thead>
              <tr>
                <th>Display name</th>
                <th>Email</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-body-secondary py-4 text-center">
                    No portal users for this organization.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-medium">{user.display_name}</td>
                    <td>{user.email || "—"}</td>
                    <td>{formatSubmittedAt(user.created_at)}</td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={impersonatePending}
                          onClick={() => handleViewAsClient(user)}
                        >
                          Log in as client
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setSelectedUser(user);
                            setPortalError(null);
                            setPortalPanelMode("edit");
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={portalPanelMode !== null}
        onClose={closePortalPanel}
        title={
          portalPanelMode === "edit" ? "Edit portal user" : "New portal user"
        }
        subtitle={
          portalPanelMode === "edit"
            ? (selectedUser?.email ?? undefined)
            : orgName
        }
      >
        {portalPanelMode ? (
          <PortalUserForm
            mode={portalPanelMode}
            user={selectedUser}
            clientId={client.id}
            error={portalError}
            pending={portalPending}
            onCancel={closePortalPanel}
            onCreate={handleCreatePortalUser}
            onSave={handleUpdatePortalUser}
          />
        ) : null}
      </SlidePanel>
    </>
  );
}
