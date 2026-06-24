import { PLACEHOLDER_ORG, vaultSources } from "@/lib/placeholder-data";

type ClientVaultViewProps = {
  organization: string;
};

const integrations = [
  { name: "QuickBooks", connected: true },
  { name: "Pipedrive", connected: true },
  { name: "Quotient", connected: true },
  { name: "AnswerConnect", connected: true },
  { name: "Salesforce", connected: false },
  { name: "Google Sheets", connected: false },
];

export function ClientVaultView({ organization }: ClientVaultViewProps) {
  const displayOrg = organization === "Acme Corp" ? PLACEHOLDER_ORG : organization;

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="app-card h-100">
            <h2 className="h5 mb-1">Add data source</h2>
            <p className="text-body-secondary small mb-4">
              Upload files or connect a system
            </p>

            <div className="vault-dropzone mb-4">
              <div className="vault-dropzone-icon">☁</div>
              <div className="fw-medium">Drop files here or click to browse</div>
              <div className="small text-body-secondary">
                Financials, proposals, contracts, reports
              </div>
              <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
                <span className="file-pill file-pill-pdf">PDF</span>
                <span className="file-pill file-pill-xlsx">XLSX</span>
                <span className="file-pill file-pill-docx">DOCX</span>
                <span className="file-pill file-pill-csv">CSV</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-medium">Source label</label>
              <input
                className="form-control form-control-sm"
                placeholder="e.g. Q1 2026 P&L statement"
                readOnly
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label small fw-medium">Category</label>
                <select className="form-select form-select-sm" defaultValue="financial" disabled>
                  <option value="financial">Financial</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label small fw-medium">Date of data</label>
                <input className="form-control form-control-sm" defaultValue="Mar 2026" readOnly />
              </div>
            </div>

            <div className="mb-3">
              <div className="small fw-medium mb-2">Connect a system</div>
              <div className="row g-2">
                {integrations.map((item) => (
                  <div key={item.name} className="col-6">
                    <div
                      className={`integration-tile${item.connected ? " connected" : ""}`}
                    >
                      <span>{item.name}</span>
                      <span className="small">
                        {item.connected ? "✓" : "+ Add"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" className="btn btn-primary w-100" disabled>
              Add to data repository
            </button>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="app-card">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <div>
                <h2 className="h5 mb-1">Data repository</h2>
                <p className="text-body-secondary small mb-0">
                  {displayOrg} — 11 sources
                </p>
              </div>
            </div>

            <div className="vault-progress-block my-4">
              <div className="d-flex justify-content-between small mb-2">
                <span className="fw-medium">8 of 11 sources obtained</span>
                <span className="text-body-secondary">68% complete</span>
              </div>
              <div className="progress vault-progress">
                <div className="progress-bar bg-success" style={{ width: "68%" }} />
              </div>
            </div>

            {vaultSources.map((group) => (
              <section key={group.section} className="mb-4">
                <h3 className="vault-section-label">{group.section}</h3>
                <div className="d-flex flex-column gap-2">
                  {group.items.map((item) => (
                    <div
                      key={item.title}
                      className={`vault-source-row${item.done ? "" : " pending"}`}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        checked={item.done}
                        readOnly
                        aria-label={item.title}
                      />
                      <span className="vault-source-icon" aria-hidden>
                        {item.icon}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="fw-medium">{item.title}</div>
                        <div className="small text-body-secondary">{item.meta}</div>
                      </div>
                      <span className={`source-tag ${item.tagClass}`}>{item.tag}</span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
