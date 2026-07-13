import type {
  VaultSourceBindingUpdateResponse,
  VaultSourceBindingsResponse,
} from "@/lib/vault-source-binding-types";

export class VaultSourceBindingError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VaultSourceBindingError";
  }
}

const BASE_PATH = "/api/staff/vault/source-bindings";

export async function fetchVaultSourceBindings(
  clientId: string,
): Promise<VaultSourceBindingsResponse> {
  const res = await fetch(`${BASE_PATH}?client_id=${encodeURIComponent(clientId)}`, {
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as
    | VaultSourceBindingsResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultSourceBindingError(
      "error" in body && body.error
        ? body.error
        : `Could not load source bindings (${res.status})`,
      res.status,
    );
  }

  return body as VaultSourceBindingsResponse;
}

export async function updateVaultSourceBindings(
  clientId: string,
  objectId: string,
  sourceBindings: string[],
): Promise<VaultSourceBindingUpdateResponse> {
  const res = await fetch(BASE_PATH, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      object_id: objectId,
      source_bindings: sourceBindings,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as
    | VaultSourceBindingUpdateResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultSourceBindingError(
      "error" in body && body.error
        ? body.error
        : `Could not update source bindings (${res.status})`,
      res.status,
    );
  }

  return body as VaultSourceBindingUpdateResponse;
}
