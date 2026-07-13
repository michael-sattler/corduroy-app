export const STAFF_CLIENT_DETAIL_TABS = [
  { key: "dashboard", label: "Dashboard", documentTitle: "Staff Dashboard" },
  { key: "plan", label: "Current Plan", documentTitle: "Current Plan" },
  { key: "admin", label: "Documents", documentTitle: "Vault" },
] as const;

export type StaffClientDetailTabKey =
  (typeof STAFF_CLIENT_DETAIL_TABS)[number]["key"];

export function isStaffClientDetailTabKey(
  value: string,
): value is StaffClientDetailTabKey {
  return STAFF_CLIENT_DETAIL_TABS.some((tab) => tab.key === value);
}

export function staffClientDetailTabTitle(tab: StaffClientDetailTabKey): string {
  const config = STAFF_CLIENT_DETAIL_TABS.find((entry) => entry.key === tab);
  return `${config?.documentTitle ?? "Dashboard"} | Corduroy`;
}
