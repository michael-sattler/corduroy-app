export type ClientNavKey = "vault" | "plan" | "dashboard" | "coach";

export type StaffNavKey = "portfolio" | "reviews" | "plan-editor" | "admin";

export type AppSurface = "client" | "staff";

export const clientNavItems: {
  key: ClientNavKey;
  label: string;
  href: string;
  disabled?: boolean;
}[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard" },
  { key: "vault", label: "Vault", href: "/vault" },
  { key: "plan", label: "90-day plan", href: "/plan" },
  { key: "coach", label: "Coach", href: "/dashboard", disabled: true },
];

export const staffNavItems: {
  key: StaffNavKey;
  label: string;
  href: string;
  disabled?: boolean;
}[] = [
  { key: "portfolio", label: "Client portfolio", href: "/dashboard" },
  { key: "reviews", label: "Weekly reviews", href: "/dashboard", disabled: true },
  { key: "plan-editor", label: "Plan editor", href: "/dashboard", disabled: true },
  { key: "admin", label: "Admin Tools", href: "/admin" },
];
