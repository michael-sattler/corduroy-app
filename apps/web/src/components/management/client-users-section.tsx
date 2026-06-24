export type PlaceholderClientUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const defaultUsers: PlaceholderClientUser[] = [
  {
    id: "1",
    name: "Matt Ellison",
    email: "matt@elevatedconcrete.com",
    role: "Owner",
  },
  {
    id: "2",
    name: "Kyle Sanders",
    email: "kyle@elevatedconcrete.com",
    role: "Operations",
  },
];

type ClientUsersSectionProps = {
  users?: PlaceholderClientUser[];
};

export function ClientUsersSection({ users = defaultUsers }: ClientUsersSectionProps) {
  return (
    <div className="management-form-section">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 mb-0">Client users</h3>
        <button type="button" className="btn btn-sm btn-outline-primary">
          Add user
        </button>
      </div>

      <div className="d-flex flex-column gap-3">
        {users.map((user) => (
          <div key={user.id} className="management-user-card">
            <div className="row g-2">
              <div className="col-sm-6">
                <label className="form-label small">Name</label>
                <input className="form-control form-control-sm" defaultValue={user.name} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small">Email</label>
                <input
                  className="form-control form-control-sm"
                  type="email"
                  defaultValue={user.email}
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label small">Role</label>
                <input className="form-control form-control-sm" defaultValue={user.role} />
              </div>
              <div className="col-sm-6">
                <label className="form-label small">New password</label>
                <input
                  className="form-control form-control-sm"
                  type="password"
                  placeholder="Leave blank to keep"
                />
              </div>
              <div className="col-12">
                <label className="form-label small">Avatar</label>
                <input type="file" className="form-control form-control-sm" accept="image/*" />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-2">
              <button type="button" className="btn btn-sm btn-outline-secondary">
                Reset
              </button>
              <button type="button" className="btn btn-sm btn-primary">
                Save user
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
