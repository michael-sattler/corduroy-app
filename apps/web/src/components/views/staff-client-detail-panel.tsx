import { withImageCacheBuster } from "@/lib/platform-images-client";
import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";
import { StaffClientVaultPanel } from "@/components/vault/staff-client-vault-panel";

const kpis = [
  {
    label: "Revenue MTD",
    value: "$44.2K",
    sub: "Target $50K — on pace",
    risk: false,
  },
  {
    label: "Conversion rate",
    value: "59.2%",
    sub: "Target 62% — improving",
    risk: false,
  },
  {
    label: "Commercial revenue %",
    value: "14%",
    sub: "Target 25% Q4 — below pace",
    risk: true,
  },
  {
    label: "Open quote age",
    value: "218d",
    sub: "Was 255d — improving",
    risk: true,
  },
];

const observations = [
  {
    label: "Strong",
    text: "Priority outreach is landing with key accounts. Execution on daily tasks is consistent.",
  },
  {
    label: "Watch",
    text: "Pipeline visibility still depends on manual logging until systems are fully connected.",
  },
  {
    label: "At risk",
    text: "Commercial mix is below target pace for this point in the engagement.",
  },
  {
    label: "Momentum",
    text: "Multi-day execution streak on plan tasks. Most milestones are on track.",
  },
];

const actions = [
  {
    n: 1,
    title: "Injected coaching message on pipeline reactivation",
    sub: "Sent — Apr 17, 9:14am",
    badge: "Sent",
    tone: "success",
  },
  {
    n: 2,
    title: "Prepare follow-up talking points for priority account",
    sub: "In progress — due before 2pm today",
    badge: "Today",
    tone: "warning",
  },
  {
    n: 3,
    title: "Update next-week plan based on completion rate",
    sub: "Plan edit — due Thu EOD",
    badge: "Plan edit",
    tone: "success",
  },
  {
    n: 4,
    title: "Weekly review call with client lead",
    sub: "Scheduled Fri 9am",
    badge: "Fri 9am",
    tone: "warning",
  },
];

const milestones = [
  { label: "Pull & score all outstanding quotes >$5K", status: "Complete", tone: "success" },
  { label: "Client lead calls all Priority 1 outstanding quotes", status: "Complete", tone: "success" },
  { label: "Re-engage all active partner accounts", status: "2 of 4 done", tone: "warning" },
  { label: "Follow up all Priority 2 quotes by phone + email", status: "4 of 10 done", tone: "warning" },
  { label: "CRM reactivated & pipeline owner assigned", status: "Not started", tone: "danger" },
];

type StaffClientDetailPanelProps = {
  client: StaffDashboardClient | null;
  consultantName: string;
};

export function StaffClientDetailPanel({
  client,
  consultantName,
}: StaffClientDetailPanelProps) {
  if (!client) {
    return (
      <div className="app-card mb-4">
        <h2 className="h5 mb-2">Select a client</h2>
        <p className="text-body-secondary mb-0">
          Choose an organization from the list, or create one with{" "}
          <strong>Add client</strong>.
        </p>
      </div>
    );
  }

  const logoSrc = withImageCacheBuster(client.logo_path, client.logo_updated_at);

  return (
    <div className="app-card mb-4" key={client.id}>
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div className="d-flex gap-3">
          <span className="staff-client-avatar-lg">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSrc} alt="" />
            ) : (
              client.initials
            )}
          </span>
          <div>
            <h2 className="h5 mb-1">{client.name}</h2>
            <p className="small text-body-secondary mb-0">
              {client.meta} · Consultant: {consultantName}
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap align-items-start">
          <span className="badge staff-badge-on-track">Engagement preview</span>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {kpis.map((kpi) => (
          <div key={`${client.id}-${kpi.label}`} className="col-md-6 col-xl-3">
            <div className={`staff-kpi-card${kpi.risk ? " at-risk" : ""}`}>
              <div className="small text-body-secondary">{kpi.label}</div>
              <div className="staff-kpi-value">{kpi.value}</div>
              <div className="small text-body-secondary">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <h3 className="h6 mb-3">
            Consultant observations{" "}
            <span className="text-body-secondary fw-normal">· Updated Apr 17</span>
          </h3>
          <div className="d-flex flex-column gap-3">
            {observations.map((item) => (
              <div key={item.label} className="staff-observation">
                <span className="fw-semibold">{item.label}:</span> {item.text}
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-6">
          <h3 className="h6 mb-3">
            My actions this week{" "}
            <span className="text-body-secondary fw-normal">· 4 items</span>
          </h3>
          <div className="d-flex flex-column gap-3">
            {actions.map((action) => (
              <div key={action.n} className="staff-action-row">
                <span className="staff-action-num">{action.n}</span>
                <div className="flex-grow-1">
                  <div className="fw-medium">{action.title}</div>
                  <div className="small text-body-secondary">{action.sub}</div>
                </div>
                <span className={`badge staff-action-badge ${action.tone}`}>
                  {action.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 mb-0">Milestones — consultant view</h3>
        <div className="d-flex gap-2 align-items-center">
          <span className="small text-body-secondary">3 of 5 on track</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Edit plan
          </button>
        </div>
      </div>

      <div className="d-flex flex-column gap-2 mb-4">
        {milestones.map((m) => (
          <div key={m.label} className="staff-milestone-row">
            <span className={`staff-milestone-dot ${m.tone}`} aria-hidden />
            <span className="flex-grow-1">{m.label}</span>
            <span className="small text-body-secondary">This week</span>
            <span className={`badge staff-milestone-badge ${m.tone}`}>{m.status}</span>
          </div>
        ))}
      </div>

      <div className="staff-coach-draft">
        <div className="staff-coach-draft-label">
          Draft coach message — inject to {client.name}
        </div>
        <p className="mb-3">
          Quick check-in for {client.name}: focus this week on clearing the
          oldest open pipeline items and confirming owners for each follow-up.
          Momentum is solid — keep daily plan execution tight.
        </p>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Edit draft
          </button>
          <button type="button" className="btn btn-sm btn-success" disabled>
            Send now
          </button>
        </div>
      </div>

      <StaffClientVaultPanel
        clientId={client.id}
        clientName={client.name}
        vaultStorage={client.vault_storage}
      />
    </div>
  );
}
