import type {
  VaultClassificationUpdateRequest,
  VaultClassificationUpdateResponse,
} from "@/lib/vault-classification-types";
import type { VaultApiContext } from "@/lib/vault-api-context";

export class VaultClassificationError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VaultClassificationError";
  }
}

export async function updateVaultClassification(
  objectId: string,
  patch: Omit<VaultClassificationUpdateRequest, "object_id" | "client_id">,
  context: Extract<VaultApiContext, { scope: "staff" }>,
): Promise<VaultClassificationUpdateResponse> {
  const body: VaultClassificationUpdateRequest = {
    object_id: objectId,
    client_id: context.clientId,
    ...patch,
  };

  const res = await fetch("/api/staff/vault/classification", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseBody = (await res.json().catch(() => ({}))) as
    | VaultClassificationUpdateResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultClassificationError(
      "error" in responseBody && responseBody.error
        ? responseBody.error
        : `Classification update failed (${res.status})`,
      res.status,
    );
  }

  return responseBody as VaultClassificationUpdateResponse;
}
