"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";

const STORAGE_KEY = "corduroy.staff.selectedClientId";
const CHANGE_EVENT = "corduroy:staff-client-change";

function readSelectedClientId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(STORAGE_KEY) ?? "";
}

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useStaffSelectedClient(clients: StaffDashboardClient[]) {
  const selectedId = useSyncExternalStore(
    subscribe,
    readSelectedClientId,
    () => "",
  );

  const selectClient = useCallback((clientId: string) => {
    sessionStorage.setItem(STORAGE_KEY, clientId);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const selectedClient =
    clients.find((client) => client.id === selectedId) ?? clients[0] ?? null;

  return { selectedId, selectedClient, selectClient };
}
