import type { PlanDocument } from "@/lib/plan/types";

export class PlanDocumentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanDocumentValidationError";
  }
}

const REQUIRED_TOP_LEVEL_KEYS = [
  "plan",
  "participants",
  "clients",
  "phases",
  "goals",
  "milestones",
  "tasks",
  "kpis",
  "risks",
] as const;

const REQUIRED_PLAN_META_KEYS = [
  "id",
  "title",
  "period_start",
  "period_end",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parsePlanDocumentJson(text: string): PlanDocument {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PlanDocumentValidationError("File is not valid JSON");
  }

  return validatePlanDocument(parsed);
}

export function validatePlanDocument(value: unknown): PlanDocument {
  if (!isRecord(value)) {
    throw new PlanDocumentValidationError("Plan document must be a JSON object");
  }

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(key in value)) {
      throw new PlanDocumentValidationError(`Missing required section: ${key}`);
    }
  }

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!Array.isArray(value[key])) {
      throw new PlanDocumentValidationError(`Section "${key}" must be an array`);
    }
  }

  const plan = value.plan;
  if (!isRecord(plan)) {
    throw new PlanDocumentValidationError('Section "plan" must be an object');
  }

  for (const key of REQUIRED_PLAN_META_KEYS) {
    const field = plan[key];
    if (typeof field !== "string" || !field.trim()) {
      throw new PlanDocumentValidationError(`plan.${key} is required`);
    }
  }

  return value as PlanDocument;
}
