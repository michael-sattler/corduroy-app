import type { IconDefinition } from "@/lib/fontawesome";
import { faChartPie, faListCheck, faShield } from "@/lib/fontawesome-icons";

export type ClientNavKey = "vault" | "plan" | "dashboard" | "coach";

export type StaffNavKey = "portfolio" | "admin";

export type AppSurface = "client" | "staff";

export const clientNavItems: {
  key: ClientNavKey;
  label: string;
  href: string;
  icon?: IconDefinition;
  disabled?: boolean;
}[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: faChartPie },
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
  { key: "portfolio", label: "Clients", href: "/dashboard" },
  { key: "admin", label: "Admin Tools", href: "/admin" },
];
