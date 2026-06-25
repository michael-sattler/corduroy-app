import {
  formatKpiTarget,
  formatKpiValue,
  kpiProgressPct,
} from "@/lib/plan/derive";
import type { Kpi } from "@/lib/plan/types";

const FEATURED_KPI_IDS = ["kpi_002", "kpi_003", "kpi_004", "kpi_001"] as const;

export function featuredKpis(kpis: Kpi[]): Kpi[] {
  const byId = new Map(kpis.map((k) => [k.id, k]));
  return FEATURED_KPI_IDS.map((id) => byId.get(id)).filter(
    (k): k is Kpi => k !== undefined,
  );
}

function shortKpiLabel(kpi: Kpi): string {
  if (kpi.id === "kpi_002") return "MRR";
  if (kpi.id === "kpi_003") return "Sign-ups";
  if (kpi.id === "kpi_004") return "Visit frequency";
  if (kpi.id === "kpi_001") return "Churn rate";
  return kpi.name;
}

function KpiDonut({ kpi }: { kpi: Kpi }) {
  const pct = kpiProgressPct(kpi);
  const size = 92;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="plan-kpi-donut" aria-hidden>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--app-purple)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="plan-kpi-donut-center">
        <div className="plan-kpi-donut-value">{formatKpiValue(kpi)}</div>
        <div className="plan-kpi-donut-pct">{pct}% to goal</div>
      </div>
    </div>
  );
}

function KpiColumnChart({ kpi }: { kpi: Kpi }) {
  const columns = [
    { label: "Baseline", value: kpi.initial_value, tone: "muted" },
    { label: "Current", value: kpi.current_value, tone: "current" },
    { label: "Target", value: kpi.target_value, tone: "target" },
  ] as const;

  const max = Math.max(...columns.map((c) => c.value), 0.01);

  return (
    <div className="plan-kpi-columns" aria-hidden>
      {columns.map((col) => (
        <div key={col.label} className="plan-kpi-column">
          <div className="plan-kpi-column-track">
            <div
              className={`plan-kpi-column-bar plan-kpi-column-bar--${col.tone}`}
              style={{ height: `${(col.value / max) * 100}%` }}
            />
          </div>
          <div className="plan-kpi-column-label">{col.label}</div>
          <div className="plan-kpi-column-value">
            {kpi.unit === "%" ? `${col.value}%` : col.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiWidget({ kpi }: { kpi: Kpi }) {
  const isChurn = kpi.id === "kpi_001";

  return (
    <div className="plan-kpi-widget">
      <div className="plan-kpi-widget-header">
        <div className="plan-kpi-widget-title">{shortKpiLabel(kpi)}</div>
        <div className="plan-kpi-widget-subtitle text-truncate" title={kpi.name}>
          {kpi.name}
        </div>
      </div>
      <div className="plan-kpi-widget-chart">
        {isChurn ? <KpiColumnChart kpi={kpi} /> : <KpiDonut kpi={kpi} />}
      </div>
      <div className="plan-kpi-widget-footer">
        <span>Target {formatKpiTarget(kpi)}</span>
        <span className="text-body-secondary">{kpi.frequency}</span>
      </div>
    </div>
  );
}

export function PlanKpiWidgets({ kpis }: { kpis: Kpi[] }) {
  const featured = featuredKpis(kpis);
  if (featured.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="plan-sidebar-label mb-3">Key metrics</div>
      <div className="row g-3">
        {featured.map((kpi) => (
          <div key={kpi.id} className="col-sm-6 col-xl-3">
            <KpiWidget kpi={kpi} />
          </div>
        ))}
      </div>
    </section>
  );
}
