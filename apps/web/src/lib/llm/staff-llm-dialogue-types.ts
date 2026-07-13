export type StaffLlmRole = "user" | "assistant";

export type StaffLlmMessage = {
  role: StaffLlmRole;
  content: string;
};

export type StaffLlmDialogueRequest = {
  messages: StaffLlmMessage[];
  clientName?: string | null;
};

export type StaffLlmDialogueResponse = {
  reply: string;
  model: string;
  grounded: boolean;
  live: boolean;
};

export type StaffLlmConnectionState =
  | "connected"
  | "preview"
  | "billing"
  | "error";

export type StaffLlmStatusResponse = {
  state: StaffLlmConnectionState;
  provider: string;
  model: string | null;
  detail?: string;
};

export type StaffLlmErrorCode =
  | "billing"
  | "rate_limit"
  | "auth"
  | "model"
  | "provider"
  | "unknown";

export type StaffLlmErrorBody = {
  error: string;
  code: StaffLlmErrorCode;
};
