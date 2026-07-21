import { enqueueAnalysisJob } from "./analysis-queue.js";
import {
  createStaffReanalysisJob,
  insertAnalysisEvent,
  resolveReanalysisTarget,
} from "./storage.js";

const SUPPORTED_TYPES = new Set(["pdf", "csv", "spreadsheet", "document"]);

export async function queueStaffReanalysis(input: {
  clientId: string;
  vaultObjectId: string;
}): Promise<{ jobId: string }> {
  const target = await resolveReanalysisTarget({
    client_id: input.clientId,
    vault_object_id: input.vaultObjectId,
  });
  if (!SUPPORTED_TYPES.has(target.object_type)) {
    throw new Error("This Vault file type is not supported for document analysis.");
  }

  const jobId = await createStaffReanalysisJob({
    client_id: input.clientId,
    vault_object_id: input.vaultObjectId,
  });
  await insertAnalysisEvent({
    job_id: jobId,
    client_id: input.clientId,
    stage: "queued",
    message: "Staff requested reanalysis of this Vault document.",
  });
  const queued = await enqueueAnalysisJob({ jobId, bucket: target.bucket_name });
  if (!queued) {
    throw new Error("Document analysis is not enabled in this environment.");
  }
  return { jobId };
}
