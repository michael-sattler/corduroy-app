"use client";

import { useCallback, useSyncExternalStore } from "react";
import { staffClients } from "@/lib/placeholder-data";

const STORAGE_KEY = "corduroy.staff.selectedClientId";
const DEFAULT_CLIENT_ID = staffClients[0]?.id ?? "ecs";

const CHANGE_EVENT = "corduroy:staff-client-change";

function readSelectedClientId(): string {
  if (typeof window === "undefined") {
    return DEFAULT_CLIENT_ID;
  }
  return sessionStorage.getItem(STORAGE_KEY) ?? DEFAULT_CLIENT_ID;
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

export function useStaffSelectedClient() {
  const selectedId = useSyncExternalStore(
    subscribe,
    readSelectedClientId,
    () => DEFAULT_CLIENT_ID,
  );

  const selectClient = useCallback((clientId: string) => {
    sessionStorage.setItem(STORAGE_KEY, clientId);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const selectedClient =
    staffClients.find((client) => client.id === selectedId) ?? staffClients[0];

  return { selectedId, selectedClient, selectClient };
}
