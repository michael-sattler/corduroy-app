export type HealthStatus = "healthy" | "degraded" | "down";

export type HealthCheck = {
  service: string;
  status: HealthStatus;
  detail: string;
  latencyMs: number | null;
  checkedAt: string;
};

export type PromptRecord = {
  id: string;
  name: string;
  version: string;
  body: string;
  updated_at: string;
  updated_by: string | null;
};

export type WaitlistRecord = {
  id: string;
  name: string;
  company: string;
  email: string;
  status: "new" | "contacted" | "scheduled" | "declined";
  notes?: string;
  referral_source?: string;
  submitted_at: string;
  updated_at: string;
};

export type ClientRecord = {
  id: string;
  name: string;
  created_at: string;
  user_count: number;
  logo_path: string | null;
  logo_updated_at: string | null;
};

export type ClientUserRecord = {
  id: string;
  user_id: string;
  client_id: string;
  display_name: string;
  created_at: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
};

export type StaffRecord = {
  id: string;
  user_id: string;
  role: "principal" | "advisor" | "admin";
  approved: boolean;
  created_at: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
};

export type StaffListRecord = StaffRecord & {
  email: string;
  display_name: string;
};

export type PortalUserListRecord = ClientUserRecord & {
  email: string;
};

export function formatHealthCheckedAt(iso: string): string {
  const date = new Date(iso);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  return formatHealthCheckedTime(iso);
}

/** SSR-safe — fixed locale + UTC (avoids server/client timezone hydration mismatch). */
export function formatHealthCheckedTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatWaitlistStatus(
  status: WaitlistRecord["status"],
): string {
  const labels: Record<WaitlistRecord["status"], string> = {
    new: "New",
    contacted: "Contacted",
    scheduled: "Scheduled",
    declined: "Declined",
  };
  return labels[status];
}

export function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStaffRole(role: StaffRecord["role"]): string {
  const labels: Record<StaffRecord["role"], string> = {
    principal: "Principal",
    advisor: "Advisor",
    admin: "Admin",
  };
  return labels[role];
}

export function truncateId(id: string, length = 8): string {
  return id.length > length ? `${id.slice(0, length)}…` : id;
}
