import "server-only";

import type { PlanDocument } from "@/lib/plan/types";
import type { PlanIngestRequest, PlanIngestResponse } from "@/lib/plan-upload-types";

/**
 * Extract plan elements from a Corduroy plan JSON document and persist them
 * for the client. Stub implementation — database writes come next.
 */
export async function ingestPlan(
  request: PlanIngestRequest,
  document: PlanDocument,
): Promise<PlanIngestResponse> {
  return {
    status: "stub",
    client_id: request.client_id,
    plan_id: request.plan_id,
    s3_key: request.s3_key,
    message:
      "Plan ingest stub — vault copy stored; database persistence not implemented yet.",
    counts: {
      participants: document.participants.length,
      phases: document.phases.length,
      goals: document.goals.length,
      milestones: document.milestones.length,
      tasks: document.tasks.length,
      kpis: document.kpis.length,
      risks: document.risks.length,
    },
  };
}
