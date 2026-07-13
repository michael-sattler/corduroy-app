import { uploadVaultFile, VaultUploadError } from "@/lib/vault-upload-client";
import {
  parsePlanDocumentJson,
  PlanDocumentValidationError,
} from "@/lib/plan/validate-plan-document";
import type { PlanDocument } from "@/lib/plan/types";
import type { PlanIngestRequest, PlanUploadResult } from "@/lib/plan-upload-types";

export class PlanUploadError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "PlanUploadError";
  }
}

async function requestPlanIngest(
  body: PlanIngestRequest & { document: PlanDocument },
): Promise<PlanUploadResult["ingest"]> {
  let res: Response;
  try {
    res = await fetch("/api/staff/plan/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new PlanUploadError("Could not reach plan ingest API");
  }

  const payload = (await res.json().catch(() => ({}))) as
    | PlanUploadResult["ingest"]
    | { error?: string };

  if (!res.ok) {
    throw new PlanUploadError(
      "error" in payload && payload.error
        ? payload.error
        : `Plan ingest failed (${res.status})`,
    );
  }

  return payload as PlanUploadResult["ingest"];
}

export async function uploadAndIngestPlanJson(
  file: File,
  clientId: string,
): Promise<PlanUploadResult> {
  const text = await file.text();

  let document;
  try {
    document = parsePlanDocumentJson(text);
  } catch (error) {
    if (error instanceof PlanDocumentValidationError) {
      throw new PlanUploadError(error.message, error);
    }
    throw error;
  }

  const planFile = new File([text], file.name, { type: "application/json" });

  let vaultResult;
  try {
    vaultResult = await uploadVaultFile(planFile, "plan", {
      scope: "staff",
      clientId,
    });
  } catch (error) {
    if (error instanceof VaultUploadError) {
      throw new PlanUploadError(error.message, error);
    }
    throw error;
  }

  const ingest = await requestPlanIngest({
    client_id: clientId,
    s3_key: vaultResult.s3_key,
    plan_id: document.plan.id,
    plan_title: document.plan.title,
    size_bytes: vaultResult.size_bytes,
    document,
  });

  return {
    vault: {
      s3_key: vaultResult.s3_key,
      bucket_name: vaultResult.bucket_name,
      size_bytes: vaultResult.size_bytes,
    },
    ingest,
  };
}
