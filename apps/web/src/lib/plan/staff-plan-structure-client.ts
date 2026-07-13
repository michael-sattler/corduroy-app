import type {
  StaffPlanGoalPatch,
  StaffPlanGoalUpdateResponse,
  StaffPlanInitiativePatch,
  StaffPlanInitiativeUpdateResponse,
} from "@/lib/plan/staff-plan-structure-types";

const ENDPOINT = "/api/staff/plan/structure";

async function patchStructure<T>(body: unknown): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseBody = (await res.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    const message =
      typeof responseBody.error === "string"
        ? responseBody.error
        : `Update failed (${res.status})`;
    throw new Error(message);
  }

  return responseBody as T;
}

export async function updatePlanInitiative(
  clientId: string,
  initiativeId: string,
  patch: StaffPlanInitiativePatch,
): Promise<StaffPlanInitiativeUpdateResponse["initiative"]> {
  const result = await patchStructure<StaffPlanInitiativeUpdateResponse>({
    client_id: clientId,
    kind: "initiative",
    id: initiativeId,
    patch,
  });
  return result.initiative;
}

export async function updatePlanGoal(
  clientId: string,
  goalId: string,
  patch: StaffPlanGoalPatch,
): Promise<StaffPlanGoalUpdateResponse["goal"]> {
  const result = await patchStructure<StaffPlanGoalUpdateResponse>({
    client_id: clientId,
    kind: "goal",
    id: goalId,
    patch,
  });
  return result.goal;
}
