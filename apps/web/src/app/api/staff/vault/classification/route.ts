import { StaffApiHttpError } from "@/lib/admin-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { isValidVaultCategory } from "@/lib/vault-categories";
import type { VaultClassificationPatch } from "@/lib/vault-classification-types";
import {
  VAULT_OBJECT_COLUMNS_WITH_CLASSIFICATION,
  normalizeVaultObject,
} from "@/lib/vault-catalog";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CLASSIFICATION_COLUMNS = VAULT_OBJECT_COLUMNS_WITH_CLASSIFICATION;

type ClassificationBody = VaultClassificationPatch & {
  client_id?: string;
  object_id?: string;
};

function hasClassificationPatch(body: ClassificationBody): boolean {
  return (
    "category" in body ||
    "is_latest" in body ||
    "is_ignored" in body ||
    "is_processed" in body ||
    "is_hidden" in body
  );
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ClassificationBody;
  const clientId = body.client_id?.trim();
  const objectId = body.object_id?.trim();

  if (!clientId || !objectId) {
    return NextResponse.json(
      { error: "client_id and object_id are required" },
      { status: 400 },
    );
  }

  if (!hasClassificationPatch(body)) {
    return NextResponse.json(
      { error: "At least one classification field is required" },
      { status: 400 },
    );
  }

  if ("category" in body && !isValidVaultCategory(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update: Record<string, unknown> = {
      classified_at: new Date().toISOString(),
      classified_by: user.id,
    };

    if ("category" in body) {
      update.category = body.category?.trim() || null;
    }
    if ("is_latest" in body) {
      update.is_latest = Boolean(body.is_latest);
    }
    if ("is_ignored" in body) {
      update.is_ignored = Boolean(body.is_ignored);
    }
    if ("is_processed" in body) {
      update.is_processed = Boolean(body.is_processed);
    }
    if ("is_hidden" in body) {
      update.is_hidden = Boolean(body.is_hidden);
    }

    const { data, error } = await supabase
      .from("vault_objects")
      .update(update)
      .eq("id", objectId)
      .eq("client_id", clientId)
      .select(CLASSIFICATION_COLUMNS)
      .maybeSingle();

    if (error) {
      if (
        error.message.includes("column") ||
        error.message.includes("permission denied")
      ) {
        return NextResponse.json(
          {
            error:
              "Vault classification schema is not applied yet. Run migration 20260706213000_vault_object_classification.sql.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Vault object not found" }, { status: 404 });
    }

    return NextResponse.json({
      object: normalizeVaultObject(data as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Classification update failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
