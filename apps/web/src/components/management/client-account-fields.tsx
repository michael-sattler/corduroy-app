type ClientAccountFieldsProps = {
  name?: string;
  location?: string;
  dateCreated?: string;
};

export function ClientAccountFields({
  name = "",
  location = "",
  dateCreated = "",
}: ClientAccountFieldsProps) {
  return (
    <div className="management-form-section">
      <h3 className="h6 mb-3">Client account</h3>
      <div className="mb-3">
        <label className="form-label" htmlFor="client-name">
          Name
        </label>
        <input
          id="client-name"
          className="form-control"
          defaultValue={name}
          placeholder="Elevated Concrete Solutions"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="client-location">
          Location
        </label>
        <input
          id="client-location"
          className="form-control"
          defaultValue={location}
          placeholder="City, State"
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="client-date-created">
          Date created
        </label>
        <input
          id="client-date-created"
          type="date"
          className="form-control"
          defaultValue={dateCreated}
        />
      </div>
      <div className="mb-0">
        <label className="form-label" htmlFor="client-logo">
          Logo
        </label>
        <input id="client-logo" type="file" className="form-control" accept="image/*" />
        <div className="form-text">PNG or SVG recommended. Max 2 MB.</div>
      </div>
    </div>
  );
}
