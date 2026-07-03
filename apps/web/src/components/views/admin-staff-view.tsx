"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createStaffUserAction,
  updateStaffUserAction,
  uploadStaffAvatarAction,
} from "@/app/actions/admin";
import { ImageUploadField } from "@/components/ui/image-upload-field";
import { SlidePanel } from "@/components/ui/slide-panel";
import type { StaffListRecord } from "@/lib/admin-api-types";
import {
  formatStaffRole,
  formatSubmittedAt,
} from "@/lib/admin-api-types";

type AdminStaffViewProps = {
  staff: StaffListRecord[];
};

type PanelMode = "create" | "edit" | null;

function StaffUserForm({
  mode,
  member,
  error,
  pending,
  onCancel,
  onCreate,
  onSave,
}: {
  mode: "create" | "edit";
  member: StaffListRecord | null;
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
      {isEdit && member ? (
        <ImageUploadField
          label="Avatar"
          imagePath={member.avatar_path}
          imageVersion={member.avatar_updated_at}
          fallbackLabel={member.display_name}
          onUpload={(formData) => uploadStaffAvatarAction(member.id, formData)}
        />
      ) : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="staff-display-name">
          Display name
        </label>
        <input
          id="staff-display-name"
          name="displayName"
          className="form-control"
          defaultValue={member?.display_name ?? ""}
          key={member?.id ?? "create"}
          required
          autoFocus
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="staff-email">
          Email
        </label>
        <input
          id="staff-email"
          name="email"
          type="email"
          className="form-control"
          placeholder="name@corduroytech.ai"
          defaultValue={member?.email ?? ""}
          key={`${member?.id ?? "create"}-email`}
          required
          autoComplete="off"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="staff-password">
          {isEdit ? "New password" : "Temporary password"}
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          className="form-control"
          minLength={isEdit ? undefined : 8}
          required={!isEdit}
          autoComplete="new-password"
        />
        {isEdit ? (
          <div className="form-text">Leave blank to keep the current password.</div>
        ) : null}
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="staff-role">
          Role
        </label>
        <select
          id="staff-role"
          name="role"
          className="form-select"
          defaultValue={member?.role ?? "advisor"}
          key={`${member?.id ?? "create"}-role`}
        >
          <option value="advisor">Advisor</option>
          <option value="principal">Principal</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="mb-3 form-check">
        <input
          id="staff-approved"
          name="approved"
          type="checkbox"
          className="form-check-input"
          defaultChecked={member?.approved ?? true}
          key={`${member?.id ?? "create"}-approved`}
        />
        <label className="form-check-label" htmlFor="staff-approved">
          Approved (can sign in to staff console)
        </label>
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
              ? "Save staff user"
              : "Create staff user"}
        </button>
      </div>
    </form>
  );
}

export function AdminStaffView({ staff }: AdminStaffViewProps) {
  const router = useRouter();
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selected, setSelected] = useState<StaffListRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function closePanel() {
    setPanelMode(null);
    setSelected(null);
    setError(null);
  }

  function handleCreate(form: HTMLFormElement) {
    const formData = new FormData(form);

    setError(null);
    startTransition(async () => {
      try {
        await createStaffUserAction({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          displayName: String(formData.get("displayName") ?? ""),
          role: String(formData.get("role") ?? "advisor"),
          approved: formData.get("approved") === "on",
        });
        closePanel();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not create staff user",
        );
      }
    });
  }

  function handleSave(form: HTMLFormElement) {
    if (!selected) return;

    const formData = new FormData(form);

    setError(null);
    startTransition(async () => {
      try {
        await updateStaffUserAction(selected.id, {
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          displayName: String(formData.get("displayName") ?? ""),
          role: String(formData.get("role") ?? "advisor"),
          approved: formData.get("approved") === "on",
        });
        closePanel();
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not update staff user",
        );
      }
    });
  }

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h1 className="h4 mb-1">Staff</h1>
            <p className="text-body-secondary mb-0">
              Corduroy team accounts. New users must use a @corduroytech.ai email.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setSelected(null);
              setError(null);
              setPanelMode("create");
            }}
          >
            New staff user
          </button>
        </div>

        <div className="app-card p-0 overflow-hidden">
          <table className="table table-hover mb-0 admin-data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Added</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-body-secondary py-4 text-center">
                    No staff accounts yet.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id}>
                    <td className="fw-medium">{member.display_name || "—"}</td>
                    <td>{member.email || "—"}</td>
                    <td>{formatStaffRole(member.role)}</td>
                    <td>
                      <span
                        className={`badge ${member.approved ? "text-bg-success" : "text-bg-secondary"}`}
                      >
                        {member.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td>{formatSubmittedAt(member.created_at)}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setSelected(member);
                          setError(null);
                          setPanelMode("edit");
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={panelMode !== null}
        onClose={closePanel}
        title={panelMode === "edit" ? "Edit staff user" : "New staff user"}
        subtitle={
          panelMode === "edit"
            ? (selected?.email ?? undefined)
            : "@corduroytech.ai accounts only"
        }
      >
        {panelMode ? (
          <StaffUserForm
            mode={panelMode}
            member={selected}
            error={error}
            pending={pending}
            onCancel={closePanel}
            onCreate={handleCreate}
            onSave={handleSave}
          />
        ) : null}
      </SlidePanel>
    </>
  );
}
