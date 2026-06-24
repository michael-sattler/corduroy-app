export type AdminNavKey = "overview" | "prompts" | "waitlist";

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
