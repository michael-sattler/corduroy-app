"use client";

import { UserAvatarEditor } from "@/components/ui/user-avatar-editor";

export const USER_ACCOUNT_FORM_ID = "user-account-form";

type UserAccountFieldsProps = {
  surface?: "client" | "staff";
  displayName?: string;
  email?: string;
  avatarPath?: string | null;
  avatarVersion?: string | null;
  error?: string | null;
  pending?: boolean;
  onAvatarUpload: (formData: FormData) => Promise<{ path: string; version: string }>;
  onAvatarUploaded?: (result: { path: string; version: string }) => void;
  onSave: (form: HTMLFormElement) => void;
};

export function UserAccountFields({
  surface = "client",
  displayName = "",
  email = "",
  avatarPath = null,
  avatarVersion = null,
  error = null,
  pending = false,
  onAvatarUpload,
  onAvatarUploaded,
  onSave,
}: UserAccountFieldsProps) {
  return (
    <form
      id={USER_ACCOUNT_FORM_ID}
      className="management-form-section"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(event.currentTarget);
      }}
    >
      {error ? (
        <div className="alert alert-warning py-2 small">{error}</div>
      ) : null}

      <UserAvatarEditor
        displayName={displayName}
        avatarPath={avatarPath}
        avatarVersion={avatarVersion}
        onUpload={onAvatarUpload}
        onUploaded={onAvatarUploaded}
      />

      <div className="mb-3">
        <label className="form-label" htmlFor="user-display-name">
          Name
        </label>
        <input
          id="user-display-name"
          name="displayName"
          className="form-control"
          defaultValue={displayName}
          required
          disabled={pending}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="user-email">
          Email
        </label>
        <input
          id="user-email"
          name="email"
          type="email"
          className="form-control"
          defaultValue={email}
          required
          disabled={pending}
        />
      </div>

      <div className="mb-0">
        <label className="form-label" htmlFor="user-password">
          Password change
        </label>
        <input
          id="user-password"
          name="password"
          type="password"
          className="form-control mb-2"
          placeholder="New password"
          autoComplete="new-password"
          disabled={pending}
        />
        <input
          id="user-password-confirm"
          name="passwordConfirm"
          type="password"
          className="form-control"
          placeholder="Confirm new password"
          autoComplete="new-password"
          disabled={pending}
        />
        <div className="form-text">
          {surface === "staff"
            ? "Leave blank to keep your current password."
            : "Submitting will send a change request to your advisor for approval."}
        </div>
      </div>
    </form>
  );
}
