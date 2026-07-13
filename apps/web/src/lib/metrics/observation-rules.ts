// Framework-agnostic business rules for recording a metric observation.
//
// This module has NO dependencies on Next.js, Supabase, or React so it can be
// shared verbatim by every ingestion path: the manual staff tool today, and
// the LLM/connector ingestion layer later (which will hydrate the same
// `metric_observations` rows). Keep it pure — validation/normalization only,
// no I/O.

export type ObservationMetricShape = {
  /** metric_definitions.kind — observed | derived | ratio */
  kind: string;
  /** metric_definitions.unit — currency | percent | count | days | ratio | months */
  unit: string;
  /** metric_definitions.stock_flow — stock | flow | null */
  stock_flow: string | null;
};

export type ObservationInput = {
  /** Raw value as entered (string so the caller need not pre-parse). */
  value: string;
  /** Inclusive start of the valid-time window (YYYY-MM-DD). Flow metrics only. */
  periodStart: string;
  /** Inclusive end / "as of" date (YYYY-MM-DD). */
  periodEnd: string;
  /** Human identifier for the source document/record the number came from. */
  sourceDocument: string;
};

export type NormalizedObservation = {
  value: number;
  periodStart: string;
  periodEnd: string;
  /** Kept in sync with periodEnd for the current_value cache trigger. */
  observedOn: string;
  sourceDocument: string;
};

export type ObservationValidation =
  | { ok: true; observation: NormalizedObservation; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Only observed metrics carry a directly-measured value. */
export function isManuallyObservable(kind: string): boolean {
  return kind === "observed";
}

/** Flow metrics accrue over a window; everything else is a point-in-time stock. */
export function requiresPeriodRange(stockFlow: string | null): boolean {
  return stockFlow === "flow";
}

function collectUnitWarnings(
  unit: string,
  value: number,
  warnings: string[],
): void {
  switch (unit) {
    case "count":
      if (!Number.isInteger(value)) {
        warnings.push("Count metrics are usually whole numbers.");
      }
      if (value < 0) {
        warnings.push("Count is negative — double-check the value.");
      }
      break;
    case "percent":
      if (value < 0 || value > 100) {
        warnings.push("Percent is outside the 0–100 range.");
      }
      break;
    case "ratio":
      if (value < -1 || value > 1) {
        warnings.push("Ratio is outside the usual −1 to 1 range.");
      }
      break;
    case "days":
    case "months":
      if (value < 0) {
        warnings.push("Value is negative — double-check.");
      }
      break;
    default:
      break;
  }
}

/**
 * Validate and normalize a proposed observation against its metric definition.
 * `today` is injectable for deterministic testing; defaults to the local date.
 */
export function validateObservationInput(
  metric: ObservationMetricShape,
  input: ObservationInput,
  today: string = new Date().toISOString().slice(0, 10),
): ObservationValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isManuallyObservable(metric.kind)) {
    errors.push(
      `${metric.kind} metrics are computed from their inputs and cannot be observed manually.`,
    );
    return { ok: false, errors, warnings };
  }

  const trimmedValue = input.value.trim();
  const value = Number(trimmedValue);
  const valueOk = trimmedValue !== "" && Number.isFinite(value);
  if (!valueOk) {
    errors.push("Enter a numeric value.");
  }

  const isFlow = requiresPeriodRange(metric.stock_flow);
  const periodEnd = input.periodEnd.trim();
  // A stock collapses to a single instant: start = end.
  const periodStart = isFlow ? input.periodStart.trim() : periodEnd;

  if (!ISO_DATE.test(periodEnd)) {
    errors.push(
      isFlow ? "Enter a valid period end date." : "Enter a valid observation date.",
    );
  } else if (periodEnd > today) {
    errors.push("The observation date cannot be in the future.");
  }

  if (isFlow) {
    if (!ISO_DATE.test(periodStart)) {
      errors.push("Enter a valid period start date.");
    } else if (ISO_DATE.test(periodEnd) && periodEnd < periodStart) {
      errors.push("Period end must be on or after period start.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }

  collectUnitWarnings(metric.unit, value, warnings);

  return {
    ok: true,
    observation: {
      value,
      periodStart,
      periodEnd,
      observedOn: periodEnd,
      sourceDocument: input.sourceDocument.trim(),
    },
    warnings,
  };
}
