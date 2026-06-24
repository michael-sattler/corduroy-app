type UserAccountFieldsProps = {
  surface?: "client" | "staff";
  displayName?: string;
  email?: string;
};

export function UserAccountFields({
  surface = "client",
  displayName = "",
  email = "",
}: UserAccountFieldsProps) {
  return (
    <div className="management-form-section">
      <div className="text-center mb-4">
        <div className="user-avatar-preview mx-auto mb-2">
          {displayName.slice(0, 1).toUpperCase() || "?"}
        </div>
        <label className="form-label small" htmlFor="user-avatar">
          Avatar
        </label>
        <input id="user-avatar" type="file" className="form-control" accept="image/*" />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="user-display-name">
          Name
        </label>
        <input
          id="user-display-name"
          className="form-control"
          defaultValue={displayName}
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
        />
        <input
          id="user-password-confirm"
          type="password"
          className="form-control"
          placeholder="Confirm new password"
        />
        <div className="form-text">
          {surface === "staff"
            ? "Leave blank to keep your current password."
            : "Submitting will send a change request to your advisor for approval."}
        </div>
      </div>
    </div>
  );
}
