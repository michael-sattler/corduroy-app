"use client";

import { ImageUploadField } from "@/components/ui/image-upload-field";
import { uploadClientLogoAction } from "@/app/actions/admin";

export const STAFF_CLIENT_ACCOUNT_FORM_ID = "staff-client-account-form";

type ClientAccountFieldsProps = {
  name?: string;
  location?: string;
  dateCreated?: string;
  dateCreatedReadOnly?: boolean;
  clientId?: string | null;
  logoPath?: string | null;
  logoUpdatedAt?: string | null;
  pending?: boolean;
  onSave: (form: HTMLFormElement) => void;
};

export function ClientAccountFields({
  name = "",
  location = "",
  dateCreated = "",
  dateCreatedReadOnly = false,
  clientId = null,
  logoPath = null,
  logoUpdatedAt = null,
  pending = false,
  onSave,
}: ClientAccountFieldsProps) {
  return (
    <form
      id={STAFF_CLIENT_ACCOUNT_FORM_ID}
      className="management-form-section"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(event.currentTarget);
      }}
    >
      <h3 className="h6 mb-3">Client account</h3>
      <div className="mb-3">
        <label className="form-label" htmlFor="client-name">
          Name
        </label>
        <input
          id="client-name"
          name="name"
          className="form-control"
          defaultValue={name}
          placeholder="All-American Fitness"
          required
          disabled={pending}
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="client-location">
          Location
        </label>
        <input
          id="client-location"
          name="location"
          className="form-control"
          defaultValue={location}
          placeholder="City, State"
          disabled={pending}
        />
        <div className="form-text">Portfolio metadata — not stored in the database yet.</div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="client-date-created">
          Date created
        </label>
        <input
          id="client-date-created"
          name="dateCreated"
          type="date"
          className="form-control"
          defaultValue={dateCreated}
          readOnly={dateCreatedReadOnly}
          disabled={pending && !dateCreatedReadOnly}
        />
      </div>
      {clientId ? (
        <ImageUploadField
          label="Organization logo"
          shape="logo"
          imagePath={logoPath}
          imageVersion={logoUpdatedAt}
          fallbackLabel={name}
          disabled={pending}
          onUpload={(formData) => uploadClientLogoAction(clientId, formData)}
        />
      ) : (
        <div className="mb-0">
          <label className="form-label">Organization logo</label>
          <div className="form-text">
            Save the client account first, then upload a logo.
          </div>
        </div>
      )}
    </form>
  );
}
