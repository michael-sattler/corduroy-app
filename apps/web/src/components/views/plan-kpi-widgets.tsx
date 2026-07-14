import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { ClientPlanKpi } from "@/lib/plan/client-plan-dashboard-types";

function kpiSubtext(kpi: ClientPlanKpi): string {
  if (!kpi.baseline_established) {
    return "Baseline not yet established";
  }
  if (kpi.progress_pct !== null) {
    return `Target ${kpi.target} · ${kpi.progress_pct}% of goal`;
  }
  if (kpi.current_value === null) {
    return `Target ${kpi.target} · no reading yet`;
  }
  return `Target ${kpi.target}`;
}

export function PlanKpiWidgets({ kpis }: { kpis: ClientPlanKpi[] }) {
  if (kpis.length === 0) return null;

  return (
    <div className="row g-2">
      {kpis.map((kpi) => (
        <div key={kpi.kpi_id} className="col-6 col-xl-3">
          <div className={`staff-kpi-card${kpi.at_risk ? " at-risk" : ""}`}>
            <div className="small text-body-secondary text-truncate" title={kpi.label}>
              {kpi.label}
            </div>
            <div className="staff-kpi-value">
              {formatMetricValue(kpi.current_value, kpi.unit)}
            </div>
            <div className="small text-body-secondary">{kpiSubtext(kpi)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
