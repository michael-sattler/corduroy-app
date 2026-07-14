import type { IconDefinition } from "@/lib/fontawesome";
import { faListCheck, faShield } from "@/lib/fontawesome-icons";

export type ClientNavKey = "vault" | "plan" | "dashboard" | "coach";

export type StaffNavKey = "portfolio" | "reviews" | "plan-editor" | "admin";

export type AppSurface = "client" | "staff";

export const clientNavItems: {
  key: ClientNavKey;
  label: string;
  href: string;
  icon?: IconDefinition;
  disabled?: boolean;
}[] = [
  // Dashboard and Coach are temporarily hidden; the client portal defaults to the plan.
  { key: "plan", label: "Current Plan", href: "/plan", icon: faListCheck },
  { key: "vault", label: "Vault", href: "/vault", icon: faShield },
];

export const staffNavItems: {
  key: StaffNavKey;
  label: string;
  href: string;
  icon?: IconDefinition;
  disabled?: boolean;
}[] = [
  { key: "portfolio", label: "Client portfolio", href: "/dashboard" },
  { key: "reviews", label: "Weekly reviews", href: "/dashboard", disabled: true },
  { key: "plan-editor", label: "Plan editor", href: "/dashboard", disabled: true },
  { key: "admin", label: "Admin Tools", href: "/admin" },
];
