import { UserAvatarEditor } from "@/components/ui/user-avatar-editor";

type UserAccountFieldsProps = {
  surface?: "client" | "staff";
  displayName?: string;
  email?: string;
  avatarPath?: string | null;
  avatarVersion?: string | null;
  onAvatarUpload: (formData: FormData) => Promise<{ path: string; version: string }>;
  onAvatarUploaded?: (result: { path: string; version: string }) => void;
};

export function UserAccountFields({
  surface = "client",
  displayName = "",
  email = "",
  avatarPath = null,
  avatarVersion = null,
  onAvatarUpload,
  onAvatarUploaded,
}: UserAccountFieldsProps) {
  return (
    <div className="management-form-section">
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
          className="form-control"
          defaultValue={displayName}
          readOnly
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="user-email">
          Email
        </label>
        <input
          id="user-email"
          type="email"
          className="form-control"
          defaultValue={email}
          readOnly
        />
      </div>

      <div className="mb-0">
        <label className="form-label" htmlFor="user-password">
          Password change
        </label>
        <input
          id="user-password"
          type="password"
          className="form-control mb-2"
          placeholder="New password"
          disabled
        />
        <input
          id="user-password-confirm"
          type="password"
          className="form-control"
          placeholder="Confirm new password"
          disabled
        />
        <div className="form-text">
          {surface === "staff"
            ? "Password changes coming soon."
            : "Password changes require advisor approval."}
        </div>
      </div>
    </div>
  );
}
