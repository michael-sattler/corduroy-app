export type AdminNavKey =
  | "overview"
  | "prompts"
  | "waitlist"
  | "clients"
  | "staff"
  | "metrics";

export const adminNavItems: {
  key: AdminNavKey;
  label: string;
  href: string;
  description: string;
}[] = [
  {
    key: "overview",
    label: "Overview",
    href: "/admin",
    description: "Activity and platform health",
  },
  {
    key: "clients",
    label: "Clients",
    href: "/admin/clients",
    description: "Client organizations and portal users",
  },
  {
    key: "staff",
    label: "Staff",
    href: "/admin/staff",
    description: "Corduroy team accounts",
  },
  {
    key: "metrics",
    label: "Metric catalog",
    href: "/admin/metrics",
    description: "Universal KPI library and bespoke metrics",
  },
  {
    key: "prompts",
    label: "Prompt library",
    href: "/admin/prompts",
    description: "Tune AI prompts stored in the database",
  },
  {
    key: "waitlist",
    label: "Wait list",
    href: "/admin/waitlist",
    description: "Main-site consultation signups",
  },
];
