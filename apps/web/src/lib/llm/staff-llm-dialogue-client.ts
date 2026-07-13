import type {
  StaffLlmDialogueRequest,
  StaffLlmDialogueResponse,
  StaffLlmErrorCode,
  StaffLlmStatusResponse,
} from "@/lib/llm/staff-llm-dialogue-types";

export class StaffLlmDialogueError extends Error {
  readonly code: StaffLlmErrorCode;

  constructor(
    message: string,
    options?: { code?: StaffLlmErrorCode; cause?: unknown },
  ) {
    super(message);
    this.name = "StaffLlmDialogueError";
    this.code = options?.code ?? "unknown";
    this.cause = options?.cause;
  }
}

export async function requestStaffLlmDialogue(
  body: StaffLlmDialogueRequest,
  signal?: AbortSignal,
): Promise<StaffLlmDialogueResponse> {
  let res: Response;
  try {
    res = await fetch("/api/staff/llm/dialogue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new StaffLlmDialogueError("Could not reach the assistant", {
      code: "provider",
      cause: error,
    });
  }

  const payload = (await res.json().catch(() => ({}))) as
    | StaffLlmDialogueResponse
    | { error?: string; code?: StaffLlmErrorCode };

  if (!res.ok) {
    throw new StaffLlmDialogueError(
      "error" in payload && payload.error
        ? payload.error
        : `Assistant request failed (${res.status})`,
      { code: "code" in payload ? payload.code : undefined },
    );
  }

  return payload as StaffLlmDialogueResponse;
}

export async function fetchStaffLlmStatus(
  signal?: AbortSignal,
): Promise<StaffLlmStatusResponse> {
  let res: Response;
  try {
    res = await fetch("/api/staff/llm/status", {
      method: "GET",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new StaffLlmDialogueError("Could not reach the assistant", {
      code: "provider",
      cause: error,
    });
  }

  const payload = (await res.json().catch(() => ({}))) as
    | StaffLlmStatusResponse
    | { error?: string };

  if (!res.ok) {
    throw new StaffLlmDialogueError(
      "error" in payload && payload.error
        ? payload.error
        : `Assistant status check failed (${res.status})`,
    );
  }

  return payload as StaffLlmStatusResponse;
}
