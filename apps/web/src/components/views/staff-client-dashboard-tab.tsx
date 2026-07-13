import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";

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

type StaffClientDashboardTabProps = {
  client: StaffDashboardClient;
};

export function StaffClientDashboardTab({ client }: StaffClientDashboardTabProps) {
  return (
    <div className="staff-dashboard-grid">
      <div className="row g-2 staff-kpi-grid mb-2">
        {kpis.map((kpi) => (
          <div key={`${client.id}-${kpi.label}`} className="col-6 col-xl-3">
            <div className={`staff-kpi-card${kpi.risk ? " at-risk" : ""}`}>
              <div className="small text-body-secondary">{kpi.label}</div>
              <div className="staff-kpi-value">{kpi.value}</div>
              <div className="small text-body-secondary">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-2 mb-2">
        <div className="col-lg-6">
          <h3 className="staff-section-heading mb-2">
            Consultant observations{" "}
            <span className="staff-section-heading-meta">· Apr 17</span>
          </h3>
          <div className="staff-stack-tight">
            {observations.map((item) => (
              <div key={item.label} className="staff-observation">
                <span className="fw-semibold">{item.label}:</span> {item.text}
              </div>
            ))}
          </div>
        </div>
        <div className="col-lg-6">
          <h3 className="staff-section-heading mb-2">
            My actions this week{" "}
            <span className="staff-section-heading-meta">· 4 items</span>
          </h3>
          <div className="staff-stack-tight">
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

      <div className="staff-coach-draft mt-2">
        <div className="staff-coach-draft-label">
          Draft coach message — {client.name}
        </div>
        <p className="staff-coach-draft-body mb-2">
          Quick check-in for {client.name}: focus this week on clearing the
          oldest open pipeline items and confirming owners for each follow-up.
          Momentum is solid — keep daily plan execution tight.
        </p>
        <div className="d-flex gap-1">
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Edit draft
          </button>
          <button type="button" className="btn btn-sm btn-success" disabled>
            Send now
          </button>
        </div>
      </div>
    </div>
  );
}
