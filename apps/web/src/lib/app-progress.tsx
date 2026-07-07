"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppProgressContextValue = {
  active: boolean;
  startProgress: () => void;
  stopProgress: () => void;
};

const AppProgressContext = createContext<AppProgressContextValue | null>(null);

export function AppProgressProvider({ children }: { children: ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);

  const startProgress = useCallback(() => {
    setActiveCount((count) => count + 1);
  }, []);

  const stopProgress = useCallback(() => {
    setActiveCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({
      active: activeCount > 0,
      startProgress,
      stopProgress,
    }),
    [activeCount, startProgress, stopProgress],
  );

  return (
    <AppProgressContext.Provider value={value}>
      {children}
    </AppProgressContext.Provider>
  );
}

export function useAppProgress() {
  const context = useContext(AppProgressContext);
  if (!context) {
    throw new Error("useAppProgress must be used within AppProgressProvider");
  }
  return context;
}
