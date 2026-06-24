export const adminActivityStats = [
  { label: "Client logins (7d)", value: "142", trend: "+12%" },
  { label: "Staff logins (7d)", value: "28", trend: "+4%" },
  { label: "Vault uploads (7d)", value: "67", trend: "+18%" },
  { label: "File accesses (7d)", value: "1,204", trend: "+6%" },
  { label: "Task check-offs (7d)", value: "89", trend: "+22%" },
  { label: "Plan edits (7d)", value: "34", trend: "−3%" },
] as const;

export const adminHealthChecks = [
  {
    service: "Orchestration API",
    status: "healthy" as const,
    detail: "GET /health — 42ms",
    checkedAt: "2 min ago",
  },
  {
    service: "Supabase Auth",
    status: "healthy" as const,
    detail: "JWT validation OK",
    checkedAt: "2 min ago",
  },
  {
    service: "S3 (VPC endpoint)",
    status: "degraded" as const,
    detail: "Elevated latency on eu-west-1 path",
    checkedAt: "5 min ago",
  },
  {
    service: "AccessBroker Lambda",
    status: "healthy" as const,
    detail: "Pre-signed URL mint — OK",
    checkedAt: "2 min ago",
  },
] as const;

export const adminPrompts = [
  {
    id: "plan-generation",
    name: "90-day plan generation",
    version: "v3.2",
    updatedAt: "Mar 18, 2026",
    updatedBy: "Joseph Rizzo",
  },
  {
    id: "coach-injection",
    name: "Coach message injection",
    version: "v1.8",
    updatedAt: "Mar 12, 2026",
    updatedBy: "Joseph Rizzo",
  },
  {
    id: "vault-extract",
    name: "Vault document extraction",
    version: "v2.0",
    updatedAt: "Feb 28, 2026",
    updatedBy: "Corduroy Advisor",
  },
  {
    id: "review-queue",
    name: "Advisor review summary",
    version: "v1.1",
    updatedAt: "Feb 14, 2026",
    updatedBy: "Joseph Rizzo",
  },
] as const;

export const adminWaitlist = [
  {
    id: "wl-1042",
    name: "Sarah Mitchell",
    company: "Mitchell HVAC Services",
    email: "sarah@mitchellhvac.test",
    submittedAt: "Mar 24, 2026",
    status: "New",
  },
  {
    id: "wl-1041",
    name: "David Chen",
    company: "Chen Commercial Roofing",
    email: "david@chenroofing.test",
    submittedAt: "Mar 23, 2026",
    status: "Contacted",
  },
  {
    id: "wl-1040",
    name: "Angela Brooks",
    company: "Brooks Landscaping",
    email: "angela@brooksland.test",
    submittedAt: "Mar 21, 2026",
    status: "Scheduled",
  },
  {
    id: "wl-1039",
    name: "Tom Reyes",
    company: "Reyes Auto Body",
    email: "tom@reyesauto.test",
    submittedAt: "Mar 19, 2026",
    status: "Declined",
  },
] as const;

export type WaitlistEntry = (typeof adminWaitlist)[number];

export function getWaitlistEntry(id: string): WaitlistEntry | undefined {
  return adminWaitlist.find((entry) => entry.id === id);
}
