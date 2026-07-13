import { StaffApiHttpError } from "@/lib/admin-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import {
  loadClientSourceBindingOptions,
  loadVaultSourceBindings,
} from "@/lib/vault-source-bindings";
import type {
  VaultSourceBindingUpdateRequest,
  VaultSourceBindingUpdateResponse,
} from "@/lib/vault-source-binding-types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get("client_id")?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    await supabase.auth.getUser();
    const data = await loadVaultSourceBindings(supabase, clientId);

    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error, "Source binding query failed");
  }
}

export async function PATCH(request: Request) {
  const body = (await request
    .json()
    .catch(() => ({}))) as Partial<VaultSourceBindingUpdateRequest>;
  const clientId = body.client_id?.trim();
  const objectId = body.object_id?.trim();

  if (!clientId || !objectId) {
    return NextResponse.json(
      { error: "client_id and object_id are required" },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.source_bindings)) {
    return NextResponse.json(
      { error: "source_bindings must be an array" },
      { status: 400 },
    );
  }

  const requested = normalizeBindings(body.source_bindings);

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: object, error: objectError } = await supabase
      .from("vault_objects")
      .select("id")
      .eq("id", objectId)
      .eq("client_id", clientId)
      .maybeSingle();

    if (objectError) {
      return NextResponse.json({ error: objectError.message }, { status: 500 });
    }

    if (!object) {
      return NextResponse.json({ error: "Vault object not found" }, { status: 404 });
    }

    // Only allow bindings that are live on the client's active metrics.
    const options = await loadClientSourceBindingOptions(supabase, clientId);
    const allowed = new Set(options.map((option) => option.value));
    const invalid = requested.filter((binding) => !allowed.has(binding));

    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Unknown source binding(s): ${invalid.join(", ")}` },
        { status: 400 },
      );
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("vault_object_source_bindings")
      .select("source_binding")
      .eq("client_id", clientId)
      .eq("vault_object_id", objectId);

    if (existingError) {
      return errorResponse(existingError, "Source binding update failed");
    }

    const existing = new Set(
      (existingRows ?? []).map((row) => (row as { source_binding: string }).source_binding),
    );
    const requestedSet = new Set(requested);

    const toRemove = [...existing].filter((binding) => !requestedSet.has(binding));
    const toAdd = requested.filter((binding) => !existing.has(binding));

    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("vault_object_source_bindings")
        .delete()
        .eq("client_id", clientId)
        .eq("vault_object_id", objectId)
        .in("source_binding", toRemove);

      if (deleteError) {
        return errorResponse(deleteError, "Source binding update failed");
      }
    }

    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from("vault_object_source_bindings")
        .insert(
          toAdd.map((binding) => ({
            vault_object_id: objectId,
            client_id: clientId,
            source_binding: binding,
            tagged_by: user.id,
          })),
        );

      if (insertError) {
        return errorResponse(insertError, "Source binding update failed");
      }
    }

    const response: VaultSourceBindingUpdateResponse = {
      object_id: objectId,
      source_bindings: [...requestedSet].sort((a, b) => a.localeCompare(b)),
    };

    return NextResponse.json(response);
  } catch (error) {
    return errorResponse(error, "Source binding update failed");
  }
}

function normalizeBindings(values: unknown[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (trimmed) {
      seen.add(trimmed);
    }
  }
  return [...seen];
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof StaffApiHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallback;
  const status = message.includes("not assigned") ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}
